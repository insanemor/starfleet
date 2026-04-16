// Stubs por domínio — lógica nas stories seguintes; mantém fronteira clara commands → core.
import './cluster/index.js'
import './modules/index.js'
import './logging/index.js'
import {loadStarfleetConfig} from './config/index.js'
import {ExitCode} from './errors/exitCodes.js'
import {StarfleetError} from './errors/StarfleetError.js'

export type CommandResult = {
  message: string
}

function requireConfig(cwd: string): void {
  loadStarfleetConfig(cwd)
}

export async function runUp(): Promise<CommandResult> {
  requireConfig(process.cwd())

  if (process.env.STARFLEET_SIMULATE_EXTERNAL_FAILURE === '1') {
    throw new StarfleetError({
      code: 'CLUSTER_TOOL_MISSING',
      message: 'Ferramenta externa necessária não encontrada (simulado).',
      hint: 'Instale o binário do cluster (ex.: k3d) ou ajuste o PATH.',
      exitCode: ExitCode.cluster,
    })
  }
  if (process.env.STARFLEET_SIMULATE_INTERNAL_FAILURE === '1') {
    throw new Error('Falha interna simulada para testes')
  }

  return {message: 'Command scaffold ready: up'}
}

export async function runDown(): Promise<CommandResult> {
  requireConfig(process.cwd())
  return {message: 'Command scaffold ready: down'}
}

export async function runStatus(): Promise<CommandResult> {
  requireConfig(process.cwd())
  return {message: 'Command scaffold ready: status'}
}

export async function runList(): Promise<CommandResult> {
  return {message: 'Command scaffold ready: list'}
}

export async function runAdd(): Promise<CommandResult> {
  requireConfig(process.cwd())
  return {message: 'Command scaffold ready: add'}
}
