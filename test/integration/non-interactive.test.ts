import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

describe('modo não interativo', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  function mkValidConfigPath(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-ni-'))
    dirs.push(dir)
    const configPath = path.join(dir, 'starfleet.yaml')
    fs.writeFileSync(
      configPath,
      `apiVersion: starfleet/v1
cluster:
  name: ni-test
`,
      'utf8',
    )
    return configPath
  }

  it('add --yes sem MODULE termina com exit 2 e código INPUT_REQUIRED', async () => {
    const configPath = mkValidConfigPath()
    const result = await execa(devBin, ['add', '--yes'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_CONFIG: configPath},
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('INPUT_REQUIRED')
  })

  it('STARFLEET_NON_INTERACTIVE=1 sem MODULE falha de forma igual', async () => {
    const configPath = mkValidConfigPath()
    const result = await execa(devBin, ['add'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_CONFIG: configPath, STARFLEET_NON_INTERACTIVE: '1'},
    })
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('INPUT_REQUIRED')
  })

  it('add com MODULE em modo não interativo continua a funcionar', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-ni-'))
    dirs.push(dir)
    const configPath = path.join(dir, 'starfleet.yaml')
    fs.writeFileSync(
      configPath,
      `apiVersion: starfleet/v1
cluster:
  name: ni-test
`,
      'utf8',
    )
    fs.mkdirSync(path.join(dir, 'modules', 'mod-x'), {recursive: true})
    fs.writeFileSync(
      path.join(dir, 'modules', 'mod-x', 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: test ni
version: 1.0.0
hooks:
  install:
    - ':'
`,
      'utf8',
    )
    fs.mkdirSync(path.join(dir, '.starfleet'), {recursive: true})
    fs.writeFileSync(
      path.join(dir, '.starfleet', 'state.json'),
      JSON.stringify({
        schemaVersion: 1,
        cluster: {
          name: 'ni-test',
          specFingerprint: 'testfp',
          lastPhase: 'ready',
        },
        updatedAt: new Date().toISOString(),
      }),
      'utf8',
    )
    const result = await execa(devBin, ['add', '--yes', 'mod-x'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: dir,
        STARFLEET_MODULE_HOOKS_DRY_RUN: '1',
      },
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('mod-x')
  })
})
