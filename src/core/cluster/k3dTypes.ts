import type {StarfleetConfig} from '../config/schema.js'

/** Parâmetros explícitos para `k3d cluster create` derivados do manifesto. */
export type K3dClusterSpec = {
  name: string
  kubeApiHostPort: number
  servers: number
  agents: number
  serversMemory?: string
  agentsMemory?: string
}

const DEFAULT_API_PORT = 6550
const DEFAULT_SERVERS = 1
const DEFAULT_AGENTS = 0

export function mapConfigToK3dSpec(config: StarfleetConfig): K3dClusterSpec {
  const {cluster} = config
  return {
    name: cluster.name,
    kubeApiHostPort: cluster.kubeApiPort ?? DEFAULT_API_PORT,
    servers: cluster.servers ?? DEFAULT_SERVERS,
    agents: cluster.agents ?? DEFAULT_AGENTS,
    serversMemory: cluster.serversMemory,
    agentsMemory: cluster.agentsMemory,
  }
}
