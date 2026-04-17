import type {StarfleetConfig} from '../config/schema.js'
import {K3dRunner} from './k3dRunner.js'
import {mapConfigToK3dSpec} from './k3dTypes.js'

/** Ponto de entrada do core para criação de cluster a partir do manifesto (Story 2.1). */
export async function createLabCluster(
  config: StarfleetConfig,
  runner: K3dRunner = new K3dRunner(),
): Promise<void> {
  const spec = mapConfigToK3dSpec(config)
  await runner.clusterCreate(spec)
}
