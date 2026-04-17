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
    return parsed
  } catch {
    return null
  }
}

export function writeState(cwd: string, state: StarfleetStateFileV1): void {
  fs.mkdirSync(starfleetDir(cwd), {recursive: true})
  fs.writeFileSync(stateFilePath(cwd), `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}
