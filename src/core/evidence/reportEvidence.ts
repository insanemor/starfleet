import fs from 'node:fs'
import path from 'node:path'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {readState} from '../state/index.js'
import type {EvidenceManifestV1} from './captureEvidence.js'

export type EvidenceReportResult = {
  message: string
  reportPath: string
  data: {
    reportPath: string
    manifestPath: string
  }
}

type ValidationSummary = {
  status: string
  lastRunAt?: string
  reportPath?: string
}

export function writeEvidenceMarkdownReport(
  cwd: string,
  options?: {manifestPath?: string},
): EvidenceReportResult {
  const manifestAbsPath = resolveManifestPath(cwd, options?.manifestPath)
  const manifest = loadManifest(manifestAbsPath)
  const relManifest = toPosix(path.relative(cwd, manifestAbsPath))

  const evidenceDir = path.join(cwd, '.starfleet', 'evidence')
  fs.mkdirSync(evidenceDir, {recursive: true})
  const stamp = manifest.generatedAt.replace(/[:]/g, '-').replace(/[.]/g, '_')
  const reportName = `report-${stamp}.md`
  const reportAbsPath = path.join(evidenceDir, reportName)
  const relReportPath = toPosix(path.relative(cwd, reportAbsPath))

  const validation = readValidationSummary(cwd)
  const markdown = buildMarkdown(manifest, relManifest, validation)
  fs.writeFileSync(reportAbsPath, markdown, 'utf8')

  return {
    message: `Relatório de evidência gerado: ${relReportPath}`,
    reportPath: relReportPath,
    data: {
      reportPath: relReportPath,
      manifestPath: relManifest,
    },
  }
}

function resolveManifestPath(cwd: string, explicitPath?: string): string {
  if (explicitPath?.trim()) {
    const resolved = path.isAbsolute(explicitPath) ? explicitPath : path.resolve(cwd, explicitPath)
    if (!fs.existsSync(resolved)) {
      throw new StarfleetError({
        code: 'EVIDENCE_MANIFEST_NOT_FOUND',
        message: `Manifesto de evidência não encontrado: ${resolved}`,
        hint: 'Use evidence capture para gerar o manifesto, ou informe um caminho válido.',
        exitCode: ExitCode.usage,
      })
    }
    return resolved
  }

  const evidenceDir = path.join(cwd, '.starfleet', 'evidence')
  if (!fs.existsSync(evidenceDir) || !fs.statSync(evidenceDir).isDirectory()) {
    throw new StarfleetError({
      code: 'EVIDENCE_MANIFEST_NOT_FOUND',
      message: 'Nenhum diretório de evidência encontrado em .starfleet/evidence.',
      hint: 'Execute `starfleet evidence capture` antes de gerar o relatório.',
      exitCode: ExitCode.usage,
    })
  }
  const candidates = fs
    .readdirSync(evidenceDir)
    .filter((name) => /^manifest-.*\.json$/.test(name))
    .map((name) => path.join(evidenceDir, name))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  if (candidates.length === 0) {
    throw new StarfleetError({
      code: 'EVIDENCE_MANIFEST_NOT_FOUND',
      message: 'Nenhum manifesto JSON encontrado em .starfleet/evidence.',
      hint: 'Execute `starfleet evidence capture` para gerar um manifesto.',
      exitCode: ExitCode.usage,
    })
  }
  return candidates[0]
}

function loadManifest(absPath: string): EvidenceManifestV1 {
  let parsed: unknown
  try {
    parsed = JSON.parse(fs.readFileSync(absPath, 'utf8'))
  } catch (cause) {
    throw new StarfleetError({
      code: 'EVIDENCE_MANIFEST_INVALID',
      message: `Manifesto de evidência inválido: ${absPath}`,
      hint: 'Regere o manifesto com `starfleet evidence capture`.',
      exitCode: ExitCode.usage,
      details: {cause: String(cause)},
    })
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as {apiVersion?: unknown}).apiVersion !== 'starfleet/evidence/v1' ||
    !Array.isArray((parsed as {modules?: unknown}).modules)
  ) {
    throw new StarfleetError({
      code: 'EVIDENCE_MANIFEST_INVALID',
      message: `Manifesto com schema inesperado: ${absPath}`,
      hint: 'Regere o manifesto com `starfleet evidence capture`.',
      exitCode: ExitCode.usage,
    })
  }

  return parsed as EvidenceManifestV1
}

function readValidationSummary(cwd: string): ValidationSummary {
  const state = readState(cwd)
  const status = state?.validation?.validationStatus ?? 'unknown'
  return {
    status,
    lastRunAt: state?.validation?.lastRunAt,
    reportPath: state?.validation?.lastReportPath
      ? toPosix(path.relative(cwd, state.validation.lastReportPath))
      : undefined,
  }
}

function buildMarkdown(
  manifest: EvidenceManifestV1,
  relManifestPath: string,
  validation: ValidationSummary,
): string {
  const uiLinks = knownUiLinksFromModules(manifest.modules.map((m) => m.moduleId))
  const modulesSection =
    manifest.modules.length > 0
      ? manifest.modules
          .map((m) => `- \`${m.moduleId}\` — versão: ${m.version ?? 'n/d'}; pinnedAt: ${m.pinnedAt ?? 'n/d'}`)
          .join('\n')
      : '- (nenhum módulo ativo registado no manifesto)'

  const lines: string[] = []
  lines.push('# Relatório de Evidência Starfleet')
  lines.push('')
  lines.push('## Contexto')
  lines.push('')
  lines.push(`- Manifesto base: \`${relManifestPath}\``)
  lines.push(`- Gerado em: \`${manifest.generatedAt}\` (UTC)`)
  if (manifest.cliVersion) {
    lines.push(`- Versão da CLI: \`${manifest.cliVersion}\``)
  }
  if (manifest.sourceRevision) {
    lines.push(`- Revisão de origem: \`${manifest.sourceRevision}\``)
  }
  if (manifest.configChecksumSha256) {
    lines.push(`- Checksum do manifesto de configuração (sha256): \`${manifest.configChecksumSha256}\``)
  }
  lines.push('')
  lines.push('## Módulos')
  lines.push('')
  lines.push(modulesSection)
  lines.push('')
  lines.push('## Resultados de validação')
  lines.push('')
  lines.push(`- Status: \`${validation.status}\``)
  if (validation.lastRunAt) {
    lines.push(`- Última execução: \`${validation.lastRunAt}\``)
  }
  if (validation.reportPath) {
    lines.push(`- Relatório bruto: \`${validation.reportPath}\``)
  }
  lines.push('')
  lines.push('## Links para UIs conhecidas')
  lines.push('')
  lines.push(...uiLinks.map((x) => `- ${x}`))
  lines.push('')
  lines.push(
    '> Nota de segurança: este relatório não lê nem inclui conteúdo de `.env`; apenas usa manifesto de evidência e estado local.',
  )
  lines.push('')
  return `${lines.join('\n')}\n`
}

function knownUiLinksFromModules(moduleIds: string[]): string[] {
  const links = new Set<string>()
  links.add('Grafana: http://localhost:3000')
  links.add('Prometheus: http://localhost:9090')
  if (moduleIds.includes('demo-metrics')) {
    links.add('Dashboard demo-metrics: http://localhost:3000/d/starfleet-demo')
  }
  return [...links]
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}
