import {exec} from 'node:child_process'
import {promisify} from 'node:util'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {readState, writeState} from '../state/index.js'
import {STATE_SCHEMA_VERSION} from '../state/paths.js'
import type {CatalogModuleValid} from './catalog.js'
import {validModulesOnly} from './catalog.js'
import {resolveModuleInstallOrder, type DepGraph} from './resolveDependencies.js'

const execAsync = promisify(exec)

function hooksDryRun(): boolean {
  const v = process.env.STARFLEET_MODULE_HOOKS_DRY_RUN?.trim().toLowerCase()
  return v === '1' || v === 'true' || v === 'yes'
}

export function buildDepGraphFromCatalog(validModules: CatalogModuleValid[]): DepGraph {
  const g: DepGraph = new Map()
  for (const m of validModules) {
    g.set(m.directory, {dependencies: m.dependencies})
  }
  return g
}

export function getValidModuleMap(cwd: string): Map<string, CatalogModuleValid> {
  const m = new Map<string, CatalogModuleValid>()
  for (const v of validModulesOnly(cwd)) {
    m.set(v.directory, v)
  }
  return m
}

async function runShellHooks(
  phase: 'install' | 'uninstall',
  moduleId: string,
  absoluteDir: string,
  commands: string[] | undefined,
): Promise<void> {
  if (!commands?.length) {
    return
  }
  for (const cmd of commands) {
    logInfo(`module: hook ${phase}`, {moduleId, cmd: cmd.slice(0, 200)})
    if (hooksDryRun()) {
      continue
    }
    try {
      await execAsync(cmd, {
        cwd: absoluteDir,
        env: {
          ...process.env,
          STARFLEET_MODULE_ROOT: absoluteDir,
          STARFLEET_MODULE_ID: moduleId,
        },
        maxBuffer: 10 * 1024 * 1024,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      throw new StarfleetError({
        code: 'MODULE_HOOK_FAILED',
        message: `Hook ${phase} falhou no módulo ${moduleId}: ${msg}`,
        hint: 'Corrija o comando em module.yaml ou defina STARFLEET_MODULE_HOOKS_DRY_RUN=1 para simular em testes.',
        exitCode: ExitCode.module,
        details: {moduleId, phase, command: cmd},
      })
    }
  }
}

export async function applyAddModule(
  cwd: string,
  moduleId: string,
  options: {upgrade: boolean},
): Promise<{message: string; plan: string[]; applied: string[]}> {
  const byId = getValidModuleMap(cwd)
  if (!byId.has(moduleId)) {
    throw new StarfleetError({
      code: 'MODULE_NOT_FOUND',
      message: `Módulo não encontrado no catálogo: ${moduleId}`,
      hint: 'Use starfleet list para ver módulos disponíveis.',
      exitCode: ExitCode.module,
    })
  }

  const prev = readState(cwd)
  if (!prev?.cluster) {
    throw new StarfleetError({
      code: 'MODULE_CLUSTER_STATE_MISSING',
      message: 'Estado do cluster em .starfleet/state.json em falta ou inválido; execute starfleet up primeiro.',
      hint: 'O cluster tem de estar criado antes de adicionar módulos.',
      exitCode: ExitCode.usage,
    })
  }

  const active = new Set(prev.modules?.active ?? [])
  const graph = buildDepGraphFromCatalog(validModulesOnly(cwd))

  if (options.upgrade) {
    if (!active.has(moduleId)) {
      throw new StarfleetError({
        code: 'MODULE_NOT_INSTALLED',
        message: `O módulo ${moduleId} não está ativo; não é possível --upgrade.`,
        hint: 'Execute starfleet add sem --upgrade para instalar.',
        exitCode: ExitCode.usage,
      })
    }
    const mod = byId.get(moduleId)!
    const prevPin = prev.modules?.pinned?.[moduleId]?.version
    logInfo('add: stage=upgrade', {moduleId, from: prevPin, to: mod.version})
    try {
      await runShellHooks('install', moduleId, mod.absoluteDir, mod.hooks?.install)
    } catch (e) {
      throw e
    }
    const pinned = {...(prev.modules?.pinned ?? {}), [moduleId]: {version: mod.version, pinnedAt: new Date().toISOString()}}
    writeState(cwd, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: prev.cluster,
      modules: {active: [...active], pinned},
      updatedAt: new Date().toISOString(),
    })
    return {
      message: `Módulo ${moduleId} atualizado para v${mod.version} (hooks install executados).`,
      plan: [moduleId],
      applied: [moduleId],
    }
  }

  if (active.has(moduleId)) {
    throw new StarfleetError({
      code: 'MODULE_ALREADY_INSTALLED',
      message: `O módulo ${moduleId} já está ativo. Use --upgrade para reexecutar hooks ou remova antes de voltar a instalar.`,
      hint: 'starfleet add ' + moduleId + ' --upgrade',
      exitCode: ExitCode.usage,
    })
  }

  const resolved = resolveModuleInstallOrder([moduleId], graph)
  if ('error' in resolved) {
    throw resolved.error
  }
  const order = resolved.order

  const toInstall = order.filter((id) => !active.has(id))
  logInfo('add: stage=plan', {order, toInstall})

  const applied: string[] = []
  for (const id of order) {
    if (!toInstall.includes(id)) {
      continue
    }
    const mod = byId.get(id)!
    logInfo('add: stage=apply', {moduleId: id})
    await runShellHooks('install', id, mod.absoluteDir, mod.hooks?.install)
    active.add(id)
    applied.push(id)
  }

  const pinned: Record<string, {version: string; pinnedAt: string}> = {...(prev.modules?.pinned ?? {})}
  const now = new Date().toISOString()
  for (const id of applied) {
    const mod = byId.get(id)!
    pinned[id] = {version: mod.version, pinnedAt: now}
  }

  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: prev.cluster,
    modules: {active: [...active].sort((a, b) => a.localeCompare(b)), pinned},
    updatedAt: new Date().toISOString(),
  })

  return {
    message:
      applied.length > 0
        ? `Módulos aplicados: ${applied.join(', ')}. Estado atualizado em .starfleet/state.json.`
        : 'Nada a aplicar.',
    plan: order,
    applied,
  }
}

