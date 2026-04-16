import fs from 'node:fs'
import path from 'node:path'
import {parse as parseYaml} from 'yaml'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {type StarfleetConfig, starfleetConfigSchema} from './schema.js'

export function resolveStarfleetConfigPath(cwd: string): string {
  const override = process.env.STARFLEET_CONFIG
  if (override && override.length > 0) {
    return path.resolve(override)
  }
  return path.resolve(cwd, 'starfleet.yaml')
}

export function loadStarfleetConfig(cwd: string): StarfleetConfig {
  const configPath = resolveStarfleetConfigPath(cwd)

  if (!fs.existsSync(configPath)) {
    throw new StarfleetError({
      code: 'CONFIG_FILE_NOT_FOUND',
      message: `Ficheiro de configuração não encontrado: ${configPath}`,
      hint: 'Copie starfleet.yaml.example para starfleet.yaml e defina cluster.name, ou defina STARFLEET_CONFIG com o caminho absoluto do manifesto.',
      exitCode: ExitCode.usage,
    })
  }

  let raw: string
  try {
    raw = fs.readFileSync(configPath, 'utf8')
  } catch (cause) {
    throw new StarfleetError({
      code: 'CONFIG_READ_ERROR',
      message: `Não foi possível ler ${configPath}`,
      hint: 'Verifique permissões e que o caminho é um ficheiro de texto.',
      exitCode: ExitCode.usage,
      details: {cause: String(cause)},
    })
  }

  let parsed: unknown
  try {
    parsed = parseYaml(raw)
  } catch (cause) {
    throw new StarfleetError({
      code: 'CONFIG_PARSE_ERROR',
      message: 'YAML inválido em starfleet.yaml',
      hint: 'Corrija a sintaxe YAML (indentação, aspas, dois-pontos).',
      exitCode: ExitCode.usage,
      details: {cause: String(cause)},
    })
  }

  const result = starfleetConfigSchema.safeParse(parsed)
  if (!result.success) {
    throw new StarfleetError({
      code: 'CONFIG_VALIDATION_ERROR',
      message: 'starfleet.yaml não cumpre o schema mínimo (MVP)',
      hint: 'Compare com starfleet.yaml.example: apiVersion starfleet/v1 e cluster.name não vazio.',
      exitCode: ExitCode.usage,
      details: {issues: result.error.flatten()},
    })
  }

  return result.data
}
