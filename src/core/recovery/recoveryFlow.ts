import type {StarfleetConfig} from '../config/schema.js'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {applyAddModule} from '../modules/moduleApply.js'
import {readState, writeState} from '../state/index.js'
import type {RecoveryRoute, StarfleetStateFileV1} from '../state/stateTypes.js'
import {runValidateOrchestrator} from '../validation/runValidate.js'
import {K3dRunner} from '../cluster/k3dRunner.js'
import {convergeClusterUp} from '../cluster/convergeUp.js'

export type RecoverResult = {
  message: string
  route: RecoveryRoute
  validation?: {
    attempted: boolean
    status: 'passed' | 'failed' | 'skipped'
    reason?: string
    reportPath?: string
  }
}

export async function executeRecoveryFlow(options: {
  cwd: string
  route: RecoveryRoute
  config: StarfleetConfig
  runner: K3dRunner
  validateAfterRecover: boolean
  confirmValidation: boolean
}): Promise<RecoverResult> {
  const state = readState(options.cwd)
  if (!state?.cluster) {
    throw new StarfleetError({
      code: 'RECOVERY_STATE_MISSING',
      message: 'Sem estado local para recuperar.',
      hint: 'Execute starfleet up antes de usar recover.',
      exitCode: ExitCode.usage,
    })
  }

  switch (options.route) {
    case 'diagnose':
      return runDiagnose(options.cwd, state)
    case 'rollback':
      return runRollback(options.cwd, state)
    case 'retry':
      return runRetry(options)
  }
}

function runDiagnose(cwd: string, state: StarfleetStateFileV1): RecoverResult {
  const failed = state.recovery?.lastFailedOperation
  const lines: string[] = []
  lines.push('Diagnóstico de recuperação')
  lines.push(`- Fase do cluster: ${state.cluster.lastPhase}`)
  lines.push(`- Último estágio: ${state.cluster.lastStage ?? 'desconhecido'}`)
  if (state.cluster.lastError) {
    lines.push(`- Erro no estado do cluster: [${state.cluster.lastError.code}] ${state.cluster.lastError.message}`)
  }
  if (failed) {
    lines.push(`- Última operação falhada: ${failed.command}${failed.module ? ` (${failed.module})` : ''}`)
    lines.push(`- Código: ${failed.error.code}`)
    lines.push(`- Tentativas retry já feitas: ${failed.retryAttempts}`)
  } else {
    lines.push('- Sem operação falhada registada para retry.')
  }
  const rollbackAvailable = state.recovery?.rollbackSnapshot !== undefined
  lines.push(`- Rollback disponível: ${rollbackAvailable ? 'sim' : 'não'}`)
  lines.push('Rotas sugeridas:')
  lines.push('- retry: reexecuta a operação falhada com logs de tentativa numerados')
  lines.push('- rollback: restaura snapshot anterior quando disponível')
  lines.push('- diagnose: mantém apenas análise (sem alterações)')
  noteRecovery(cwd, state, {
    route: 'diagnose',
    status: 'succeeded',
    note: 'Diagnóstico executado sem alteração de estado.',
  })
  return {message: lines.join('\n'), route: 'diagnose', validation: {attempted: false, status: 'skipped'}}
}

