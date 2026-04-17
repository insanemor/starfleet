import {describe, expect, it} from 'vitest'
import {buildK3dClusterCreateArgs} from './k3dArgs.js'
import type {K3dClusterSpec} from './k3dTypes.js'

describe('buildK3dClusterCreateArgs', () => {
  it('inclui nome, api-port, servers, agents e --wait', () => {
    const spec: K3dClusterSpec = {
      name: 'lab-a',
      kubeApiHostPort: 6550,
      servers: 1,
      agents: 0,
    }
    expect(buildK3dClusterCreateArgs(spec)).toEqual([
      'cluster',
      'create',
      'lab-a',
      '--api-port',
      '0.0.0.0:6550',
      '--servers',
      '1',
      '--agents',
      '0',
      '--wait',
    ])
  })

  it('propaga memória quando definida', () => {
    const spec: K3dClusterSpec = {
      name: 'lab-b',
      kubeApiHostPort: 6443,
      servers: 1,
      agents: 1,
      serversMemory: '512mb',
      agentsMemory: '256mb',
    }
    const args = buildK3dClusterCreateArgs(spec)
    expect(args).toContain('--servers-memory')
    expect(args).toContain('512mb')
    expect(args).toContain('--agents-memory')
    expect(args).toContain('256mb')
  })
})
