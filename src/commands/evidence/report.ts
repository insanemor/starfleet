import {Args, Command} from '@oclif/core'
import {handleCoreError} from '../../core/cliAdapter.js'
import {runEvidenceReport} from '../../core/commandHandlers.js'
import type {OutputMode} from '../../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../../core/starfleetCliFlags.js'

export default class EvidenceReport extends Command {
  static override args = {
    manifest: Args.string({
      description:
        'Caminho para manifesto JSON de evidência. Se omitido, usa o manifesto mais recente de .starfleet/evidence/.',
      required: false,
    }),
  }

  static override flags = {
    ...starfleetCliFlags,
  }

  static override description = 'Generate Markdown evidence report from an evidence manifest.'
  static override examples = [
    '<%= config.bin %> evidence report',
    '<%= config.bin %> evidence report .starfleet/evidence/manifest-2026-04-17T14-00-00_000Z.json',
    '<%= config.bin %> evidence report --output json',
  ]

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(EvidenceReport)
    const output = flags.output as OutputMode
    try {
      const result = await runEvidenceReport({manifestPath: args.manifest})
      writeCliOutput({
        cmd: this,
        output,
        command: 'evidence report',
        humanLine: result.message,
        data: {message: result.message, ...(result.evidenceData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'evidence report'})
    }
  }
}
