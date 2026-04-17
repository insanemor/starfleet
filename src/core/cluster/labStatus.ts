import type {StarfleetConfig} from '../config/schema.js'
import type {ClusterPhase} from '../state/stateTypes.js'
import {readState} from '../state/index.js'
import {K3dRunner} from './k3dRunner.js'
import {mapConfigToK3dSpec} from './k3dTypes.js'

export type LabStatusSnapshot = {
  clusterName: string
  statePhase: ClusterPhase | 'missing'
  k3dClusterPresent: boolean
  k3dVersion: string
  activeModules: string[]
  /** Resumo para automação */
  summary: 'cluster-up' | 'no-cluster' | 'drift' | 'provisioning' | 'failed-state'
}

function computeSummary(
  k3dPresent: boolean,
  phase: ClusterPhase | 'missing',
): LabStatusSnapshot['summary'] {
  if (phase === 'failed') {
    return 'failed-state'
  }
  if (phase === 'provisioning') {
    return 'provisioning'
  }
  if (!k3dPresent && phase === 'ready') {
    return 'drift'
  }
  if (k3dPresent && phase === 'removed') {
    return 'drift'
  }
  if (k3dPresent) {
    return 'cluster-up'
  }
  if (!k3dPresent && (phase === 'removed' || phase === 'missing')) {
    return 'no-cluster'
  }
  return 'no-cluster'
}

export async function collectLabStatus(
  cwd: string,
  config: StarfleetConfig,
  runner: K3dRunner,
): Promise<{message: string; statusData: Record<string, unknown>}> {
  const spec = mapConfigToK3dSpec(config)
  const name = spec.name
  const state = readState(cwd)
  const statePhase: ClusterPhase | 'missing' = state?.cluster.lastPhase ?? 'missing'

  const names = await runner.listClusterNames()
  const k3dPresent = names.includes(name)
  const k3dVersion = await runner.getK3dVersionLine()
  const activeModules = state?.modules?.active ?? []

  const summary = computeSummary(k3dPresent, statePhase)

  const snapshot: LabStatusSnapshot = {
    clusterName: name,
    statePhase,
    k3dClusterPresent: k3dPresent,
    k3dVersion,
    activeModules,
    summary,
  }

  const lines: string[] = [
    `Lab (manifesto): ${name}`,
    `Estado local (.starfleet): ${statePhase === 'missing' ? 'sem ficheiro' : statePhase}`,
    `Cluster no k3d: ${k3dPresent ? 'sim' : 'não'}`,
    `k3d (ferramenta): ${k3dVersion}`,
    `Módulos ativos: ${activeModules.length > 0 ? activeModules.join(', ') : '(nenhum)'}`,
  ]

  if (summary === 'no-cluster') {
    lines.push('Dica: execute `starfleet up` para criar ou reconciliar o cluster.')
  }
  if (summary === 'drift') {
    lines.push(
      'Atenção: divergência entre estado local e k3d — avalie `starfleet up` ou `starfleet down` antes de continuar.',
    )
  }
  if (summary === 'failed-state' && state?.cluster.lastError) {
    lines.push(`Último erro registado: [${state.cluster.lastError.code}] ${state.cluster.lastError.message}`)
  }

  const message = lines.join('\n')

  const statusData: Record<string, unknown> = {
    clusterName: snapshot.clusterName,
    statePhase: snapshot.statePhase,
    k3dClusterPresent: snapshot.k3dClusterPresent,
    k3dVersion: snapshot.k3dVersion,
    activeModules: snapshot.activeModules,
    summary: snapshot.summary,
  }

  return {message, statusData}
}
