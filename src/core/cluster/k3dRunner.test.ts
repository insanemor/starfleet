import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'
import {StarfleetError} from '../errors/StarfleetError.js'
import {K3dRunner} from './k3dRunner.js'
import type {K3dClusterSpec} from './k3dTypes.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const mockK3d = path.join(projectRoot, 'test/fixtures/mock-k3d.sh')

const baseSpec: K3dClusterSpec = {
  name: 'test-cluster',
  kubeApiHostPort: 6550,
  servers: 1,
  agents: 0,
}

describe('K3dRunner', () => {
  const tmpDirs: string[] = []
  afterEach(() => {
    for (const d of tmpDirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    tmpDirs.length = 0
    delete process.env.MOCK_K3D_LOG
    delete process.env.MOCK_K3D_EXIT
  })

  it('invoca o executável com argv explícitos e regista em log (mock)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-k3d-'))
    tmpDirs.push(dir)
    const logFile = path.join(dir, 'log')
    process.env.MOCK_K3D_LOG = logFile
    fs.chmodSync(mockK3d, 0o755)

    const runner = new K3dRunner({executable: mockK3d})
    await runner.clusterCreate(baseSpec)

    const logged = fs.readFileSync(logFile, 'utf8').trim()
    expect(logged).toContain('mock-k3d')
    expect(logged).toContain('cluster')
    expect(logged).toContain('create')
    expect(logged).toContain('test-cluster')
  })

  it('mapeia falha genérica do subprocesso para taxonomia externa', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-k3d-'))
    tmpDirs.push(dir)
    const logFile = path.join(dir, 'log')
    process.env.MOCK_K3D_LOG = logFile
    process.env.MOCK_K3D_EXIT = '1'
    fs.chmodSync(mockK3d, 0o755)

    const runner = new K3dRunner({executable: mockK3d})
    let caught: unknown
    try {
      await runner.clusterCreate(baseSpec)
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(StarfleetError)
    const se = caught as StarfleetError
    expect(se.code).toBe('EXTERNAL_COMMAND_FAILED')
    expect(se.exitCode).toBe(10)
    expect(se.details).toMatchObject({
      command: mockK3d,
      surface: 'k3d',
      category: 'command-failed',
    })
  })

  it('classifica k3d ausente como binário em falta', async () => {
    const runner = new K3dRunner({executable: '/tmp/binario-que-nao-existe-k3d'})
    let caught: unknown
    try {
      await runner.clusterCreate(baseSpec)
    } catch (e) {
      caught = e
    }
    expect(caught).toBeInstanceOf(StarfleetError)
    const se = caught as StarfleetError
    expect(se.code).toBe('EXTERNAL_BINARY_MISSING')
    expect(se.hint).toContain('k3d')
    expect(se.details).toMatchObject({
      surface: 'k3d',
      category: 'binary-missing',
    })
  })
})
