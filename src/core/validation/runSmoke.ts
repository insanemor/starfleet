import {exec} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {promisify} from 'node:util'
import {parse as parseYaml} from 'yaml'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {smokeManifestSchema} from './smokeManifest.js'

const execAsync = promisify(exec)

export type SmokeCheckResult = {
  name: string
  ok: boolean
  durationMs?: number
  error?: string
}

export type SmokeModuleResult = {
  moduleId: string
  skipped: boolean
  reason?: string
  checks: SmokeCheckResult[]
}

export async function runSmokeForModule(
  cwd: string,
  moduleId: string,
  moduleRoot: string,
): Promise<SmokeModuleResult> {
  const manifestPath = path.join(moduleRoot, 'tests', 'smoke', 'smoke.yaml')
  if (!fs.existsSync(manifestPath)) {
    return {
      moduleId,
      skipped: true,
      reason: 'tests/smoke/smoke.yaml em falta',
      checks: [],
    }
  }

  let raw: string
  try {
    raw = fs.readFileSync(manifestPath, 'utf8')
  } catch (e) {
    throw new StarfleetError({
      code: 'VALIDATION_SMOKE_READ_FAILED',
      message: `Não foi possível ler ${manifestPath}`,
      hint: 'Verifique permissões do ficheiro smoke.',
      exitCode: ExitCode.validation,
      details: {cause: String(e)},
    })
  }

  let parsed: unknown
  try {
    parsed = parseYaml(raw)
  } catch (e) {
    throw new StarfleetError({
      code: 'VALIDATION_SMOKE_PARSE_ERROR',
      message: `YAML inválido em smoke.yaml (${moduleId})`,
      hint: 'Corrija a sintaxe do manifesto de smoke.',
      exitCode: ExitCode.validation,
      details: {cause: String(e)},
    })
  }

  const m = smokeManifestSchema.safeParse(parsed)
  if (!m.success) {
    throw new StarfleetError({
      code: 'VALIDATION_SMOKE_SCHEMA',
      message: `smoke.yaml do módulo ${moduleId} não cumpre o schema starfleet/smoke/v1`,
      hint: 'Inclua apiVersion e checks[].name + run.',
      exitCode: ExitCode.validation,
      details: {issues: m.error.flatten()},
    })
  }

  const checks: SmokeCheckResult[] = []
  for (const c of m.data.checks) {
    const t0 = Date.now()
    logInfo('validate: smoke check', {moduleId, name: c.name})
    try {
      await execAsync(c.run, {
        cwd: moduleRoot,
        timeout: c.timeoutMs ?? 120_000,
        maxBuffer: 10 * 1024 * 1024,
        env: {...process.env, STARFLEET_MODULE_ROOT: moduleRoot, STARFLEET_MODULE_ID: moduleId},
      })
      checks.push({name: c.name, ok: true, durationMs: Date.now() - t0})
    } catch (e) {
      const err = e as {stderr?: string; message?: string}
      const msg = [err.stderr, err.message].filter(Boolean).join(' ').trim() || String(e)
      checks.push({name: c.name, ok: false, durationMs: Date.now() - t0, error: msg})
      throw new StarfleetError({
        code: 'SMOKE_CHECK_FAILED',
        message: `Smoke falhou no módulo ${moduleId}, check "${c.name}": ${msg}`,
        hint: 'Verifique namespace, labels, kubeconfig e timeouts. Ajuste tests/smoke/smoke.yaml.',
        exitCode: ExitCode.validation,
        details: {moduleId, check: c.name, cwd: moduleRoot},
      })
    }
  }

  return {moduleId, skipped: false, checks}
}
