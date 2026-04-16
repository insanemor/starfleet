import type {Command} from '@oclif/core'
import {ExitCode} from './errors/exitCodes.js'
import {formatGenericFailure, formatHumanCliError, formatUnknownFailure} from './errors/formatError.js'
import {StarfleetError} from './errors/StarfleetError.js'
import type {CliJsonEnvelope, OutputMode} from './output/jsonEnvelope.js'
import {serializeJsonEnvelope, utcTimestamp} from './output/jsonEnvelope.js'
import {jsonErrorFromGeneric, jsonErrorFromStarfleet, jsonErrorFromUnknown} from './output/jsonFromError.js'

export type HandleCoreErrorOptions = {
  verbose?: boolean
  output?: OutputMode
  /** Nome lógico do comando (ex.: `up`), obrigatório para envelope JSON. */
  command?: string
}

function writeJsonFailure(
  command: string,
  exitCode: number,
  errorPayload: CliJsonEnvelope['error'],
  cmd: Command,
): void {
  const env: CliJsonEnvelope = {
    ok: false,
    command,
    data: null,
    error: errorPayload,
    timestamp: utcTimestamp(),
  }
  process.stdout.write(serializeJsonEnvelope(env))
  cmd.exit(exitCode)
}

/** Erros do core → stderr humano ou stdout JSON + exit code determinístico. */
export function handleCoreError(cmd: Command, error: unknown, options?: HandleCoreErrorOptions): void {
  const verbose = options?.verbose === true
  const output = options?.output ?? 'human'
  const command = options?.command ?? 'unknown'

  if (output === 'json') {
    if (error instanceof StarfleetError) {
      writeJsonFailure(command, error.exitCode, jsonErrorFromStarfleet(error, verbose), cmd)
      return
    }
    if (error instanceof Error) {
      writeJsonFailure(command, ExitCode.generic, jsonErrorFromGeneric(error, verbose), cmd)
      return
    }
    writeJsonFailure(command, ExitCode.generic, jsonErrorFromUnknown(error, verbose), cmd)
    return
  }

  if (error instanceof StarfleetError) {
    process.stderr.write(formatHumanCliError(error, verbose))
    cmd.exit(error.exitCode)
  }
  if (error instanceof Error) {
    process.stderr.write(formatGenericFailure(error, verbose))
    cmd.exit(ExitCode.generic)
  }
  process.stderr.write(formatUnknownFailure(error, verbose))
  cmd.exit(ExitCode.generic)
}
