import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {resolveStarfleetConfigPath} from '../config/loadStarfleetConfig.js'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {readState} from '../state/index.js'

export type EvidenceManifestV1 = {
  apiVersion: 'starfleet/evidence/v1'
  generatedAt: string
  cliVersion?: string
  sourceRevision?: string
  modules: Array<{
    moduleId: string
    version: string | null
    pinnedAt: string | null
  }>
  configChecksumSha256?: string
}

export type EvidenceCaptureResult = {
  message: string
  manifestPath: string
  data: {
    manifestPath: string
    generatedAt: string
    cliVersion?: string
    sourceRevision?: string
    modules: EvidenceManifestV1['modules']
    configChecksumSha256?: string
  }
}

export function captureEvidenceManifest(
  cwd: string,
  options?: {cliVersion?: string},
): EvidenceCaptureResult {
  const state = readState(cwd)
  if (!state?.cluster) {
    throw new StarfleetError({
      code: 'EVIDENCE_STATE_MISSING',
      message: 'Estado local em .starfleet/state.json em falta; não é possível gerar evidência.',
      hint: 'Execute starfleet up e finalize o lab antes de capturar evidências.',
      exitCode: ExitCode.usage,
    })
  }

  const generatedAt = new Date().toISOString()
  const modules = (state.modules?.active ?? []).map((moduleId) => {
    const pin = state.modules?.pinned?.[moduleId]
    return {
      moduleId,
      version: pin?.version ?? null,
      pinnedAt: pin?.pinnedAt ?? null,
    }
  })

  const manifest: EvidenceManifestV1 = {
    apiVersion: 'starfleet/evidence/v1',
    generatedAt,
    modules,
  }
  const cliVersion = options?.cliVersion?.trim()
  if (cliVersion) {
    manifest.cliVersion = cliVersion
  }
  const sourceRevision = process.env.GIT_COMMIT?.trim()
  if (sourceRevision) {
    manifest.sourceRevision = sourceRevision
  }

  const checksum = readConfigChecksumIfAvailable(cwd)
  if (checksum !== undefined) {
    manifest.configChecksumSha256 = checksum
  }

  const evidenceDir = path.join(cwd, '.starfleet', 'evidence')
  const stamp = generatedAt.replace(/[:]/g, '-').replace(/[.]/g, '_')
  const fileName = `manifest-${stamp}.json`
  const absPath = path.join(evidenceDir, fileName)
  const relPath = toPosix(path.relative(cwd, absPath))

  try {
    fs.mkdirSync(evidenceDir, {recursive: true})
    fs.writeFileSync(absPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  } catch (cause) {
    throw new StarfleetError({
      code: 'EVIDENCE_WRITE_FAILED',
      message: `Não foi possível escrever manifesto de evidência em ${absPath}`,
      hint: 'Verifique permissões no diretório de trabalho e espaço em disco.',
      exitCode: ExitCode.generic,
      details: {cause: String(cause)},
    })
  }

  return {
    message: `Manifesto de evidência gerado: ${relPath}`,
    manifestPath: relPath,
    data: {
      manifestPath: relPath,
      generatedAt,
      ...(manifest.cliVersion !== undefined ? {cliVersion: manifest.cliVersion} : {}),
      ...(manifest.sourceRevision !== undefined ? {sourceRevision: manifest.sourceRevision} : {}),
      modules,
      ...(checksum !== undefined ? {configChecksumSha256: checksum} : {}),
    },
  }
}

function readConfigChecksumIfAvailable(cwd: string): string | undefined {
  const configPath = resolveStarfleetConfigPath(cwd)
  if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile()) {
    return undefined
  }
  try {
    const content = fs.readFileSync(configPath)
    return crypto.createHash('sha256').update(content).digest('hex')
  } catch {
    return undefined
  }
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}
