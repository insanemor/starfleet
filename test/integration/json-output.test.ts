import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

describe('--output json', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('sucesso: envelope ok, command, data, error null, timestamp ISO', async () => {
    const result = await execa(devBin, ['list', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
    })
    expect(result.exitCode).toBe(0)
    const line = result.stdout.trim().split('\n').pop()!
    const parsed = JSON.parse(line) as Record<string, unknown>
    expect(parsed.ok).toBe(true)
    expect(parsed.command).toBe('list')
    expect(parsed.error).toBeNull()
    expect(parsed.data).toEqual({message: expect.any(String)})
    expect(typeof parsed.timestamp).toBe('string')
    expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('falha: ok false e error com code, message, hint', async () => {
    const missing = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sf-json-')), 'missing.yaml')
    dirs.push(path.dirname(missing))
    const result = await execa(devBin, ['up', '--output', 'json'], {
      cwd: projectRoot,
      reject: false,
      env: {...process.env, STARFLEET_CONFIG: missing},
    })
    expect(result.exitCode).toBe(2)
    const parsed = JSON.parse(result.stdout.trim()) as Record<string, unknown>
    expect(parsed.ok).toBe(false)
    expect(parsed.command).toBe('up')
    expect(parsed.data).toBeNull()
    const err = parsed.error as Record<string, unknown>
    expect(err.code).toBe('CONFIG_FILE_NOT_FOUND')
    expect(typeof err.message).toBe('string')
    expect(typeof err.hint).toBe('string')
    expect(typeof parsed.timestamp).toBe('string')
  })
})
