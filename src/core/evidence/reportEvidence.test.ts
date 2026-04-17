import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {STATE_SCHEMA_VERSION, writeState} from '../state/index.js'
import {writeEvidenceMarkdownReport} from './reportEvidence.js'

describe('writeEvidenceMarkdownReport', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('gera markdown com secções obrigatórias', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-ev-report-'))
    dirs.push(dir)
    fs.mkdirSync(path.join(dir, '.starfleet', 'evidence'), {recursive: true})
    const manifestPath = path.join(dir, '.starfleet', 'evidence', 'manifest-test.json')
    fs.writeFileSync(
      manifestPath,
      `${JSON.stringify(
        {
          apiVersion: 'starfleet/evidence/v1',
          generatedAt: '2026-04-17T14:00:00Z',
          cliVersion: '1.0.0',
          sourceRevision: 'abc123',
          modules: [{moduleId: 'demo-metrics', version: '0.1.0', pinnedAt: '2026-04-17T13:00:00Z'}],
        },
        null,
        2,
      )}\n`,
      'utf8',
    )
    writeState(dir, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {name: 'lab', specFingerprint: 'x', lastPhase: 'ready'},
      validation: {
        validationStatus: 'passed',
        lastRunAt: '2026-04-17T14:10:00Z',
        lastReportPath: path.join(dir, '.starfleet', 'validation-report.json'),
      },
      updatedAt: new Date().toISOString(),
    })

    const out = writeEvidenceMarkdownReport(dir, {manifestPath})
    expect(out.reportPath).toMatch(/^\.starfleet\/evidence\/report-/)
    const md = fs.readFileSync(path.join(dir, out.reportPath), 'utf8')
    expect(md).toContain('## Contexto')
    expect(md).toContain('## Módulos')
    expect(md).toContain('## Resultados de validação')
    expect(md).toContain('## Links para UIs conhecidas')
    expect(md).toContain('demo-metrics')
    expect(md).not.toContain('.env=')
  })
})
