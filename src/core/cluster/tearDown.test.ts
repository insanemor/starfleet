import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {afterEach, describe, expect, it} from 'vitest'
import type {StarfleetConfig} from '../config/schema.js'
import {readState} from '../state/index.js'
import {K3dRunner} from './k3dRunner.js'
import {tearDownLabCluster} from './tearDown.js'

const baseConfig: StarfleetConfig = {
  apiVersion: 'starfleet/v1',
  cluster: {name: 'lab-down'},
}

class StubRunner extends K3dRunner {
  deleteCount = 0
  constructor(private readonly listNames: string[]) {
    super({executable: '/bin/false'})
  }
  override async listClusterNames(): Promise<string[]> {
    return this.listNames
  }
  override async clusterDelete(): Promise<void> {
    this.deleteCount++
  }
}

describe('tearDownLabCluster', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('chama delete quando o cluster está listado', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-down-'))
    dirs.push(dir)
    const runner = new StubRunner(['lab-down'])
    const res = await tearDownLabCluster(dir, baseConfig, runner)
    expect(res.action).toBe('deleted')
    expect(runner.deleteCount).toBe(1)
    const st = readState(dir)
    expect(st?.cluster.lastPhase).toBe('removed')
  })

  it('não chama delete quando o cluster não existe (no-op seguro)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-down-'))
    dirs.push(dir)
    const runner = new StubRunner([])
    const res = await tearDownLabCluster(dir, baseConfig, runner)
    expect(res.action).toBe('already-absent')
    expect(runner.deleteCount).toBe(0)
    const st = readState(dir)
    expect(st?.cluster.lastPhase).toBe('removed')
  })
})
