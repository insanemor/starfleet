import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runUp} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Up extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description = 'Initialize or reconcile the local Starfleet lab.'
  static override examples = [
    '<%= config.bin %> up',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Up)
    const output = flags.output as OutputMode
    try {
      const result = await runUp()
      writeCliOutput({
        cmd: this,
        output,
        command: 'up',
        humanLine: result.message,
        data: {message: result.message},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'up'})
    }
  }
}
