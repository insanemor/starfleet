import type {StarfleetConfig} from '../config/schema.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {STATE_SCHEMA_VERSION, fingerprintFromSpec, writeState} from '../state/index.js'
import {K3dRunner} from './k3dRunner.js'
import {mapConfigToK3dSpec} from './k3dTypes.js'

export type DownTearResult = {
  message: string
  action: 'deleted' | 'already-absent'
}

export async function tearDownLabCluster(
  cwd: string,
  config: StarfleetConfig,
  runner: K3dRunner,
): Promise<DownTearResult> {
  logInfo('down: stage=config', {cwd})
  const spec = mapConfigToK3dSpec(config)
  const fp = fingerprintFromSpec(spec)

  logInfo('down: stage=cluster-list', {})
  const names = await runner.listClusterNames()
  const present = names.includes(spec.name)

  if (present) {
    logInfo('down: stage=cluster-delete', {clusterName: spec.name})
    try {
      await runner.clusterDelete(spec.name)
    } catch (e) {
      if (e instanceof StarfleetError) {
        writeState(cwd, {
          schemaVersion: STATE_SCHEMA_VERSION,
          cluster: {
            name: spec.name,
            specFingerprint: fp,
            lastPhase: 'failed',
            lastStage: 'cluster-delete',
            lastError: {code: e.code, message: e.message},
          },
          updatedAt: new Date().toISOString(),
        })
      }
      throw e
    }
  } else {
    logInfo('down: stage=cluster-delete', {noop: true, clusterName: spec.name})
  }

  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: {
      name: spec.name,
      specFingerprint: fp,
      lastPhase: 'removed',
      lastStage: 'cluster-delete',
    },
    updatedAt: new Date().toISOString(),
  })

  if (present) {
    return {
      message: 'Cluster k3d removido; estado local em .starfleet/ marcado como sem cluster ativo.',
      action: 'deleted',
    }
  }

  return {
    message:
      'Nenhum cluster k3d com este nome no runtime; estado local atualizado (sem cluster ativo).',
    action: 'already-absent',
  }
}
