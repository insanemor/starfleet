/** Logger mínimo (stderr) para não misturar com stdout da CLI / JSON. */
export function logInfo(message: string, meta?: Record<string, unknown>): void {
  const suffix = meta !== undefined ? ` ${JSON.stringify(meta)}` : ''
  process.stderr.write(`[starfleet] INFO  ${message}${suffix}\n`)
}
