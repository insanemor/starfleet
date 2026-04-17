import {Command} from '@oclif/core'
import {handleCoreError} from '../core/cliAdapter.js'
import {runCatalogCheck} from '../core/commandHandlers.js'
import type {OutputMode} from '../core/output/jsonEnvelope.js'
import {writeCliOutput} from '../core/output/writeCliOutput.js'
import {starfleetCliFlags} from '../core/starfleetCliFlags.js'

export default class CatalogCheck extends Command {
  static override flags = {
    ...starfleetCliFlags,
  }
  static override description =
    'Verify catalog quality gate for modules with promoted: true (README.md and tests/smoke).'
  static override examples = ['<%= config.bin %> catalog-check']

  public async run(): Promise<void> {
    const {flags} = await this.parse(CatalogCheck)
    const output = flags.output as OutputMode
    try {
      const result = await runCatalogCheck()
      writeCliOutput({
        cmd: this,
        output,
        command: 'catalog-check',
        humanLine: result.message,
        data: {message: result.message, ...(result.catalogCheckData ?? {})},
      })
    } catch (error) {
      handleCoreError(this, error, {verbose: flags.verbose, output, command: 'catalog-check'})
    }
  }
}
