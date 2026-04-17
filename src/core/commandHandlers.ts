// Stubs por domínio — lógica nas stories seguintes; mantém fronteira clara commands → core.
import './cluster/index.js'
import './modules/index.js'
import './logging/index.js'
import {convergeClusterUp} from './cluster/convergeUp.js'
import {K3dRunner} from './cluster/k3dRunner.js'
import {collectLabStatus} from './cluster/labStatus.js'
import {tearDownLabCluster} from './cluster/tearDown.js'
import {loadStarfleetConfig} from './config/index.js'
import {formatModuleCatalogHuman, scanModuleCatalog} from './modules/catalog.js'
import {runCatalogQualityGate} from './modules/catalogGate.js'
import {applyAddModule, applyProfileModules, applyRemoveModule} from './modules/moduleApply.js'
import {ExitCode} from './errors/exitCodes.js'
import {StarfleetError} from './errors/StarfleetError.js'

export type CommandResult = {
  message: string
  upAction?: 'created' | 'unchanged' | 'recovered'
  downAction?: 'deleted' | 'already-absent'
  statusData?: Record<string, unknown>
  listData?: Record<string, unknown>
  addData?: Record<string, unknown>
  removeData?: Record<string, unknown>
  catalogCheckData?: Record<string, unknown>
  profileApplyData?: Record<string, unknown>
}

function requireConfig(cwd: string): void {
  loadStarfleetConfig(cwd)
}

export async function runUp(options?: {
  runner?: K3dRunner
  /** Após o cluster, aplica módulos do perfil (starfleet.yaml profiles). */
  profile?: string
}): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  const config = loadStarfleetConfig(cwd)

  if (process.env.STARFLEET_SIMULATE_EXTERNAL_FAILURE === '1') {
    throw new StarfleetError({
      code: 'CLUSTER_TOOL_MISSING',
      message: 'Ferramenta externa necessária não encontrada (simulado).',
      hint: 'Instale o binário do cluster (ex.: k3d) ou ajuste o PATH.',
      exitCode: ExitCode.cluster,
    })
  }
  if (process.env.STARFLEET_SIMULATE_INTERNAL_FAILURE === '1') {
    throw new Error('Falha interna simulada para testes')
  }

  const runner = options?.runner ?? new K3dRunner()
  const {message, action} = await convergeClusterUp(cwd, config, runner)

  let extra = ''
  let profileApplied: string[] = []
  const profileName = options?.profile?.trim()
  if (profileName) {
    const prof = config.profiles?.[profileName]
    if (!prof) {
      throw new StarfleetError({
        code: 'CONFIG_PROFILE_UNKNOWN',
        message: `Perfil desconhecido: ${profileName}`,
        hint: 'Defina profiles.<nome>.modules em starfleet.yaml.',
        exitCode: ExitCode.usage,
      })
    }
    const r = await applyProfileModules(cwd, prof.modules)
    extra = `\n${r.message}`
    profileApplied = r.applied
  }

  return {
    message: message + extra,
    upAction: action,
    ...(profileName
      ? {profileApplyData: {profile: profileName, applied: profileApplied}}
      : {}),
  }
}

export async function runDown(options?: {runner?: K3dRunner}): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  const config = loadStarfleetConfig(cwd)
  const runner = options?.runner ?? new K3dRunner()
  const {message, action} = await tearDownLabCluster(cwd, config, runner)
  return {message, downAction: action}
}

export async function runStatus(options?: {runner?: K3dRunner}): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  const config = loadStarfleetConfig(cwd)
  const runner = options?.runner ?? new K3dRunner()
  const {message, statusData} = await collectLabStatus(cwd, config, runner)
  return {message, statusData}
}

export async function runList(): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  const catalog = scanModuleCatalog(cwd)
  const message = formatModuleCatalogHuman(catalog, cwd)
  const listData: Record<string, unknown> = {
    catalogRoot: catalog.catalogRoot,
    modules: catalog.entries.map((e) =>
      e.kind === 'valid'
        ? {
            kind: 'valid',
            directory: e.directory,
            path: e.relativePath,
            name: e.name,
            description: e.description,
            version: e.version,
            dependencies: e.dependencies,
            promoted: e.promoted ?? false,
          }
        : {
            kind: 'invalid',
            directory: e.directory,
            path: e.relativePath,
            moduleYamlPath: e.moduleYamlPath,
            message: e.message,
            hint: e.hint,
          },
    ),
  }
  return {message, listData}
}

export async function runAdd(options: {module: string; upgrade: boolean}): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  requireConfig(cwd)
  const mod = options.module.trim()
  if (mod.length === 0) {
    throw new StarfleetError({
      code: 'INPUT_REQUIRED',
      message: 'Indique o módulo a adicionar.',
      hint: 'Ex.: starfleet add demo-metrics',
      exitCode: ExitCode.usage,
    })
  }
  const r = await applyAddModule(cwd, mod, {upgrade: options.upgrade})
  return {
    message: r.message,
    addData: {module: mod, plan: r.plan, applied: r.applied, upgrade: options.upgrade},
  }
}

export async function runRemove(options: {module: string}): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  requireConfig(cwd)
  const mod = options.module.trim()
  if (mod.length === 0) {
    throw new StarfleetError({
      code: 'INPUT_REQUIRED',
      message: 'Indique o módulo a remover.',
      hint: 'Ex.: starfleet remove demo-metrics',
      exitCode: ExitCode.usage,
    })
  }
  const r = await applyRemoveModule(cwd, mod)
  return {message: r.message, removeData: {module: mod}}
}

export async function runCatalogCheck(): Promise<CommandResult> {
  const cwd = process.env.STARFLEET_WORKDIR?.trim() || process.cwd()
  const r = runCatalogQualityGate(cwd)
  return {message: r.message, catalogCheckData: {promotedChecked: r.promotedChecked, ok: true}}
}
