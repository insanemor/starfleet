import {Flags} from '@oclif/core'

/** Flags partilhados pelos comandos MVP (evitar ficheiros extra em `commands/`). */
export const starfleetCliFlags = {
  verbose: Flags.boolean({
    char: 'v',
    description: 'Mostra detalhes extra em falhas (causa/stack).',
    default: false,
  }),
  output: Flags.string({
    char: 'o',
    description: 'Formato de saída: human (predefinido) ou json (envelope estável no stdout).',
    options: ['human', 'json'],
    default: 'human',
  }),
  yes: Flags.boolean({
    char: 'y',
    description:
      'Modo não interativo: sem prompts; operações que exigem input explícito falham com erro claro.',
    default: false,
  }),
}
