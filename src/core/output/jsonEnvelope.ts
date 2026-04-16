export type OutputMode = 'human' | 'json'

/** Contrato estável em camelCase (Epic 1, Story 1.4). */
export type CliJsonError = {
  code: string
  message: string
  hint: string
  details?: unknown
}

export type CliJsonEnvelope = {
  ok: boolean
  command: string
  data: unknown | null
  error: CliJsonError | null
  /** ISO-8601 UTC */
  timestamp: string
}

export function utcTimestamp(): string {
  return new Date().toISOString()
}

export function serializeJsonEnvelope(env: CliJsonEnvelope): string {
  return `${JSON.stringify(env)}\n`
}
