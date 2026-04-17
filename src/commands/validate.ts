import {Command, Flags} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runValidate} from '../core/commandHandlers.js'
import {ExitCode} from '../core/errors/exitCodes.js'
import {StarfleetError} from '../core/errors/StarfleetError.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {resolveNonInteractive} from '../core/runtime/nonInteractive.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class Validate extends Command {
  static override flags = {
    ...starfleetCliFlags,
    smoke: Flags.boolean({
      description: 'Executar smoke tests (tests/smoke/smoke.yaml) nos módulos ativos.',
      default: true,
      allowNo: true,
    }),
    integration: Flags.boolean({
      description: 'Executar tests/integration/run.sh quando existir.',
      default: false,
    }),
    manual: Flags.boolean({
      description: 'Mostrar apenas checklist manual (validation-checklist.yaml), sem executar smoke.',
      default: false,
    }),
    confirm: Flags.boolean({
      description:
        'Após sucesso dos checks automáticos, regista confirmação explícita no estado (timestamp UTC).',
      default: false,
    }),
  }
  static override description =
    'Run smoke/integration validation for active modules and update validation report in .starfleet/.'
  static override examples = [
    '<%= config.bin %> validate',
    '<%= config.bin %> validate --integration',
    '<%= config.bin %> validate --manual',
    '<%= config.bin %> validate --confirm --yes',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Validate)
    const output = flags.output as OutputMode
    const nonInteractive = resolveNonInteractive(flags)
    try {
      if (nonInteractive && flags.confirm && !flags.yes) {
        throw new StarfleetError({
          code: 'INPUT_REQUIRED',
          message: 'Em modo não interativo, use --yes com --confirm para registar confirmação.',
          hint: 'Ex.: starfleet validate --confirm --yes',
          exitCode: ExitCode.usage,
        })
      }
      const result = await runValidate({
        smoke: flags.smoke,
        integration: flags.integration,
        manual: flags.manual,
        confirm: flags.confirm,
      })
      writeCliOutput({
        cmd: this,
        output,
        command: 'validate',
        humanLine: result.message,
        data: {message: result.message, ...(result.validateData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'validate'})
    }
  }
}
