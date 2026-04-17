import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {runModulesContributionGate} from './contributionGate.js'

describe('runModulesContributionGate', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('passa quando módulo cumpre checklist mínimo', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-gate-'))
    dirs.push(root)
    const mod = path.join(root, 'modules', 'ok-mod')
    fs.mkdirSync(path.join(mod, 'tests', 'smoke'), {recursive: true})
    fs.mkdirSync(path.join(mod, 'iac'), {recursive: true})
    fs.writeFileSync(path.join(mod, 'README.md'), '# ok-mod\n', 'utf8')
    fs.writeFileSync(
      path.join(mod, 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: ok
version: 0.1.0
`,
      'utf8',
    )
    fs.writeFileSync(
      path.join(mod, 'tests', 'smoke', 'smoke.yaml'),
      `apiVersion: starfleet/smoke/v1
checks:
  - name: noop
    run: "true"
`,
      'utf8',
    )
    const out = runModulesContributionGate(root)
    expect(out.ok).toBe(true)
    expect(out.checked).toBe(1)
  })

  it('falha quando tests/smoke é removido', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-gate-'))
    dirs.push(root)
    const mod = path.join(root, 'modules', 'broken-mod')
    fs.mkdirSync(path.join(mod, 'iac'), {recursive: true})
    fs.writeFileSync(path.join(mod, 'README.md'), '# broken-mod\n', 'utf8')
    fs.writeFileSync(
      path.join(mod, 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: broken
version: 0.1.0
`,
      'utf8',
    )
    expect(() => runModulesContributionGate(root)).toThrowError(/MODULE_CONTRIBUTION_GATE_FAILED|Gate de contribuições falhou/)
  })
})
