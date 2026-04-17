import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

function writeMinimalLab(dir: string, activeModule: string): void {
  fs.writeFileSync(
    path.join(dir, 'starfleet.yaml'),
    `apiVersion: starfleet/v1
cluster:
  name: val-test
`,
    'utf8',
  )
  const modRoot = path.join(dir, 'modules', activeModule)
  fs.mkdirSync(path.join(modRoot, 'tests', 'smoke'), {recursive: true})
  fs.writeFileSync(
    path.join(modRoot, 'module.yaml'),
    `apiVersion: starfleet/module/v1
name: ${activeModule}
description: test validate
version: 1.0.0
hooks:
  install:
    - ':'
`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(modRoot, 'tests', 'smoke', 'smoke.yaml'),
    `apiVersion: starfleet/smoke/v1
checks:
  - name: ok
    run: "true"
`,
    'utf8',
  )
  fs.writeFileSync(
    path.join(modRoot, 'validation-checklist.yaml'),
    `apiVersion: starfleet/checklist/v1
items:
  - id: step1
    text: Verificar algo manualmente.
`,
    'utf8',
  )
  fs.mkdirSync(path.join(dir, '.starfleet'), {recursive: true})
  fs.writeFileSync(
    path.join(dir, '.starfleet', 'state.json'),
    JSON.stringify(
      {
        schemaVersion: 1,
        cluster: {
          name: 'val-test',
          specFingerprint: 'testfp',
          lastPhase: 'ready',
        },
        modules: {active: [activeModule]},
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    'utf8',
  )
}

describe('comando validate', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('--no-smoke sem integration nem manual falha com VALIDATION_EMPTY', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-val-'))
    dirs.push(dir)
    writeMinimalLab(dir, 'm1')
    const result = await execa(devBin, ['validate', '--no-smoke'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: dir},
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('VALIDATION_EMPTY')
  })

  it('--manual lista checklist e termina com sucesso', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-val-'))
    dirs.push(dir)
    writeMinimalLab(dir, 'm1')
    const result = await execa(devBin, ['validate', '--manual'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: dir},
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Checklist manual')
    expect(result.stdout).toContain('Verificar algo manualmente')
  })

  it('smoke por omissão executa checks e grava relatório', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-val-'))
    dirs.push(dir)
    writeMinimalLab(dir, 'm1')
    const result = await execa(devBin, ['validate'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: dir},
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('.starfleet/')
    const report = fs.readdirSync(path.join(dir, '.starfleet')).find((f) => f.startsWith('validation-report'))
    expect(report).toBeDefined()
  })

  it('em modo não interativo --confirm sem --yes falha com INPUT_REQUIRED', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-val-'))
    dirs.push(dir)
    writeMinimalLab(dir, 'm1')
    const result = await execa(devBin, ['validate', '--confirm'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: dir, STARFLEET_NON_INTERACTIVE: '1'},
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('INPUT_REQUIRED')
  })

  it('em modo não interativo --confirm --yes grava confirmedAt no state', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-val-'))
    dirs.push(dir)
    writeMinimalLab(dir, 'm1')
    const result = await execa(devBin, ['validate', '--confirm', '--yes'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_WORKDIR: dir, STARFLEET_NON_INTERACTIVE: '1'},
    })
    expect(result.exitCode).toBe(0)

    const stateRaw = fs.readFileSync(path.join(dir, '.starfleet', 'state.json'), 'utf8')
    const state = JSON.parse(stateRaw) as {
      validation?: {validationStatus?: string; confirmedAt?: string; lastRunAt?: string}
    }
    expect(state.validation?.validationStatus).toBe('passed')
    expect(state.validation?.confirmedAt).toBeTruthy()
    expect(typeof state.validation?.confirmedAt).toBe('string')
    expect(state.validation?.lastRunAt).toBeTruthy()
  })
})
