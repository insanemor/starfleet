import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {afterEach, describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

const runCli = (env: NodeJS.ProcessEnv, ...args: string[]) =>
  execa(devBin, args, {
    cwd: projectRoot,
    reject: false,
    env: {...process.env, ...env},
  })

describe('starfleet.yaml na fronteira da CLI', () => {
  const dirs: string[] = []
  const mkLabFile = (name: string) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'starfleet-lab-'))
    dirs.push(dir)
    return path.join(dir, name)
  }

  afterEach(() => {
    for (const d of dirs) {
      fs.rmSync(d, {recursive: true, force: true})
    }
    dirs.length = 0
  })

  it('termina com exit 2 quando starfleet.yaml está em falta (up)', async () => {
    const missing = mkLabFile('missing.yaml')
    const result = await runCli({STARFLEET_CONFIG: missing}, 'up')
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('code: CONFIG_FILE_NOT_FOUND')
    expect(result.stderr).toContain('message:')
    expect(result.stderr).toContain('hint:')
  })

  it('termina com exit 2 quando o YAML é inválido', async () => {
    const configPath = mkLabFile('starfleet.yaml')
    fs.writeFileSync(configPath, 'cluster: [broken', 'utf8')
    const result = await runCli({STARFLEET_CONFIG: configPath}, 'up')
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('code: CONFIG_PARSE_ERROR')
  })

  it('termina com exit 2 quando o schema é inválido', async () => {
    const configPath = mkLabFile('starfleet.yaml')
    fs.writeFileSync(
      configPath,
      'apiVersion: wrong\ncluster: {}\n',
      'utf8',
    )
    const result = await runCli({STARFLEET_CONFIG: configPath}, 'up')
    expect(result.exitCode).toBe(2)
    expect(result.stderr).toContain('code: CONFIG_VALIDATION_ERROR')
    expect(result.stderr).toContain('details:')
  })

  it('aceita manifesto mínimo válido', async () => {
    const configPath = mkLabFile('starfleet.yaml')
    fs.writeFileSync(
      configPath,
      `apiVersion: starfleet/v1
cluster:
  name: test-lab
`,
      'utf8',
    )
    const result = await runCli({STARFLEET_CONFIG: configPath}, 'up')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Command scaffold ready: up')
  })

  it('list não exige starfleet.yaml', async () => {
    const env = {...process.env}
    delete env.STARFLEET_CONFIG
    const result = await execa(devBin, ['list'], {
      cwd: projectRoot,
      reject: false,
      env,
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Command scaffold ready: list')
  })

  it('respeita STARFLEET_CONFIG com caminho absoluto', async () => {
    const configPath = mkLabFile('custom.yaml')
    fs.writeFileSync(
      configPath,
      `apiVersion: starfleet/v1
cluster:
  name: from-env
`,
      'utf8',
    )
    const result = await runCli({STARFLEET_CONFIG: configPath}, 'status')
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toContain('Command scaffold ready: status')
  })
})
