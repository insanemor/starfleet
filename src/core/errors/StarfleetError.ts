import {ExitCode} from './exitCodes.js'

export type StarfleetErrorOptions = {
  code: string
  message: string
  hint: string
  exitCode: (typeof ExitCode)[keyof typeof ExitCode]
  details?: unknown
  cause?: Error
}

/** Erro de domínio com taxonomia estável para CLI humana e JSON (Epic 1). */
export class StarfleetError extends Error {
  override readonly name = 'StarfleetError'
  readonly code: string
  readonly hint: string
  readonly exitCode: number
  readonly details?: unknown

  constructor(opts: StarfleetErrorOptions) {
    super(opts.message, opts.cause !== undefined ? {cause: opts.cause} : undefined)
    this.code = opts.code
    this.hint = opts.hint
    this.exitCode = opts.exitCode
    this.details = opts.details
  }
}
