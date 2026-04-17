import {Args, Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runRemove} from '../core/commandHandlers.js'
import {ExitCode} from '../core/errors/exitCodes.js'
import {StarfleetError} from '../core/errors/StarfleetError.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {resolveNonInteractive} from '../core/runtime/nonInteractive.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Remove extends Command {
  static override args = {
    module: Args.string({description: 'module directory name under modules/'}),
  }
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description = 'Remove an active module from the lab state (hooks uninstall if defined).'
  static override examples = ['<%= config.bin %> remove demo-metrics']

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Remove)
    const output = flags.output as OutputMode
    const nonInteractive = resolveNonInteractive(flags)
    try {
      const raw = args.module?.trim()
      if (nonInteractive && (raw === undefined || raw.length === 0)) {
        throw new StarfleetError({
          code: 'INPUT_REQUIRED',
          message: 'O argumento MODULE é obrigatório em modo não interativo.',
          hint: 'Indique o módulo (ex.: starfleet remove demo-metrics).',
          exitCode: ExitCode.usage,
        })
      }
      const result = await runRemove({module: raw ?? ''})
      writeCliOutput({
        cmd: this,
        output,
        command: 'remove',
        humanLine: result.message,
        data: {message: result.message, ...(result.removeData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'remove'})
    }
  }
}
