import {Command} from '@oclif/core'
import {handleCoreError} from '../../core/cliAdapter.js'
import {runEvidenceCapture} from '../../core/commandHandlers.js'
import type {OutputMode} from '../../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../../core/starfleetCliFlags.js'

export default class EvidenceCapture extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }

  static override description = 'Capture evidence manifest JSON under .starfleet/evidence/.'
  static override examples = [
    '<%= config.bin %> evidence capture',
    '<%= config.bin %> evidence capture --output json',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(EvidenceCapture)
    const output = flags.output as OutputMode
    try {
      const result = await runEvidenceCapture({cliVersion: this.config.version})
      writeCliOutput({
        cmd: this,
        output,
        command: 'evidence capture',
        humanLine: result.message,
        data: {message: result.message, ...(result.evidenceData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'evidence capture'})
    }
  }
}
