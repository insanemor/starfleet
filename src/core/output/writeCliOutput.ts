import type {Command} from '@oclif/core'
import type {CliJsonEnvelope, OutputMode} from './jsonEnvelope.js'
import {serializeJsonEnvelope, utcTimestamp} from './jsonEnvelope.js'

export function writeCliOutput(options: {
  cmd: Command
  output: OutputMode
  command: string
  humanLine: string
  data: unknown
}): void {
  if (options.output === 'json') {
    const env: CliJsonEnvelope = {
      ok: true,
      command: options.command,
      data: options.data,
      error: null,
      timestamp: utcTimestamp(),
    }
    process.stdout.write(serializeJsonEnvelope(env))
    return
  }
  options.cmd.log(options.humanLine)
}
