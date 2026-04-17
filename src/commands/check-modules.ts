import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runModulesCheck} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class CheckModules extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }

  static override description =
    'Check maintainer contribution gate (metadata + smoke manifest requirements).'

  static override examples = [
    '<%= config.bin %> check-modules',
    '<%= config.bin %> check-modules --output json',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(CheckModules)
    const output = flags.output as OutputMode
    try {
      const result = await runModulesCheck()
      writeCliOutput({
        cmd: this,
        output,
        command: 'check-modules',
        humanLine: result.message,
        data: {message: result.message, ...(result.modulesCheckData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'check-modules'})
    }
  }
}
