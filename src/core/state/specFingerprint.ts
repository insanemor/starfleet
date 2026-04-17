import {createHash} from 'node:crypto'
import type {K3dClusterSpec} from '../cluster/k3dTypes.js'

/** Hash estável do spec para detetar drift entre manifesto e último apply. */
export function fingerprintFromSpec(spec: K3dClusterSpec): string {
  const stable = {
    name: spec.name,
    kubeApiHostPort: spec.kubeApiHostPort,
    servers: spec.servers,
    agents: spec.agents,
    serversMemory: spec.serversMemory ?? null,
    agentsMemory: spec.agentsMemory ?? null,
  }
  return createHash('sha256').update(JSON.stringify(stable)).digest('hex')
}
