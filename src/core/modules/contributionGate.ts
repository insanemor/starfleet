import fs from 'node:fs'
import path from 'node:path'
import {parse as parseYaml} from 'yaml'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {smokeManifestSchema} from '../validation/smokeManifest.js'
import {scanModuleCatalog} from './catalog.js'

export type ModulesContributionGateResult = {
  ok: true
  checked: number
  message: string
}

/**
 * Gate de mantenedor (Épico 7):
 * - catálogo sem entradas inválidas
 * - README.md obrigatório
 * - diretório iac/ obrigatório
 * - tests/smoke/smoke.yaml obrigatório e válido
 */
export function runModulesContributionGate(cwd: string): ModulesContributionGateResult {
  const catalog = scanModuleCatalog(cwd)
  const failures: string[] = []
  let checked = 0

  for (const e of catalog.entries) {
    if (e.kind === 'invalid') {
      failures.push(`${e.directory}: inválido no catálogo (${e.message})`)
      continue
    }
    checked++
    const readme = path.join(e.absoluteDir, 'README.md')
    if (!fs.existsSync(readme)) {
      failures.push(`${e.directory}: falta README.md (FR37/checklist)`)
    }

    const iacDir = path.join(e.absoluteDir, 'iac')
    if (!fs.existsSync(iacDir) || !fs.statSync(iacDir).isDirectory()) {
      failures.push(`${e.directory}: falta diretório iac/ (FR37/checklist)`)
    }

    const smokeManifest = path.join(e.absoluteDir, 'tests', 'smoke', 'smoke.yaml')
    if (!fs.existsSync(smokeManifest)) {
      failures.push(`${e.directory}: falta tests/smoke/smoke.yaml (FR37/checklist)`)
      continue
    }
    let parsed: unknown
    try {
      parsed = parseYaml(fs.readFileSync(smokeManifest, 'utf8'))
    } catch (cause) {
      failures.push(`${e.directory}: smoke.yaml inválido (${String(cause)})`)
      continue
    }
    const checkedSmoke = smokeManifestSchema.safeParse(parsed)
    if (!checkedSmoke.success) {
      failures.push(`${e.directory}: smoke.yaml não cumpre schema starfleet/smoke/v1`)
      continue
    }
    if (checkedSmoke.data.checks.length === 0) {
      failures.push(`${e.directory}: smoke.yaml sem checks (mínimo 1)`)
    }
  }

  if (failures.length > 0) {
    throw new StarfleetError({
      code: 'MODULE_CONTRIBUTION_GATE_FAILED',
      message: `Gate de contribuições falhou (${failures.length} problema(s)).`,
      hint: 'Consulte CONTRIBUTING.md e execute npm run check:modules localmente para reproduzir o gate (FR37/checklist).',
      exitCode: ExitCode.validation,
      details: {failures},
    })
  }

  return {
    ok: true,
    checked,
    message:
      checked > 0
        ? `Gate de contribuições: ${checked} módulo(s) verificado(s) com sucesso.`
        : 'Gate de contribuições: nenhum módulo encontrado para verificar.',
  }
}
