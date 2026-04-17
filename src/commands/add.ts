import {Args, Command, Flags} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runAdd} from '../core/commandHandlers.js'
import {ExitCode} from '../core/errors/exitCodes.js'
import {StarfleetError} from '../core/errors/StarfleetError.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {resolveNonInteractive} from '../core/runtime/nonInteractive.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Add extends Command {
  static override args = {
    module: Args.string({description: 'module identifier to add'}),
  }
  static override flags = {
    ...starfleetCliFlags,
    upgrade: Flags.boolean({
      description: 'Reexecuta hooks install e atualiza pinagem para a versão actual do catálogo.',
      default: false,
    }),
  }
  static override description = 'Add a module into the active Starfleet lab.'
  static override examples = [
    '<%= config.bin %> add observability-core',
  ]

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Add)
    const output = flags.output as OutputMode
    const nonInteractive = resolveNonInteractive(flags)
    try {
      const rawModule = args.module?.trim()
      if (nonInteractive && (rawModule === undefined || rawModule.length === 0)) {
        throw new StarfleetError({
          code: 'INPUT_REQUIRED',
          message: 'O argumento MODULE é obrigatório em modo não interativo.',
          hint: 'Indique o módulo (ex.: starfleet add observability-core) ou não use --yes / STARFLEET_NON_INTERACTIVE.',
          exitCode: ExitCode.usage,
        })
      }
      const result = await runAdd({
        module: rawModule ?? '',
        upgrade: flags.upgrade,
      })
      const moduleName = rawModule ?? 'module-not-specified'
      writeCliOutput({
        cmd: this,
        output,
        command: 'add',
        humanLine: result.message,
        data: {
          message: result.message,
          module: moduleName,
          ...(result.addData ?? {}),
        },
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'add'})
    }
  }
}
