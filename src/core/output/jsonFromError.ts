import type {StarfleetError} from '../errors/StarfleetError.js'
import type {CliJsonError} from './jsonEnvelope.js'

function mergeDetails(base: unknown, extra: Record<string, unknown>): Record<string, unknown> {
  if (base !== undefined && base !== null && typeof base === 'object' && !Array.isArray(base)) {
    return {...(base as Record<string, unknown>), ...extra}
  }
  if (base !== undefined) {
    return {value: base, ...extra}
  }
  return {...extra}
}

export function jsonErrorFromStarfleet(error: StarfleetError, verbose: boolean): CliJsonError {
  if (!verbose) {
    return {
      code: error.code,
      message: error.message,
      hint: error.hint,
      ...(error.details !== undefined ? {details: error.details} : {}),
    }
  }
  const details = mergeDetails(error.details, {
    ...(error.stack ? {stack: error.stack} : {}),
  })
  return {
    code: error.code,
    message: error.message,
    hint: error.hint,
    ...(Object.keys(details).length > 0 ? {details} : {}),
  }
}

export function jsonErrorFromGeneric(error: Error, verbose: boolean): CliJsonError {
  return {
    code: 'INTERNAL_ERROR',
    message: error.message,
    hint: 'Erro interno não classificado.',
    ...(verbose && error.stack ? {details: {stack: error.stack}} : {}),
  }
}

export function jsonErrorFromUnknown(value: unknown, verbose: boolean): CliJsonError {
  return {
    code: 'INTERNAL_ERROR',
    message: String(value),
    hint: 'Erro inesperado.',
    ...(verbose && value instanceof Error && value.stack ? {details: {stack: value.stack}} : {}),
  }
}
