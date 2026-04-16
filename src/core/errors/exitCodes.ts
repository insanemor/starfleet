/**
 * Matriz de exit codes (architecture, decisão 5A).
 * Reservar faixas ao introduzir novos domínios.
 */
export const ExitCode = {
  success: 0,
  /** Falha genérica / não classificada */
  generic: 1,
  /** Uso inválido, flags/argumentos e manifesto/config inválido na fronteira */
  usage: 2,
  /** Domínio cluster / ferramentas externas (ex.: k3d) */
  cluster: 10,
  /** Domínio módulos */
  module: 20,
  /** Validação de artefactos / pipelines */
  validation: 30,
} as const
