import {STATE_SCHEMA_VERSION} from './paths.js'

export type ClusterPhase = 'provisioning' | 'ready' | 'failed' | 'removed'

export type StarfleetStateFileV1 = {
  schemaVersion: typeof STATE_SCHEMA_VERSION
  cluster: {
    name: string
    specFingerprint: string
    lastPhase: ClusterPhase
    /** Último estágio conhecido (ex.: `cluster-create`, `converge`). */
    lastStage?: string
    lastError?: {code: string; message: string}
  }
  /** Módulos aplicados (Épico 3). */
  modules?: {
    active: string[]
    /** Versão pinada por id de pasta em modules/. */
    pinned?: Record<string, {version: string; pinnedAt: string}>
  }
  updatedAt: string
}
