import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

function makeLabRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-maint-'))
}

function seedModule(root: string, moduleId: string, withSmoke = true): void {
  const mod = path.join(root, 'modules', moduleId)
  fs.mkdirSync(path.join(mod, 'iac'), {recursive: true})
  fs.writeFileSync(
    path.join(mod, 'module.yaml'),
    `apiVersion: starfleet/module/v1
description: module ${moduleId}
version: 0.1.0
`,
    'utf8',
  )
  fs.writeFileSync(path.join(mod, 'README.md'), `# ${moduleId}\n`, 'utf8')
  if (withSmoke) {
    fs.mkdirSync(path.join(mod, 'tests', 'smoke'), {recursive: true})
    fs.writeFileSync(
      path.join(mod, 'tests', 'smoke', 'smoke.yaml'),
      `apiVersion: starfleet/smoke/v1
checks:
  - name: noop
    run: "true"
`,
      'utf8',
    )
  }
}

describe('maintainer workflows (Epic 7)', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('module scaffold cria estrutura mínima', async () => {
    const root = makeLabRoot()
    dirs.push(root)
    const result = await execa(devBin, ['module', 'scaffold', 'new-mod'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: root},
    })
    expect(result.exitCode).toBe(0)
    expect(fs.existsSync(path.join(root, 'modules', 'new-mod', 'module.yaml'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'modules', 'new-mod', 'tests', 'smoke', 'smoke.yaml'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'modules', 'new-mod', 'README.md'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'modules', 'new-mod', 'iac'))).toBe(true)
  })

  it('check-modules falha quando smoke está ausente (FR37)', async () => {
    const root = makeLabRoot()
    dirs.push(root)
    seedModule(root, 'bad-mod', false)
    const result = await execa(devBin, ['check-modules'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: root},
    })
    expect(result.exitCode).toBe(30)
    expect(result.stderr).toContain('MODULE_CONTRIBUTION_GATE_FAILED')
  })

  it('check-modules passa com módulo válido', async () => {
    const root = makeLabRoot()
    dirs.push(root)
    seedModule(root, 'good-mod', true)
    const result = await execa(devBin, ['check-modules', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: root},
    })
    expect(result.exitCode).toBe(0)
    const payload = JSON.parse(result.stdout.trim()) as {
      ok: boolean
      command: string
      data: {checked: number}
    }
    expect(payload.ok).toBe(true)
    expect(payload.command).toBe('check-modules')
    expect(payload.data.checked).toBe(1)
  })
})
