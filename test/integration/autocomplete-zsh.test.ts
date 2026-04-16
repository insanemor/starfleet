import path from 'node:path'
import {execa} from 'execa'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const devBin = path.join(projectRoot, 'bin/dev.js')

describe('autocomplete zsh (plugin oclif)', () => {
  it('comando autocomplete aparece no help global', async () => {
    const {stdout} = await execa(devBin, ['--help'], {cwd: projectRoot})
    expect(stdout).toContain('autocomplete')
  })

  it('autocomplete script zsh termina com sucesso e referencia o setup', async () => {
    const result = await execa(devBin, ['autocomplete', 'script', 'zsh'], {
      cwd: projectRoot,
      reject: false,
    })
    expect(result.exitCode).toBe(0)
    expect(result.stdout).toMatch(/starfleet|STARFLEET/i)
  })

  it('autocomplete:zsh refresh-cache não falha (cache)', async () => {
    const result = await execa(devBin, ['autocomplete', '--refresh-cache'], {
      cwd: projectRoot,
      reject: false,
    })
    expect(result.exitCode).toBe(0)
  })
})
