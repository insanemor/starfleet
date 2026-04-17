import {STATE_SCHEMA_VERSION} from './paths.js'

export type ClusterPhase = 'provisioning' | 'ready' | 'failed' | 'removed'

export type RecoveryRoute = 'retry' | 'rollback' | 'diagnose'

export type RecoveryFailedOperation = {
  command: 'up' | 'add'
  module?: string
  upgrade?: boolean
  failedAt: string
  error: {code: string; message: string}
  retryAttempts: number
}

export type RecoverySnapshot = {
  cluster?: {
    name: string
    specFingerprint: string
    lastPhase: ClusterPhase
    lastStage?: string
    lastError?: {code: string; message: string}
  }
  modules?: {
    active: string[]
    pinned?: Record<string, {version: string; pinnedAt: string}>
  }
}

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
  /** Última validação (Épico 4). */
  validation?: {
    validationStatus?: 'unknown' | 'pending' | 'passed' | 'failed'
    lastRunAt?: string
    confirmedAt?: string
    lastReportPath?: string
  }
  /** Contexto de recuperação (Epic 5). */
  recovery?: {
    lastFailedOperation?: RecoveryFailedOperation
    rollbackSnapshot?: RecoverySnapshot
    lastRecovery?: {
      route: RecoveryRoute
      status: 'succeeded' | 'failed'
      executedAt: string
      note: string
    }
  }
  updatedAt: string
}