export function listActiveDependents(
  targetId: string,
  active: string[],
  graph: DepGraph,
): string[] {
  return active.filter((m) => m !== targetId && (graph.get(m)?.dependencies.includes(targetId) ?? false))
}

export async function applyRemoveModule(cwd: string, moduleId: string): Promise<{message: string}> {
  const byId = getValidModuleMap(cwd)
  const prev = readState(cwd)
  if (!prev?.cluster) {
    throw new StarfleetError({
      code: 'MODULE_CLUSTER_STATE_MISSING',
      message: 'Estado do cluster em falta; execute starfleet up primeiro.',
      hint: 'Inicialize o lab antes de remover módulos.',
      exitCode: ExitCode.usage,
    })
  }
  const active = prev.modules?.active ?? []
  if (!active.includes(moduleId)) {
    throw new StarfleetError({
      code: 'MODULE_NOT_INSTALLED',
      message: `O módulo ${moduleId} não está na lista de ativos.`,
      hint: 'Use starfleet status para ver o estado.',
      exitCode: ExitCode.usage,
    })
  }

  const graph = buildDepGraphFromCatalog(validModulesOnly(cwd))
  const blockers = listActiveDependents(moduleId, active, graph)
  if (blockers.length > 0) {
    throw new StarfleetError({
      code: 'MODULE_REMOVE_BLOCKED',
      message: `Não é possível remover ${moduleId}: outros módulos ativos dependem dele: ${blockers.join(', ')}.`,
      hint: 'Remova primeiro os dependentes ou ajuste dependencies nos manifestos.',
      exitCode: ExitCode.module,
      details: {dependents: blockers},
    })
  }

  const mod = byId.get(moduleId)
  if (mod) {
    logInfo('remove: stage=hooks', {moduleId})
    await runShellHooks('uninstall', moduleId, mod.absoluteDir, mod.hooks?.uninstall)
  }

  const nextActive = active.filter((x) => x !== moduleId).sort((a, b) => a.localeCompare(b))
  const pinned = {...(prev.modules?.pinned ?? {})}
  delete pinned[moduleId]

  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: prev.cluster,
    modules: {active: nextActive, pinned},
    updatedAt: new Date().toISOString(),
  })

  return {message: `Módulo ${moduleId} removido do estado ativo.`}
}

export async function applyProfileModules(cwd: string, profileModuleIds: string[]): Promise<{message: string; applied: string[]}> {
  if (profileModuleIds.length === 0) {
    return {message: 'Perfil sem módulos.', applied: []}
  }
  const byId = getValidModuleMap(cwd)
  for (const id of profileModuleIds) {
    if (!byId.has(id)) {
      throw new StarfleetError({
        code: 'MODULE_DEPENDENCY_MISSING',
        message: `Módulo do perfil não existe no catálogo: ${id}`,
        hint: 'Corrija profiles em starfleet.yaml.',
        exitCode: ExitCode.module,
      })
    }
  }

  const prev = readState(cwd)
  if (!prev?.cluster) {
    throw new StarfleetError({
      code: 'MODULE_CLUSTER_STATE_MISSING',
      message: 'Estado do cluster em falta; execute starfleet up antes de aplicar perfil.',
      hint: 'O cluster tem de existir.',
      exitCode: ExitCode.usage,
    })
  }

  const graph = buildDepGraphFromCatalog(validModulesOnly(cwd))
  const resolved = resolveModuleInstallOrder(profileModuleIds, graph)
  if ('error' in resolved) {
    throw resolved.error
  }
  const order = resolved.order
  const active = new Set(prev.modules?.active ?? [])
  const toInstall = order.filter((id) => !active.has(id))
  logInfo('profile: stage=plan', {order, toInstall})

  const applied: string[] = []
  for (const id of order) {
    if (!toInstall.includes(id)) {
      continue
    }
    const mod = byId.get(id)!
    logInfo('profile: stage=apply', {moduleId: id})
    await runShellHooks('install', id, mod.absoluteDir, mod.hooks?.install)
    active.add(id)
    applied.push(id)
  }

  const pinned: Record<string, {version: string; pinnedAt: string}> = {...(prev.modules?.pinned ?? {})}
  const now = new Date().toISOString()
  for (const id of applied) {
    const mod = byId.get(id)!
    pinned[id] = {version: mod.version, pinnedAt: now}
  }

  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: prev.cluster,
    modules: {active: [...active].sort((a, b) => a.localeCompare(b)), pinned},
    updatedAt: new Date().toISOString(),
  })

  return {
    message:
      applied.length > 0
        ? `Perfil: módulos aplicados ${applied.join(', ')}.`
        : 'Perfil: todos os módulos já estavam ativos.',
    applied,
  }
}
