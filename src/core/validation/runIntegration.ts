import {execFile} from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import {promisify} from 'node:util'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'

const execFileAsync = promisify(execFile)

export type IntegrationModuleResult = {
  moduleId: string
  skipped: boolean
  reason?: string
  ok?: boolean
  outputTail?: string
}

/** Executa `tests/integration/run.sh` no diretório do módulo, se existir. */
export async function runIntegrationForModule(
  moduleId: string,
  moduleRoot: string,
): Promise<IntegrationModuleResult> {
  const script = path.join(moduleRoot, 'tests', 'integration', 'run.sh')
  if (!fs.existsSync(script)) {
    return {moduleId, skipped: true, reason: 'tests/integration/run.sh em falta'}
  }

  logInfo('validate: integration', {moduleId})
  try {
    const {stdout, stderr} = await execFileAsync('bash', [script], {
      cwd: moduleRoot,
      timeout: 300_000,
      maxBuffer: 10 * 1024 * 1024,
      env: {...process.env, STARFLEET_MODULE_ROOT: moduleRoot, STARFLEET_MODULE_ID: moduleId},
    })
    const tail = [stdout, stderr].join('\n').trim().slice(-4000)
    return {moduleId, skipped: false, ok: true, outputTail: tail}
  } catch (e) {
    const err = e as {stderr?: Buffer | string; stdout?: Buffer | string; message?: string}
    const msg = [err.stderr, err.stdout, err.message].map((x) => (x !== undefined ? String(x) : '')).join(' ').trim()
    throw new StarfleetError({
      code: 'INTEGRATION_CHECK_FAILED',
      message: `Integração falhou no módulo ${moduleId}: ${msg}`,
      hint: 'Distinga timeouts (exit 124) de erros de configuração no script tests/integration/run.sh.',
      exitCode: ExitCode.validation,
      details: {moduleId},
    })
  }
}
