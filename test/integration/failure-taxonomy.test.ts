import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

function makeLabRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-taxonomy-'))
}

function writeMinimalConfig(labRoot: string): string {
  const configPath = path.join(labRoot, 'starfleet.yaml')
  fs.writeFileSync(
    configPath,
    `apiVersion: starfleet/v1
cluster:
  name: taxonomy-lab
`,
    'utf8',
  )
  return configPath
}

function writeStateForAdd(labRoot: string): void {
  const starfleetDir = path.join(labRoot, '.starfleet')
  fs.mkdirSync(starfleetDir, {recursive: true})
  fs.writeFileSync(
    path.join(starfleetDir, 'state.json'),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        cluster: {
          name: 'taxonomy-lab',
          specFingerprint: 'test-fingerprint',
          lastPhase: 'ready',
        },
        modules: {active: []},
        updatedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    'utf8',
  )
}

function writeModuleWithHook(labRoot: string, moduleId: string, hookCommand: string): void {
  const moduleDir = path.join(labRoot, 'modules', moduleId)
  fs.mkdirSync(moduleDir, {recursive: true})
  fs.writeFileSync(
    path.join(moduleDir, 'module.yaml'),
    `apiVersion: starfleet/module/v1
description: Taxonomy test module
version: 0.0.1
hooks:
  install:
    - "${hookCommand}"
`,
    'utf8',
  )
}

describe('taxonomia de falhas externas', () => {
  const dirs: string[] = []

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('up em JSON classifica k3d ausente como EXTERNAL_BINARY_MISSING', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)

    const result = await execa(devBin, ['up', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
        STARFLEET_K3D_BIN: '/tmp/k3d-inexistente-para-teste',
      },
    })

    expect(result.exitCode).toBe(10)
    const payload = JSON.parse(result.stdout.trim()) as {
      ok: boolean
      error: {code: string; hint: string}
    }
    expect(payload.ok).toBe(false)
    expect(payload.error.code).toBe('EXTERNAL_BINARY_MISSING')
    expect(payload.error.hint.toLowerCase()).toContain('k3d')
  })

  it('add classifica hook kubectl ausente como EXTERNAL_BINARY_MISSING', async () => {
    const labRoot = makeLabRoot()
    dirs.push(labRoot)
    const configPath = writeMinimalConfig(labRoot)
    writeStateForAdd(labRoot)
    writeModuleWithHook(labRoot, 'taxonomy-mod', 'kubectl-does-not-exist version --client')

    const result = await execa(devBin, ['add', 'taxonomy-mod'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_WORKDIR: labRoot,
      },
    })

    expect(result.exitCode).toBe(20)
    expect(result.stderr).toContain('code: EXTERNAL_BINARY_MISSING')
    expect(result.stderr.toLowerCase()).toContain('kubectl')
  })
})
