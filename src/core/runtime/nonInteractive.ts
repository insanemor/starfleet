/**
 * Modo não interativo: CI/scripts sem prompts bloqueantes (Story 1.5).
 * `STARFLEET_NON_INTERACTIVE`: valores truthy — `1`, `true`, `yes` (case-insensitive).
 */
export function isNonInteractiveFromEnv(): boolean {
  const v = process.env.STARFLEET_NON_INTERACTIVE?.trim().toLowerCase()
  if (v === undefined || v === '') {
    return false
  }
  return v === '1' || v === 'true' || v === 'yes'
}

export function resolveNonInteractive(flags: {yes?: boolean}): boolean {
  if (flags.yes === true) {
    return true
  }
  return isNonInteractiveFromEnv()
}
