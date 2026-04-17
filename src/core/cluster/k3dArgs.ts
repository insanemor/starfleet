import type {K3dClusterSpec} from './k3dTypes.js'

/** Constrói argv explícito para `k3d cluster create` (sem parsing por shell). */
export function buildK3dClusterCreateArgs(spec: K3dClusterSpec): string[] {
  const args: string[] = [
    'cluster',
    'create',
    spec.name,
    '--api-port',
    `0.0.0.0:${spec.kubeApiHostPort}`,
    '--servers',
    String(spec.servers),
    '--agents',
    String(spec.agents),
    '--wait',
  ]
  if (spec.serversMemory !== undefined) {
    args.push('--servers-memory', spec.serversMemory)
  }
  if (spec.agentsMemory !== undefined) {
    args.push('--agents-memory', spec.agentsMemory)
  }
  return args
}
