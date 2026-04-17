import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {STATE_SCHEMA_VERSION, writeState} from '../state/index.js'
import {captureEvidenceManifest} from './captureEvidence.js'

describe('captureEvidenceManifest', () => {
  const dirs: string[] = []
  const previousGitCommit = process.env.GIT_COMMIT

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
    if (previousGitCommit === undefined) {
      delete process.env.GIT_COMMIT
    } else {
      process.env.GIT_COMMIT = previousGitCommit
    }
  })

  it('gera manifesto em .starfleet/evidence com módulos e versões pinadas', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-ev-'))
    dirs.push(dir)
    fs.writeFileSync(
      path.join(dir, 'starfleet.yaml'),
      `apiVersion: starfleet/v1
cluster:
  name: evidence-test
`,
      'utf8',
    )
    writeState(dir, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {
        name: 'evidence-test',
        specFingerprint: 'fp',
        lastPhase: 'ready',
      },
      modules: {
        active: ['demo-metrics'],
        pinned: {
          'demo-metrics': {version: '1.2.3', pinnedAt: '2026-04-17T00:00:00Z'},
        },
      },
      updatedAt: new Date().toISOString(),
    })

    process.env.GIT_COMMIT = 'abc123def'
    const out = captureEvidenceManifest(dir, {cliVersion: '1.0.0'})
    expect(out.manifestPath).toMatch(/^\.starfleet\/evidence\/manifest-/)
    expect(out.data.modules).toEqual([
      {moduleId: 'demo-metrics', version: '1.2.3', pinnedAt: '2026-04-17T00:00:00Z'},
    ])
    expect(out.data.configChecksumSha256).toMatch(/^[a-f0-9]{64}$/)
    expect(out.data.cliVersion).toBe('1.0.0')
    expect(out.data.sourceRevision).toBe('abc123def')

    const saved = JSON.parse(fs.readFileSync(path.join(dir, out.manifestPath), 'utf8')) as Record<string, unknown>
    expect(saved.apiVersion).toBe('starfleet/evidence/v1')
    expect(saved.generatedAt).toBeTypeOf('string')
    expect(saved.cliVersion).toBe('1.0.0')
    expect(saved.sourceRevision).toBe('abc123def')
  })
})
