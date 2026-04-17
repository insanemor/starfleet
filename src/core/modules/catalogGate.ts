import fs from 'node:fs'
import path from 'node:path'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {validModulesOnly} from './catalog.js'

export type CatalogGateResult = {
  ok: true
  promotedChecked: number
  message: string
}

/**
 * Story 3.5: módulos com `promoted: true` devem ter README.md e tests/smoke (ficheiro ou pasta).
 */
export function runCatalogQualityGate(cwd: string): CatalogGateResult {
  const valid = validModulesOnly(cwd)
  const failures: string[] = []
  let promotedChecked = 0

  for (const m of valid) {
    if (!m.promoted) {
      continue
    }
    promotedChecked++
    const readme = path.join(m.absoluteDir, 'README.md')
    if (!fs.existsSync(readme)) {
      failures.push(`${m.directory}: promoted exige README.md em ${m.relativePath}/`)
    }
    const smoke = path.join(m.absoluteDir, 'tests', 'smoke')
    if (!fs.existsSync(smoke)) {
      failures.push(`${m.directory}: promoted exige tests/smoke (ficheiro ou pasta) em ${m.relativePath}/`)
    }
  }

  if (failures.length > 0) {
    throw new StarfleetError({
      code: 'CATALOG_QUALITY_GATE_FAILED',
      message: `Gate de catálogo falhou (${failures.length} problema(s)).`,
      hint: 'Para módulos com promoted: true, adicione README.md e tests/smoke, ou remova promoted.',
      exitCode: ExitCode.validation,
      details: {failures},
    })
  }

  return {
    ok: true,
    promotedChecked,
    message:
      promotedChecked > 0
        ? `Gate de catálogo: ${promotedChecked} módulo(s) promovido(s) verificado(s) com sucesso.`
        : 'Gate de catálogo: nenhum módulo com promoted: true (nada a verificar).',
  }
}
