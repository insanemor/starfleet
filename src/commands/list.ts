import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runList} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class List extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description = 'List available Starfleet modules and labs.'
  static override examples = [
    '<%= config.bin %> list',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(List)
    const output = flags.output as OutputMode
    try {
      const result = await runList()
      writeCliOutput({
        cmd: this,
        output,
        command: 'list',
        humanLine: result.message,
        data: {
          message: result.message,
          ...(result.listData ?? {}),
        },
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'list'})
    }
  }
}