async function runRollback(cwd: string, state: StarfleetStateFileV1): Promise<RecoverResult> {
  const snapshot = state.recovery?.rollbackSnapshot
  if (!snapshot) {
    throw new StarfleetError({
      code: 'RECOVERY_ROLLBACK_UNAVAILABLE',
      message: 'Não há snapshot para rollback.',
      hint: 'Use `starfleet recover --route diagnose` para inspeção, ou tente `--route retry`.',
      exitCode: ExitCode.usage,
    })
  }

  if (snapshot.cluster === undefined && snapshot.modules === undefined) {
    throw new StarfleetError({
      code: 'RECOVERY_ROLLBACK_UNAVAILABLE',
      message: 'Snapshot de rollback está vazio.',
      hint: 'Não foi possível restaurar revisão anterior automaticamente.',
      exitCode: ExitCode.usage,
    })
  }

  const next: StarfleetStateFileV1 = {
    ...state,
    cluster: snapshot.cluster ?? state.cluster,
    modules: snapshot.modules ?? state.modules,
    recovery: {
      ...state.recovery,
      lastFailedOperation: undefined,
    },
    updatedAt: new Date().toISOString(),
  }
  writeState(cwd, next)
  noteRecovery(cwd, next, {
    route: 'rollback',
    status: 'succeeded',
    note: 'Rollback aplicado para snapshot anterior.',
  })

  return {
    message:
      'Rollback concluído: estado local restaurado para a revisão anterior disponível. Recomenda-se executar `starfleet status` e `starfleet validate`.',
    route: 'rollback',
    validation: {attempted: false, status: 'skipped'},
  }
}

async function runRetry(options: {
  cwd: string
  route: RecoveryRoute
  config: StarfleetConfig
  runner: K3dRunner
  validateAfterRecover: boolean
  confirmValidation: boolean
}): Promise<RecoverResult> {
  const state = readState(options.cwd)
  if (!state?.cluster) {
    throw new StarfleetError({
      code: 'RECOVERY_STATE_MISSING',
      message: 'Sem estado local para retry.',
      hint: 'Execute starfleet up para inicializar o estado.',
      exitCode: ExitCode.usage,
    })
  }
  const failed = state.recovery?.lastFailedOperation
  if (!failed) {
    throw new StarfleetError({
      code: 'RECOVERY_RETRY_UNAVAILABLE',
      message: 'Não existe operação falhada para retry.',
      hint: 'Use `starfleet recover --route diagnose` para avaliar próximas ações.',
      exitCode: ExitCode.usage,
    })
  }

  const attempt = failed.retryAttempts + 1
  logInfo('recover: retry attempt', {
    attempt,
    command: failed.command,
    module: failed.module ?? null,
  })

  try {
    if (failed.command === 'up') {
      await convergeClusterUp(options.cwd, options.config, options.runner)
    } else if (failed.command === 'add') {
      if (!failed.module) {
        throw new StarfleetError({
          code: 'RECOVERY_RETRY_UNAVAILABLE',
          message: 'Não há módulo associado à falha de add para retry.',
          hint: 'Use rollback ou diagnose para continuar.',
          exitCode: ExitCode.usage,
        })
      }
      await applyAddModule(options.cwd, failed.module, {
        upgrade: failed.upgrade === true,
      })
    }
  } catch (error) {
    const e =
      error instanceof StarfleetError
        ? error
        : new StarfleetError({
            code: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : String(error),
            hint: 'Erro interno durante retry.',
            exitCode: ExitCode.generic,
          })
    const current = readState(options.cwd)
    if (current?.cluster) {
      writeState(options.cwd, {
        ...current,
        recovery: {
          ...current.recovery,
          lastFailedOperation: {
            ...failed,
            failedAt: new Date().toISOString(),
            retryAttempts: attempt,
            error: {code: e.code, message: e.message},
          },
        },
        updatedAt: new Date().toISOString(),
      })
    }
    throw e
  }

  let validation: NonNullable<RecoverResult['validation']> = {
    attempted: false,
    status: 'skipped',
    reason: 'Revalidação desativada por flag.',
  }
  if (options.validateAfterRecover) {
    validation = (await runPostRecoveryValidation(
      options.cwd,
      options.confirmValidation,
    )) as NonNullable<RecoverResult['validation']>
  }

  const after = readState(options.cwd)
  if (after?.cluster) {
    writeState(options.cwd, {
      ...after,
      recovery: {
        ...after.recovery,
        lastFailedOperation: undefined,
      },
      updatedAt: new Date().toISOString(),
    })
    noteRecovery(options.cwd, readState(options.cwd)!, {
      route: 'retry',
      status: validation.status === 'failed' ? 'failed' : 'succeeded',
      note:
        validation.status === 'failed'
          ? `Retry executado, mas validação pós-recuperação falhou (${validation.reason ?? 'sem motivo'}).`
          : 'Retry executado com sucesso.',
    })
  }

  const baseMessage =
    failed.command === 'up'
      ? `Retry #${attempt} concluído para operação up.`
      : `Retry #${attempt} concluído para operação add (${failed.module}).`
  const validationMessage =
    validation.attempted === false
      ? ' Revalidação não executada.'
      : validation.status === 'passed'
        ? ' Revalidação automática concluída com sucesso.'
        : ` Revalidação falhou: ${validation.reason ?? 'erro não classificado'}. Ambiente não marcado como saudável.`
  const nextHint =
    validation.status === 'failed'
      ? ' Próximo passo sugerido: use `starfleet recover --route diagnose` e depois escolha retry/rollback.'
      : ''

  return {
    message: `${baseMessage}${validationMessage}${nextHint}`,
    route: 'retry',
    validation,
  }
}

