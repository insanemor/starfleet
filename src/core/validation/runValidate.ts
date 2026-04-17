import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {getValidModuleMap} from '../modules/moduleApply.js'
import {readState, writeState} from '../state/index.js'
import {STATE_SCHEMA_VERSION} from '../state/paths.js'
import type {StarfleetStateFileV1} from '../state/stateTypes.js'
import {formatManualChecklistHuman, loadChecklistForModule} from './manualChecklist.js'
import {runIntegrationForModule} from './runIntegration.js'
import {runSmokeForModule} from './runSmoke.js'
import {writeValidationReport} from './validationReport.js'

export type ValidateRunOptions = {
  cwd: string
  smoke: boolean
  integration: boolean
  manual: boolean
  confirm: boolean
}

export type ValidateRunResult = {
  message: string
  data: Record<string, unknown>
}

export async function runValidateOrchestrator(opts: ValidateRunOptions): Promise<ValidateRunResult> {
  const {cwd} = opts
  const prev = readState(cwd)
  if (!prev?.cluster) {
    throw new StarfleetError({
      code: 'MODULE_CLUSTER_STATE_MISSING',
      message: 'Sem estado de cluster; execute starfleet up antes de validar.',
      hint: 'Inicialize o lab e adicione módulos antes da validação.',
      exitCode: ExitCode.usage,
    })
  }

  const active = prev.modules?.active ?? []
  if (active.length === 0) {
    throw new StarfleetError({
      code: 'VALIDATION_NO_MODULES',
      message: 'Nenhum módulo ativo no estado; nada a validar.',
      hint: 'Execute starfleet add <módulo> ou up --profile.',
      exitCode: ExitCode.usage,
    })
  }

  const byId = getValidModuleMap(cwd)

  if (opts.manual) {
    const items: ReturnType<typeof loadChecklistForModule> = []
    for (const id of active) {
      items.push(...loadChecklistForModule(cwd, id))
    }
    const message = formatManualChecklistHuman(items)
    const now = new Date().toISOString()
    const reportPath = writeValidationReport(cwd, {
      generatedAt: now,
      manual: items,
    })
    writeValidationSlice(prev, cwd, {
      validationStatus: 'pending',
      lastRunAt: now,
      lastReportPath: reportPath,
    })
    return {
      message,
      data: {
        mode: 'manual',
        checklist: items,
        reportPath,
        validationStatus: 'pending',
        lastRunAt: now,
      },
    }
  }

  const smokeResults: unknown[] = []
  const integrationResults: unknown[] = []

  if (opts.smoke) {
    logInfo('validate: stage=smoke', {modules: active})
    for (const id of active) {
      const mod = byId.get(id)
      if (!mod) {
        smokeResults.push({moduleId: id, skipped: true, reason: 'módulo não no catálogo'})
        continue
      }
      const r = await runSmokeForModule(cwd, id, mod.absoluteDir)
      smokeResults.push(r)
    }
  }

  if (opts.integration) {
    logInfo('validate: stage=integration', {modules: active})
    for (const id of active) {
      const mod = byId.get(id)
      if (!mod) {
        integrationResults.push({moduleId: id, skipped: true, reason: 'módulo não no catálogo'})
        continue
      }
      const r = await runIntegrationForModule(id, mod.absoluteDir)
      integrationResults.push(r)
    }
  }

  const now = new Date().toISOString()
  const reportPath = writeValidationReport(cwd, {
    generatedAt: now,
    smoke: smokeResults,
    integration: integrationResults.length > 0 ? integrationResults : undefined,
  })

  let message = `Validação concluída. Relatório: ${reportPath}\n`
  message += `Smoke: ${opts.smoke ? `${smokeResults.length} resultado(s)` : 'ignorado'}\n`
  message += `Integração: ${opts.integration ? `${integrationResults.length} resultado(s)` : 'ignorado'}\n`

  const confirmedAt = opts.confirm ? now : undefined
  if (confirmedAt) {
    message += `Confirmação explícita registada: ${confirmedAt} (UTC).\n`
  }

  writeValidationSlice(prev, cwd, {
    validationStatus: 'passed',
    lastRunAt: now,
    lastReportPath: reportPath,
    confirmedAt,
  })

  return {
    message,
    data: {
      mode: 'automated',
      validationStatus: 'passed',
      lastRunAt: now,
      confirmedAt: confirmedAt ?? null,
      reportPath,
      smoke: smokeResults,
      integration: integrationResults,
    },
  }
}

function writeValidationSlice(
  prev: StarfleetStateFileV1,
  cwd: string,
  v: {
    validationStatus: 'pending' | 'passed' | 'failed'
    lastRunAt: string
    lastReportPath: string
    confirmedAt?: string
  },
): void {
  writeState(cwd, {
    schemaVersion: STATE_SCHEMA_VERSION,
    cluster: prev.cluster,
    modules: prev.modules,
    validation: {
      ...(prev.validation ?? {}),
      validationStatus: v.validationStatus,
      lastRunAt: v.lastRunAt,
      lastReportPath: v.lastReportPath,
      ...(v.confirmedAt !== undefined ? {confirmedAt: v.confirmedAt} : {}),
    },
    updatedAt: new Date().toISOString(),
  })
}
