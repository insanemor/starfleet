import {Command, Flags} from '@oclif/core'
import {createInterface} from 'node:readline/promises'
import {stdin as input, stdout as output} from 'node:process'
import {handleCoreError} from '../core/cliAdapter.js'
import {runRecover} from '../core/commandHandlers.js'
import {ExitCode} from '../core/errors/exitCodes.js'
import {StarfleetError} from '../core/errors/StarfleetError.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {resolveNonInteractive} from '../core/runtime/nonInteractive.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

type RecoverRoute = 'retry' | 'rollback' | 'diagnose'

export default class Recover extends Command {
  static override flags = {
    ...starfleetCliFlags,
    route: Flags.string({
      description: 'Rota de recuperação: retry, rollback ou diagnose.',
      options: ['retry', 'rollback', 'diagnose'],
    }),
    validate: Flags.boolean({
      description: 'Executa validação automática após recuperação bem-sucedida.',
      default: true,
      allowNo: true,
    }),
    confirm: Flags.boolean({
      description: 'Regista confirmação explícita no estado quando a validação automática passa.',
      default: false,
    }),
  }

  static override description = 'Executa recuperação guiada após falhas em up/add.'
  static override examples = [
    '<%= config.bin %> recover',
    '<%= config.bin %> recover --route retry',
    '<%= config.bin %> recover --route rollback --no-validate',
    '<%= config.bin %> recover --route retry --validate --confirm --yes',
  ]

  public async run(): Promise<void> {
    const {flags} = await this.parse(Recover)
    const output = flags.output as OutputMode
    const nonInteractive = resolveNonInteractive(flags)
    try {
      const route = await this.resolveRoute(flags.route as RecoverRoute | undefined, nonInteractive)
      if (nonInteractive && flags.confirm && !flags.yes) {
        throw new StarfleetError({
          code: 'INPUT_REQUIRED',
          message: 'Em modo não interativo, use --yes com --confirm.',
          hint: 'Ex.: starfleet recover --route retry --confirm --yes',
          exitCode: ExitCode.usage,
        })
      }
      const result = await runRecover({
        route,
        validateAfterRecover: flags.validate,
        confirmValidation: flags.confirm,
      })
      writeCliOutput({
        cmd: this,
        output,
        command: 'recover',
        humanLine: result.message,
        data: {
          message: result.message,
          ...(result.recoverData ?? {}),
        },
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'recover'})
    }
  }

  private async resolveRoute(
    route: RecoverRoute | undefined,
    nonInteractive: boolean,
  ): Promise<RecoverRoute> {
    if (route !== undefined) {
      return route
    }
    if (nonInteractive) {
      throw new StarfleetError({
        code: 'INPUT_REQUIRED',
        message: 'Em modo não interativo, informe a rota de recuperação.',
        hint: 'Use --route retry|rollback|diagnose.',
        exitCode: ExitCode.usage,
      })
    }

    this.log('Selecione a rota de recuperação:')
    this.log('1) retry     — reexecuta a operação falhada (rápido, baixo impacto)')
    this.log('2) rollback  — restaura estado anterior (mais conservador)')
    this.log('3) diagnose  — apenas diagnóstico (sem alterações)')
    const rl = createInterface({input, output})
    const picked = (await rl.question('Escolha [1|2|3] ')).trim()
    rl.close()
    if (picked === '1') {
      return 'retry'
    }
    if (picked === '2') {
      return 'rollback'
    }
    if (picked === '3') {
      return 'diagnose'
    }
    throw new StarfleetError({
      code: 'INPUT_REQUIRED',
      message: 'Opção de rota inválida.',
      hint: 'Escolha 1, 2 ou 3 (retry/rollback/diagnose).',
      exitCode: ExitCode.usage,
    })
  }
}
