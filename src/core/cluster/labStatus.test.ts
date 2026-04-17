import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import type {StarfleetConfig} from '../config/schema.js'
import {STATE_SCHEMA_VERSION, writeState} from '../state/index.js'
import {collectLabStatus} from './labStatus.js'
import {K3dRunner} from './k3dRunner.js'

const cfg = (name: string): StarfleetConfig => ({
  apiVersion: 'starfleet/v1',
  cluster: {name},
})

class StubRunner extends K3dRunner {
  constructor(
    private readonly names: string[],
    private readonly versionLine = 'k3d version test',
  ) {
    super({executable: '/bin/false'})
  }
  override async listClusterNames(): Promise<string[]> {
    return this.names
  }
  override async getK3dVersionLine(): Promise<string> {
    return this.versionLine
  }
}

describe('collectLabStatus', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('sem cluster: indica no-cluster e dica para up', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-st-'))
    dirs.push(dir)
    const r = await collectLabStatus(dir, cfg('solo'), new StubRunner([]))
    expect(r.statusData.summary).toBe('no-cluster')
    expect(r.message).toContain('starfleet up')
  })

  it('cluster alinhado: summary cluster-up', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-st-'))
    dirs.push(dir)
    writeState(dir, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {
        name: 'solo',
        specFingerprint: 'x',
        lastPhase: 'ready',
      },
      updatedAt: new Date().toISOString(),
    })
    const r = await collectLabStatus(dir, cfg('solo'), new StubRunner(['solo']))
    expect(r.statusData.summary).toBe('cluster-up')
    expect(r.statusData.k3dClusterPresent).toBe(true)
  })

  it('lista módulos ativos quando existem no estado', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-st-'))
    dirs.push(dir)
    writeState(dir, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {
        name: 'solo',
        specFingerprint: 'x',
        lastPhase: 'ready',
      },
      modules: {active: ['obs', 'net']},
      updatedAt: new Date().toISOString(),
    })
    const r = await collectLabStatus(dir, cfg('solo'), new StubRunner(['solo']))
    expect(r.statusData.activeModules).toEqual(['obs', 'net'])
    expect(r.message).toContain('obs, net')
  })
})
