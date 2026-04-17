import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runDown} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Down extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description = 'Stop and clean up the local Starfleet lab.'
  static override examples = [
    '<%= config.bin %> down',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Down)
    const output = flags.output as OutputMode
    try {
      const result = await runDown()
      writeCliOutput({
        cmd: this,
        output,
        command: 'down',
        humanLine: result.message,
        data: {
          message: result.message,
          ...(result.downAction !== undefined ? {action: result.downAction} : {}),
        },
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'down'})
    }
  }
}
