import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {scaffoldModule} from './scaffoldModule.js'

describe('scaffoldModule', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('cria estrutura mínima de módulo', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-scaffold-'))
    dirs.push(root)
    const out = scaffoldModule(root, 'novo-modulo')
    expect(out.modulePath).toBe('modules/novo-modulo')
    expect(out.created).toContain('modules/novo-modulo/module.yaml')
    expect(fs.existsSync(path.join(root, 'modules', 'novo-modulo', 'README.md'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'modules', 'novo-modulo', 'iac'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'modules', 'novo-modulo', 'tests', 'smoke', 'smoke.yaml'))).toBe(true)
  })
})
