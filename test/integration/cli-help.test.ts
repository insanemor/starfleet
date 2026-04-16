import {execa} from 'execa'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {describe, expect, it} from 'vitest'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const runCli = async (...args: string[]) => execa('./bin/dev.js', args, {
  cwd: projectRoot,
})

describe('starfleet CLI scaffold', () => {
  it('lists MVP commands on root help', async () => {
    const {stdout} = await runCli('--help')

    expect(stdout).toContain('up')
    expect(stdout).toContain('down')
    expect(stdout).toContain('status')
    expect(stdout).toContain('list')
    expect(stdout).toContain('add')
  })

  it('shows help for each MVP command', async () => {
    const commands = ['up', 'down', 'status', 'list', 'add']
    const results = await Promise.all(commands.map((command) => runCli(command, '--help')))
    for (let i = 0; i < commands.length; i++) {
      expect(results[i].stdout.toLowerCase()).toContain(commands[i])
    }
  })
})
