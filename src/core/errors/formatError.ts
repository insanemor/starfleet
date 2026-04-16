import {StarfleetError} from './StarfleetError.js'

/** Saída humana estável (linhas `code:` / `message:` / `hint:`); Story 1.4 adiciona JSON. */
export function formatHumanCliError(error: StarfleetError, verbose: boolean): string {
  const lines = [
    `code: ${error.code}`,
    `message: ${error.message}`,
    `hint: ${error.hint}`,
  ]
  if (error.details !== undefined) {
    lines.push(`details: ${JSON.stringify(error.details)}`)
  }
  if (verbose) {
    if (error.stack) {
      lines.push(`stack: ${error.stack}`)
    }
    if (error.cause) {
      lines.push(`cause: ${error.cause instanceof Error ? error.cause.stack ?? String(error.cause) : String(error.cause)}`)
    }
  }
  return lines.join('\n') + '\n'
}

export function formatGenericFailure(error: Error, verbose: boolean): string {
  const lines = [
    `code: INTERNAL_ERROR`,
    `message: ${error.message}`,
    `hint: Erro interno não classificado. Use --verbose para ver o stack.`,
  ]
  if (verbose && error.stack) {
    lines.push(`stack: ${error.stack}`)
  }
  return lines.join('\n') + '\n'
}

export function formatUnknownFailure(value: unknown, verbose: boolean): string {
  const lines = [
    `code: INTERNAL_ERROR`,
    `message: ${String(value)}`,
    `hint: Erro inesperado. Use --verbose se disponível.`,
  ]
  if (verbose && value instanceof Error && value.stack) {
    lines.push(`stack: ${value.stack}`)
  }
  return lines.join('\n') + '\n'
}
