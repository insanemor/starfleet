import type {StarfleetConfig} from '../config/schema.js'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {STATE_SCHEMA_VERSION, fingerprintFromSpec, readState, writeState} from '../state/index.js'
import {createLabCluster} from './createCluster.js'
import {K3dRunner} from './k3dRunner.js'
import {mapConfigToK3dSpec} from './k3dTypes.js'
import {assertHostTcpPortAvailable} from './preflightHostPort.js'

export type UpConvergeResult = {
  message: string
  action: 'created' | 'unchanged' | 'recovered'
}

export async function convergeClusterUp(
  cwd: string,
  config: StarfleetConfig,
  runner: K3dRunner,
): Promise<UpConvergeResult> {
  logInfo('up: stage=config', {cwd})
  const spec = mapConfigToK3dSpec(config)
  const fp = fingerprintFromSpec(spec)
  logInfo('up: stage=spec', {clusterName: spec.name, specFingerprint: fp.slice(0, 16)})

  logInfo('up: stage=cluster-list', {})
  const names = await runner.listClusterNames()
  const exists = names.includes(spec.name)

  const previous = readState(cwd)

  if (exists) {
    if (
      previous &&
      previous.cluster.name === spec.name &&
      previous.cluster.specFingerprint === fp
    ) {
      const wasFailed = previous.cluster.lastPhase === 'failed'
      logInfo('up: stage=converge', {
        action: wasFailed ? 'reconcile-after-failure' : 'no-op',
        reason: wasFailed ? 'state-had-failure' : 'spec-matches',
      })
      writeState(cwd, {
        schemaVersion: STATE_SCHEMA_VERSION,
        cluster: {
          name: spec.name,
          specFingerprint: fp,
          lastPhase: 'ready',
          lastStage: wasFailed ? 'recover' : 'converge',
        },
        updatedAt: new Date().toISOString(),
      })
      return {
        message: wasFailed
          ? 'Lab recuperado: cluster presente e alinhado com o manifesto (estado anterior registava falha).'
          : 'Cluster já em execução e alinhado com este manifesto; nada a fazer.',
        action: wasFailed ? 'recovered' : 'unchanged',
      }
    }

    if (
      previous &&
      previous.cluster.name === spec.name &&
      previous.cluster.specFingerprint !== fp
    ) {
      throw new StarfleetError({
        code: 'CLUSTER_SPEC_MISMATCH',
        message:
          'O manifesto atual não coincide com o último cluster aplicado neste diretório (fingerprint diferente).',
        hint: 'Execute `starfleet down` para remover o cluster antes de alterar parâmetros, ou alinhe o starfleet.yaml ao estado desejado.',
        exitCode: ExitCode.cluster,
        details: {expectedFingerprint: previous.cluster.specFingerprint, currentFingerprint: fp},
      })
    }

    logInfo('up: stage=state', {action: 'sync-metadata'})
    writeState(cwd, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {
        name: spec.name,
        specFingerprint: fp,
        lastPhase: 'ready',
        lastStage: 'sync-local',
      },
      updatedAt: new Date().toISOString(),
    })
    return {
      message:
        'Cluster k3d já existente com este nome; estado local em .starfleet/state.json sincronizado (metadata).',
      action: 'unchanged',
    }
  }

  const recoveringFromFailure = previous?.cluster.lastPhase === 'failed'
  if (recoveringFromFailure && previous) {
    logInfo('up: stage=recover', {
      reason: 'retry-cluster-create',
      lastStage: previous.cluster.lastStage,
      lastError: previous.cluster.lastError,
    })
  }

  logInfo('up: stage=preflight', {kubeApiHostPort: spec.kubeApiHostPort})
  await assertHostTcpPortAvailable(spec.kubeApiHostPort)

  logInfo('up: stage=cluster-create', {})
  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: {
      name: spec.name,
      specFingerprint: fp,
      lastPhase: 'provisioning',
      lastStage: 'cluster-create',
    },
    updatedAt: new Date().toISOString(),
  })

  try {
    await createLabCluster(config, runner)
  } catch (e) {
    const lastError =
      e instanceof StarfleetError
        ? {code: e.code, message: e.message}
        : {code: 'INTERNAL_ERROR', message: e instanceof Error ? e.message : String(e)}
    writeState(cwd, {
      schemaVersion: STATE_SCHEMA_VERSION,
      cluster: {
        name: spec.name,
        specFingerprint: fp,
        lastPhase: 'failed',
        lastStage: 'cluster-create',
        lastError,
      },
      updatedAt: new Date().toISOString(),
    })
    throw e
  }

  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: {
      name: spec.name,
      specFingerprint: fp,
      lastPhase: 'ready',
      lastStage: 'cluster-create',
    },
    updatedAt: new Date().toISOString(),
  })

  return {
    message: recoveringFromFailure
      ? `Lab recuperado: cluster criado após falha anterior; estado gravado em .starfleet/ (schema v${STATE_SCHEMA_VERSION}).`
      : `Cluster criado e estado gravado em .starfleet/ (schema v${STATE_SCHEMA_VERSION}).`,
    action: recoveringFromFailure ? 'recovered' : 'created',
  }
}