async function runPostRecoveryValidation(
  cwd: string,
  confirmValidation: boolean,
): Promise<NonNullable<RecoverResult['validation']>> {
  try {
    const result = await runValidateOrchestrator({
      cwd,
      smoke: true,
      integration: false,
      manual: false,
      confirm: confirmValidation,
    })
    return {
      attempted: true,
      status: 'passed',
      reportPath: (result.data.reportPath as string | undefined) ?? undefined,
    }
  } catch (error) {
    const now = new Date().toISOString()
    const state = readState(cwd)
    if (state?.cluster) {
      writeState(cwd, {
        ...state,
        validation: {
          ...(state.validation ?? {}),
          validationStatus: 'failed',
          lastRunAt: now,
        },
        updatedAt: now,
      })
    }
    const e = error instanceof StarfleetError ? error : undefined
    return {
      attempted: true,
      status: 'failed',
      reason: e ? `${e.code}: ${e.message}` : String(error),
    }
  }
}

export function recordFailedOperation(
  cwd: string,
  details: {
    command: 'up' | 'add'
    module?: string
    upgrade?: boolean
    error: {code: string; message: string}
    rollbackSnapshot?: {cluster?: StarfleetStateFileV1['cluster']; modules?: StarfleetStateFileV1['modules']}
  },
): void {
  const state = readState(cwd)
  if (!state?.cluster) {
    return
  }
  writeState(cwd, {
    ...state,
    recovery: {
      ...state.recovery,
      lastFailedOperation: {
        command: details.command,
        module: details.module,
        upgrade: details.upgrade,
        failedAt: new Date().toISOString(),
        error: details.error,
        retryAttempts: 0,
      },
      rollbackSnapshot: details.rollbackSnapshot ?? state.recovery?.rollbackSnapshot,
    },
    updatedAt: new Date().toISOString(),
  })
}

export function clearFailedOperation(cwd: string): void {
  const state = readState(cwd)
  if (!state?.cluster || state.recovery?.lastFailedOperation === undefined) {
    return
  }
  writeState(cwd, {
    ...state,
    recovery: {
      ...state.recovery,
      lastFailedOperation: undefined,
    },
    updatedAt: new Date().toISOString(),
  })
}

function noteRecovery(
  cwd: string,
  state: StarfleetStateFileV1,
  details: {
    route: RecoveryRoute
    status: 'succeeded' | 'failed'
    note: string
  },
): void {
  writeState(cwd, {
    ...state,
    recovery: {
      ...state.recovery,
      lastRecovery: {
        route: details.route,
        status: details.status,
        executedAt: new Date().toISOString(),
        note: details.note,
      },
    },
    updatedAt: new Date().toISOString(),
  })
}
