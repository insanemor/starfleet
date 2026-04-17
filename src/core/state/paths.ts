import path from 'node:path'

export const STATE_SCHEMA_VERSION = 1 as const

export function starfleetDir(cwd: string): string {
  return path.join(cwd, '.starfleet')
}

export function stateFilePath(cwd: string): string {
  return path.join(starfleetDir(cwd), 'state.json')
}
