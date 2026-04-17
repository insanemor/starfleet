import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

function makeLabRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-evidence-'))
}

function writeMinimalConfig(labRoot: string): string {
  const configPath = path.join(labRoot, 'starfleet.yaml')
  fs.writeFileSync(
    configPath,
    `apiVersion: starfleet/v1
cluster:
  name: evidence-lab
`,
    'utf8',
  )
  return configPath
}

function writeStateForEvidence(labRoot: string): void {
  const starfleetDir = path.join(labRoot, '.starfleet')
  fs.mkdirSync(starfleetDir, {recursive: true})
  fs.writeFileSync(
    path.join(starfleetDir, 'state.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        cluster: {
          name: 'evidence-lab',
          specFingerprint: 'test-fingerprint',
          lastPhase: 'ready',
        },
        modules: {
          active: ['demo-metrics'],
          pinned: {
            'demo-metrics': {version: '0.1.0', pinnedAt: '2026-04-17T00:00:00Z'},
          },
        },
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
}

describe('evidence capture', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('falha com erro classificado quando state está ausente', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    const result = await execa(devBin, ['evidence', 'capture'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('code: EVIDENCE_STATE_MISSING')
  })

  it('gera manifesto json sob .starfleet/evidence com checksum opcional', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    writeStateForEvidence(labRoot)

    const result = await execa(devBin, ['evidence', 'capture', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        GIT_COMMIT: 'deadbeef123',
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout.trim()) as {
      ok: boolean
      command: string
      data: {
        manifestPath: string
        cliVersion?: string
        sourceRevision?: string
        modules: Array<{moduleId: string; version: string | null; pinnedAt: string | null}>
        configChecksumSha256?: string
      }
    }
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('evidence capture')
    expect(payload.data.manifestPath).toMatch(/^\.starfleet\/evidence\/manifest-/)
    expect(payload.data.modules[0]).toEqual({
      moduleId: 'demo-metrics',
      version: '0.1.0',
      pinnedAt: '2026-04-17T00:00:00Z',
    })
    expect(payload.data.configChecksumSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(payload.data.cliVersion).toBeTypeOf('string')
    expect(payload.data.sourceRevision).toBe('deadbeef123')
    expect(fs.existsSync(path.join(labRoot, payload.data.manifestPath))).toBe(true)
  })

  it('gera relatório markdown derivado do manifesto mais recente', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    writeStateForEvidence(labRoot)

    const captured = await execa(devBin, ['evidence', 'capture', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(captured.exitCode).toBe(0)

    const report = await execa(devBin, ['evidence', 'report', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(report.exitCode).toBe(0)
    const payload = JSON.parse(report.stdout.trim()) as {
      ok: boolean
      command: string
      data: {reportPath: string; manifestPath: string}
    }
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('evidence report')
    expect(payload.data.reportPath).toMatch(/^\.starfleet\/evidence\/report-/)
    const markdown = fs.readFileSync(path.join(labRoot, payload.data.reportPath), 'utf8')
    expect(markdown).toContain('## Contexto')
    expect(markdown).toContain('## Módulos')
    expect(markdown).toContain('## Resultados de validação')
    expect(markdown).toContain('## Links para UIs conhecidas')
  })
})
