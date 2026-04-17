import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import {formatModuleCatalogHuman, scanModuleCatalog, type CatalogModuleInvalid} from './catalog.js'
import type {ModuleManifest} from './moduleYaml.js'

describe('scanModuleCatalog', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('lista módulo válido com nome, descrição e versão', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-mod-'))
    dirs.push(root)
    const mod = path.join(root, 'modules', 'alpha')
    fs.mkdirSync(mod, {recursive: true})
    fs.writeFileSync(
      path.join(mod, 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: Alpha lab
version: 1.0.0
`,
      'utf8',
    )
    const r = scanModuleCatalog(root)
    expect(r.entries).toHaveLength(1)
    const e = r.entries[0]
    expect(e?.kind).toBe('valid')
    if (e?.kind === 'valid') {
      expect(e.dependencies).toEqual([])
      expect(e.absoluteDir).toContain('alpha')
    }
    expect(r.entries[0]).toMatchObject({
      kind: 'valid',
      directory: 'alpha',
      name: 'alpha',
      version: '1.0.0',
      description: 'Alpha lab',
    })
  })

  it('usa name do manifesto quando presente', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-mod-'))
    dirs.push(root)
    const mod = path.join(root, 'modules', 'alpha')
    fs.mkdirSync(mod, {recursive: true})
    fs.writeFileSync(
      path.join(mod, 'module.yaml'),
      `apiVersion: starfleet/module/v1
name: custom-name
description: X
version: 1.0.0
`,
      'utf8',
    )
    const r = scanModuleCatalog(root)
    expect(r.entries[0]).toMatchObject({kind: 'valid', name: 'custom-name'})
  })

  it('inclui entrada inválida com hint quando o schema falha', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-mod-'))
    dirs.push(root)
    const mod = path.join(root, 'modules', 'broken')
    fs.mkdirSync(mod, {recursive: true})
    fs.writeFileSync(
      path.join(mod, 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: falta version
`,
      'utf8',
    )
    const r = scanModuleCatalog(root)
    expect(r.entries).toHaveLength(1)
    expect(r.entries[0]).toMatchObject({kind: 'invalid', directory: 'broken'})
    expect((r.entries[0] as CatalogModuleInvalid).hint.length).toBeGreaterThan(0)
  })

  it('inclui inválido quando module.yaml falta', () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-mod-'))
    dirs.push(root)
    fs.mkdirSync(path.join(root, 'modules', 'empty'), {recursive: true})
    const r = scanModuleCatalog(root)
    expect(r.entries[0]).toMatchObject({
      kind: 'invalid',
      message: expect.stringContaining('em falta'),
    })
  })
})

const minimalManifest = (d: string, v: string): ModuleManifest => ({
  apiVersion: 'starfleet/module/v1',
  description: 'Desc',
  version: v,
  dependencies: [],
})

describe('formatModuleCatalogHuman', () => {
  it('formata linhas legíveis', () => {
    const cwd = '/tmp/x'
    const msg = formatModuleCatalogHuman(
      {
        catalogRoot: 'modules',
        entries: [
          {
            kind: 'valid',
            directory: 'a',
            relativePath: 'modules/a',
            absoluteDir: '/tmp/x/modules/a',
            name: 'A',
            description: 'Desc',
            version: '1.0.0',
            dependencies: [],
            manifest: minimalManifest('a', '1.0.0'),
          },
        ],
      },
      cwd,
    )
    expect(msg).toContain('A')
    expect(msg).toContain('v1.0.0')
    expect(msg).toContain('Desc')
  })
})
