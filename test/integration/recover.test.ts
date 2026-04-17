import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')
const mockK3d = path.join(projectRoot, 'test/fixtures/mock-k3d.sh')

function makeLabRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-recover-'))
}

function writeMinimalConfig(labRoot: string): string {
  const configPath = path.join(labRoot, 'starfleet.yaml')
  fs.writeFileSync(
    configPath,
    `apiVersion: starfleet/v1
cluster:
  name: recover-lab
`,
    'utf8',
  )
  return configPath
}

function readState(labRoot: string): Record<string, unknown> {
  const p = path.join(labRoot, '.starfleet', 'state.json')
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>
}

describe('recover command', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('falha em modo não interativo sem --route', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)

    const result = await execa(devBin, ['recover', '--yes'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })

    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('code: INPUT_REQUIRED')
  })

  it(
    'retry reexecuta up com tentativa numerada',
    async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    fs.chmodSync(mockK3d, 0o755)

    const failed = await execa(devBin, ['up'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_SIMULATE_EXTERNAL_FAILURE: '1',
      },
    })
    expect(failed.exitCode).toBe(10)
    expect(failed.stderr).toContain('code: CLUSTER_TOOL_MISSING')

    const recovered = await execa(devBin, ['recover', '--route', 'retry', '--no-validate', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_K3D_BIN: mockK3d,
      },
    })

    expect(recovered.exitCode).toBe(0)
    const payload = JSON.parse(recovered.stdout.trim()) as {
      ok: boolean
      data: {message: string; route: string}
    }
    expect(payload.ok).toBe(true)
    expect(payload.data.route).toBe('retry')
    expect(payload.data.message).toContain('Retry #1')
    },
    20_000,
  )

  it(
    'rollback restaura snapshot anterior após falha em add',
    async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    fs.chmodSync(mockK3d, 0o755)

    const moduleDir = path.join(labRoot, 'modules', 'broken-mod')
    fs.mkdirSync(moduleDir, {recursive: true})
    fs.writeFileSync(
      path.join(moduleDir, 'module.yaml'),
      `apiVersion: starfleet/module/v1
description: Broken module
version: 0.0.1
hooks:
  install:
    - "kubectl-does-not-exist get pods"
`,
      'utf8',
    )

    const up = await execa(devBin, ['up'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_K3D_BIN: mockK3d,
      },
    })
    expect(up.exitCode).toBe(0)

    const add = await execa(devBin, ['add', 'broken-mod'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(add.exitCode).toBe(20)
    expect(add.stderr).toContain('EXTERNAL_BINARY_MISSING')

    const rollback = await execa(devBin, ['recover', '--route', 'rollback', '--no-validate'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })
    expect(rollback.exitCode).toBe(0)
    expect(rollback.stdout).toContain('Rollback concluído')

    const state = readState(labRoot)
    const modules = (state.modules as {active?: string[]} | undefined)?.active ?? []
    expect(modules).toEqual([])
    },
    20_000,
  )

  it(
    'quando validação pós-recuperação falha, mantém aviso de ambiente não saudável',
    async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    fs.chmodSync(mockK3d, 0o755)

    const failed = await execa(devBin, ['up'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_SIMULATE_EXTERNAL_FAILURE: '1',
      },
    })
    expect(failed.exitCode).toBe(10)

    const recover = await execa(devBin, ['recover', '--route', 'retry'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_K3D_BIN: mockK3d,
      },
    })
    expect(recover.exitCode).toBe(0)
    expect(recover.stdout).toContain('Ambiente não marcado como saudável')
    },
    20_000,
  )
})
