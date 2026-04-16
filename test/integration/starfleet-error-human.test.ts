import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

const mkConfig = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-err-'))
  const configPath = path.join(dir, 'starfleet.yaml')
  fs.writeFileSync(
    configPath,
    `apiVersion: starfleet/v1
cluster:
  name: t
`,
    'utf8',
  )
  return {dir, configPath}
}

describe('StarfleetError e modo humano', () => {
  const dirs: string[] = []
  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('falha de domínio cluster usa exit 10 e mensagem estável', async () => {
    const {configPath, dir} = mkConfig()
    dirs.push(dir)
    const result = await execa(devBin, ['up'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_SIMULATE_EXTERNAL_FAILURE: '1',
      },
    })
    expect(result.exitCode).toBe(10)
    expect(result.stderr).toContain('code: CLUSTER_TOOL_MISSING')
    expect(result.stderr).toContain('hint:')
    expect(result.stderr).not.toContain('stack:')
  })

  it('falha interna genérica usa exit 1 e não mostra stack sem --verbose', async () => {
    const {configPath, dir} = mkConfig()
    dirs.push(dir)
    const result = await execa(devBin, ['up'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_SIMULATE_INTERNAL_FAILURE: '1',
      },
    })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('INTERNAL_ERROR')
    expect(result.stderr).toContain('message: Falha interna simulada para testes')
    expect(result.stderr).not.toContain('stack:')
  })

  it('--verbose mostra stack em falha interna', async () => {
    const {configPath, dir} = mkConfig()
    dirs.push(dir)
    const result = await execa(devBin, ['up', '--verbose'], {
      cwd: projectRoot,
      reject: false,
      env: {
        ...process.env,
        STARFLEET_CONFIG: configPath,
        STARFLEET_SIMULATE_INTERNAL_FAILURE: '1',
      },
    })
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toContain('stack:')
  })
})
