import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runStatus} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Status extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description = 'Show local Starfleet infrastructure status.'
  static override examples = [
    '<%= config.bin %> status',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Status)
    const output = flags.output as OutputMode
    try {
      const result = await runStatus()
      writeCliOutput({
        cmd: this,
        output,
        command: 'status',
        humanLine: result.message,
        data: {
          message: result.message,
          ...(result.statusData ?? {}),
        },
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'status'})
    }
  }
}
