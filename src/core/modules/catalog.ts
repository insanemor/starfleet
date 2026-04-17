import fs from 'node:fs'
import path from 'node:path'
import {parse as parseYaml} from 'yaml'
import type {ModuleManifest} from './moduleYaml.js'
import {parseModuleManifest} from './moduleYaml.js'

export type CatalogModuleValid = {
  kind: 'valid'
  /** Nome da pasta sob `modules/` — identificador canónico para deps e CLI */
  directory: string
  /** Caminho relativo ao cwd (ex.: modules/foo) */
  relativePath: string
  /** Caminho absoluto ao diretório do módulo (hooks com cwd aqui). */
  absoluteDir: string
  name: string
  description: string
  version: string
  dependencies: string[]
  hooks?: ModuleManifest['hooks']
  promoted?: boolean
  manifest: ModuleManifest
}

export type CatalogModuleInvalid = {
  kind: 'invalid'
  directory: string
  relativePath: string
  moduleYamlPath: string
  message: string
  hint: string
}

export type CatalogModuleEntry = CatalogModuleValid | CatalogModuleInvalid

export type ModuleCatalogResult = {
  catalogRoot: string
  entries: CatalogModuleEntry[]
}

export function validModulesOnly(cwd: string): CatalogModuleValid[] {
  return scanModuleCatalog(cwd).entries.filter((e): e is CatalogModuleValid => e.kind === 'valid')
}

/**
 * Lê `modules/<dir>/module.yaml` sob `cwd`.
 * Política: entradas inválidas **incluem-se** na lista com `kind: 'invalid'` e mensagem acionável (AC Story 3.1).
 */
export function scanModuleCatalog(cwd: string): ModuleCatalogResult {
  const modulesRoot = path.resolve(cwd, 'modules')
  const entries: CatalogModuleEntry[] = []

  if (!fs.existsSync(modulesRoot) || !fs.statSync(modulesRoot).isDirectory()) {
    return {catalogRoot: toPosixPath(path.relative(cwd, modulesRoot) || 'modules'), entries: []}
  }

  const dirNames = fs
    .readdirSync(modulesRoot, {withFileTypes: true})
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b))

  for (const directory of dirNames) {
    const rel = path.join('modules', directory)
    const absDir = path.join(modulesRoot, directory)
    const yamlPath = path.join(absDir, 'module.yaml')
    const relYaml = path.join(rel, 'module.yaml')

    if (!fs.existsSync(yamlPath) || !fs.statSync(yamlPath).isFile()) {
      entries.push({
        kind: 'invalid',
        directory,
        relativePath: toPosixPath(rel),
        moduleYamlPath: toPosixPath(relYaml),
        message: 'Ficheiro module.yaml em falta nesta pasta.',
        hint: 'Crie modules/<nome>/module.yaml com apiVersion starfleet/module/v1, description e version.',
      })
      continue
    }

    let rawText: string
    try {
      rawText = fs.readFileSync(yamlPath, 'utf8')
    } catch (e) {
      entries.push({
        kind: 'invalid',
        directory,
        relativePath: toPosixPath(rel),
        moduleYamlPath: toPosixPath(relYaml),
        message: `Não foi possível ler module.yaml: ${e instanceof Error ? e.message : String(e)}`,
        hint: 'Verifique permissões e o caminho do ficheiro.',
      })
      continue
    }

    let parsedUnknown: unknown
    try {
      parsedUnknown = parseYaml(rawText)
    } catch (e) {
      entries.push({
        kind: 'invalid',
        directory,
        relativePath: toPosixPath(rel),
        moduleYamlPath: toPosixPath(relYaml),
        message: `YAML inválido: ${e instanceof Error ? e.message : String(e)}`,
        hint: 'Corrija a sintaxe YAML (indentação, aspas, tipos).',
      })
      continue
    }

    const checked = parseModuleManifest(parsedUnknown, directory)
    if (!checked.ok) {
      entries.push({
        kind: 'invalid',
        directory,
        relativePath: toPosixPath(rel),
        moduleYamlPath: toPosixPath(relYaml),
        message: checked.message,
        hint: checked.hint,
      })
      continue
    }

    const mf = checked.value
    entries.push({
      kind: 'valid',
      directory,
      relativePath: toPosixPath(rel),
      absoluteDir: absDir,
      name: checked.displayName,
      description: mf.description.trim(),
      version: mf.version.trim(),
      dependencies: mf.dependencies ?? [],
      hooks: mf.hooks,
      promoted: mf.promoted,
      manifest: mf,
    })
  }

  return {catalogRoot: toPosixPath(path.relative(cwd, modulesRoot) || 'modules'), entries}
}

export function formatModuleCatalogHuman(result: ModuleCatalogResult, cwd: string): string {
  const root = path.resolve(cwd, 'modules')
  const lines: string[] = []
  lines.push(`Catálogo de módulos (${result.catalogRoot} relativo a ${toPosixPath(cwd)}):`)

  if (result.entries.length === 0) {
    lines.push('')
    lines.push(fs.existsSync(root) ? '  (nenhuma pasta de módulo encontrada)' : '  (pasta modules/ não existe — crie modules/<nome>/module.yaml)')
    return lines.join('\n')
  }

  lines.push('')

  for (const e of result.entries) {
    if (e.kind === 'valid') {
      lines.push(`  • ${e.name}  v${e.version}`)
      lines.push(`    ${e.description}`)
      if (e.dependencies.length > 0) {
        lines.push(`    dependências: ${e.dependencies.join(', ')}`)
      }
      lines.push(`    (${e.relativePath})`)
    } else {
      lines.push(`  • ${e.directory}  [inválido]`)
      lines.push(`    ${e.message}`)
      lines.push(`    Dica: ${e.hint}`)
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd() + '\n'
}

function toPosixPath(p: string): string {
  return p.split(path.sep).join('/')
}
