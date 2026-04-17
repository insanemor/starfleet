import {Args, Command} from '@oclif/core'
import {handleCoreError} from '../../core/cliAdapter.js'
import {runModuleScaffold} from '../../core/commandHandlers.js'
import {ExitCode} from '../../core/errors/exitCodes.js'
import {StarfleetError} from '../../core/errors/StarfleetError.js'
import type {OutputMode} from '../../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../../core/output/writeCliOutput.js'
import {resolveNonInteractive} from '../../core/runtime/nonInteractive.js'
import {starfleetCliFlags} from '../../core/starfleetCliFlags.js'

export default class ModuleScaffold extends Command {
  static override args = {
    module: Args.string({description: 'module identifier to scaffold'}),
  }

  static override flags = {
    ...starfleetCliFlags,
  }

  static override description = 'Scaffold a new module folder with module.yaml, iac/, tests/, and README.'
  static override examples = [
    '<%= config.bin %> module scaffold observability-core',
    '<%= config.bin %> module scaffold my-module --output json',
  ]

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ModuleScaffold)
    const output = flags.output as OutputMode
    const nonInteractive = resolveNonInteractive(flags)
    try {
      const moduleName = args.module?.trim()
      if (moduleName === undefined || moduleName.length === 0) {
        throw new StarfleetError({
          code: 'INPUT_REQUIRED',
          message: 'O argumento MODULE é obrigatório para scaffold.',
          hint: nonInteractive
            ? 'Ex.: starfleet module scaffold observability-core'
            : 'Informe o nome do módulo (ex.: observability-core).',
          exitCode: ExitCode.usage,
        })
      }
      const result = await runModuleScaffold({module: moduleName})
      writeCliOutput({
        cmd: this,
        output,
        command: 'module scaffold',
        humanLine: result.message,
        data: {message: result.message, ...(result.moduleScaffoldData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'module scaffold'})
    }
  }
}
