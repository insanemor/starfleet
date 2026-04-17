import fs from 'node:fs'
import net from 'node:net'
import os from 'node:os'
import path from 'node:path'
import {afterEach, beforeAll, describe, expect, it} from 'vitest'
import type {StarfleetConfig} from '../config/schema.js'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {fingerprintFromSpec} from '../state/index.js'
import {convergeClusterUp} from './convergeUp.js'
import {K3dRunner} from './k3dRunner.js'
import {mapConfigToK3dSpec} from './k3dTypes.js'

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, '0.0.0.0', () => {
      const a = s.address()
      const p = typeof a === 'object' && a !== null ? a.port : 0
      s.close((err) => {
        if (err) reject(err)
        else resolve(p)
      })
    })
  })
}

let baseConfig: StarfleetConfig

class StubRunner extends K3dRunner {
  createCount = 0
  constructor(private readonly listNames: string[]) {
    super({executable: '/bin/false'})
  }
  override async listClusterNames(): Promise<string[]> {
    return this.listNames
  }
  override async clusterCreate(): Promise<void> {
    this.createCount++
  }
}

/** Primeira chamada a `clusterCreate` falha; a segunda tem sucesso (reexecução segura). */
class FlakyCreateRunner extends K3dRunner {
  createCount = 0
  constructor(private readonly listNames: string[]) {
    super({executable: '/bin/false'})
  }
  override async listClusterNames(): Promise<string[]> {
    return this.listNames
  }
  override async clusterCreate(): Promise<void> {
    this.createCount++
    if (this.createCount === 1) {
      throw new StarfleetError({
        code: 'CLUSTER_K3D_FAILED',
        message: 'primeira tentativa falhou (teste)',
        hint: 'repetir',
        exitCode: ExitCode.cluster,
      })
    }
  }
}

describe('convergeClusterUp', () => {
  beforeAll(async () => {
    const testKubePort = await getFreePort()
    baseConfig = {
      apiVersion: 'starfleet/v1',
      cluster: {name: 'lab-it', kubeApiPort: testKubePort},
    }
  })

  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('cria cluster quando o nome não aparece no k3d', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const runner = new StubRunner([])
    const res = await convergeClusterUp(dir, baseConfig, runner)
    expect(res.action).toBe('created')
    expect(runner.createCount).toBe(1)
    const raw = fs.readFileSync(path.join(dir, '.starfleet', 'state.json'), 'utf8')
    expect(raw).toContain('"lastPhase": "ready"')
  })

  it('não recria quando cluster existe e o estado reflete o mesmo fingerprint', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const spec = mapConfigToK3dSpec(baseConfig)
    const fp = fingerprintFromSpec(spec)
    fs.mkdirSync(path.join(dir, '.starfleet'), {recursive: true})
    fs.writeFileSync(
      path.join(dir, '.starfleet', 'state.json'),
      JSON.stringify({
        schemaVersion: 1,
        cluster: {
          name: 'lab-it',
          specFingerprint: fp,
          lastPhase: 'ready',
          lastStage: 'cluster-create',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
    const runner = new StubRunner(['lab-it'])
    const res = await convergeClusterUp(dir, baseConfig, runner)
    expect(res.action).toBe('unchanged')
    expect(runner.createCount).toBe(0)
  })

  it('lança CLUSTER_SPEC_MISMATCH quando o manifesto mudou face ao estado', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    fs.mkdirSync(path.join(dir, '.starfleet'), {recursive: true})
    fs.writeFileSync(
      path.join(dir, '.starfleet', 'state.json'),
      JSON.stringify({
        schemaVersion: 1,
        cluster: {
          name: 'lab-it',
          specFingerprint: 'deadbeef',
          lastPhase: 'ready',
          lastStage: 'cluster-create',
        },
        updatedAt: new Date().toISOString(),
      }),
    )
    const runner = new StubRunner(['lab-it'])
    await expect(convergeClusterUp(dir, baseConfig, runner)).rejects.toMatchObject({
      code: 'CLUSTER_SPEC_MISMATCH',
    })
  })

  it('sincroniza metadata quando o cluster existe mas não há estado local', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const runner = new StubRunner(['lab-it'])
    const res = await convergeClusterUp(dir, baseConfig, runner)
    expect(res.action).toBe('unchanged')
    expect(runner.createCount).toBe(0)
    expect(fs.existsSync(path.join(dir, '.starfleet', 'state.json'))).toBe(true)
  })

  it('recupera quando o estado regista falha mas o cluster já existe e o spec coincide', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const spec = mapConfigToK3dSpec(baseConfig)
    const fp = fingerprintFromSpec(spec)
    fs.mkdirSync(path.join(dir, '.starfleet'), {recursive: true})
    fs.writeFileSync(
      path.join(dir, '.starfleet', 'state.json'),
      JSON.stringify({
        schemaVersion: 1,
        cluster: {
          name: 'lab-it',
          specFingerprint: fp,
          lastPhase: 'failed',
          lastStage: 'cluster-create',
          lastError: {code: 'CLUSTER_K3D_FAILED', message: 'x'},
        },
        updatedAt: new Date().toISOString(),
      }),
    )
    const runner = new StubRunner(['lab-it'])
    const res = await convergeClusterUp(dir, baseConfig, runner)
    expect(res.action).toBe('recovered')
    expect(runner.createCount).toBe(0)
    const raw = JSON.parse(fs.readFileSync(path.join(dir, '.starfleet', 'state.json'), 'utf8'))
    expect(raw.cluster.lastPhase).toBe('ready')
    expect(raw.cluster.lastStage).toBe('recover')
  })

  it('recupera após falha na criação quando nova tentativa consegue criar', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const runner = new FlakyCreateRunner([])
    await expect(convergeClusterUp(dir, baseConfig, runner)).rejects.toMatchObject({
      code: 'CLUSTER_K3D_FAILED',
    })
    const res = await convergeClusterUp(dir, baseConfig, runner)
    expect(res.action).toBe('recovered')
    expect(runner.createCount).toBe(2)
    const raw = fs.readFileSync(path.join(dir, '.starfleet', 'state.json'), 'utf8')
    expect(raw).toContain('"lastPhase": "ready"')
  })

  it('falha no preflight quando a porta da API já está ocupada', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-up-'))
    dirs.push(dir)
    const port = baseConfig.cluster.kubeApiPort
    if (port === undefined) {
      throw new Error('baseConfig.cluster.kubeApiPort must be set')
    }
    const holder = await new Promise<net.Server>((resolve, reject) => {
      const s = net.createServer()
      s.once('error', reject)
      s.listen(port, '0.0.0.0', () => resolve(s))
    })
    try {
      const runner = new StubRunner([])
      await expect(convergeClusterUp(dir, baseConfig, runner)).rejects.toMatchObject({
        code: 'CLUSTER_PORT_UNAVAILABLE',
      })
      expect(runner.createCount).toBe(0)
      expect(fs.existsSync(path.join(dir, '.starfleet'))).toBe(false)
    } finally {
      await new Promise<void>((resolve, reject) => {
        holder.close((e) => (e ? reject(e) : resolve()))
      })
    }
  })
})
