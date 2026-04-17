import fs from 'node:fs'
import {starfleetDir, STATE_SCHEMA_VERSION, stateFilePath} from './paths.js'
import type {StarfleetStateFileV1} from './stateTypes.js'

export function readState(cwd: string): StarfleetStateFileV1 | null {
  const p = stateFilePath(cwd)
  if (!fs.existsSync(p)) {
    return null
  }
  try {
    const raw = fs.readFileSync(p, 'utf8')
    const parsed = JSON.parse(raw) as StarfleetStateFileV1
    if (parsed?.schemaVersion !== STATE_SCHEMA_VERSION || !parsed.cluster) {
      return null
    }
    if (parsed.modules?.active !== undefined && !Array.isArray(parsed.modules.active)) {
      delete (parsed as {modules?: unknown}).modules
    } else if (parsed.modules?.pinned !== undefined) {
      const p = parsed.modules.pinned
      if (typeof p !== 'object' || p === null || Array.isArray(p)) {
        delete parsed.modules.pinned
      }
    }
    if (parsed.validation !== undefined) {
      const v = parsed.validation
      if (typeof v !== 'object' || v === null || Array.isArray(v)) {
        delete (parsed as {validation?: unknown}).validation
      }
    }
    return parsed
  } catch {
    return null
  }
}

export function writeState(cwd: string, state: StarfleetStateFileV1): void {
  const previous = readState(cwd)
  const next: StarfleetStateFileV1 =
    state.recovery === undefined && previous?.recovery !== undefined
      ? {...state, recovery: previous.recovery}
      : state
  fs.mkdirSync(starfleetDir(cwd), {recursive: true})
  fs.writeFileSync(stateFilePath(cwd), `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}
