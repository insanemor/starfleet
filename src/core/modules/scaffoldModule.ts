import fs from 'node:fs'
import path from 'node:path'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'

export type ModuleScaffoldResult = {
  message: string
  moduleId: string
  modulePath: string
  created: string[]
}

const MODULE_ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export function scaffoldModule(cwd: string, moduleIdRaw: string): ModuleScaffoldResult {
  const moduleId = moduleIdRaw.trim()
  if (!MODULE_ID_PATTERN.test(moduleId)) {
    throw new StarfleetError({
      code: 'MODULE_SCAFFOLD_INVALID_NAME',
      message: `Identificador de módulo inválido: "${moduleIdRaw}"`,
      hint: 'Use apenas minúsculas, números e hífen (ex.: observability-core).',
      exitCode: ExitCode.usage,
    })
  }

  const moduleRoot = path.join(cwd, 'modules', moduleId)
  if (fs.existsSync(moduleRoot)) {
    throw new StarfleetError({
      code: 'MODULE_SCAFFOLD_EXISTS',
      message: `O módulo ${moduleId} já existe em modules/${moduleId}.`,
      hint: 'Escolha outro nome ou remova a pasta existente antes de scaffold.',
      exitCode: ExitCode.usage,
    })
  }

  const files = buildTemplate(moduleId)
  for (const [relPath, content] of files) {
    const absPath = path.join(moduleRoot, relPath)
    fs.mkdirSync(path.dirname(absPath), {recursive: true})
    fs.writeFileSync(absPath, content, 'utf8')
  }

  return {
    message: `Scaffold criado para módulo ${moduleId} em modules/${moduleId}.`,
    moduleId,
    modulePath: toPosix(path.relative(cwd, moduleRoot)),
    created: files.map(([p]) => toPosix(path.join('modules', moduleId, p))),
  }
}

function buildTemplate(moduleId: string): Array<[string, string]> {
  return [
    [
      'module.yaml',
      `apiVersion: starfleet/module/v1
name: ${moduleId}
description: TODO: descreva o objetivo do módulo ${moduleId}.
version: 0.1.0
dependencies: []
hooks:
  install:
    - ":"
`,
    ],
    [
      'README.md',
      `# ${moduleId}

Descrição curta do módulo e objetivo funcional.

## Estrutura

- \`iac/\` infra/artefatos do módulo
- \`tests/smoke/smoke.yaml\` checks rápidos

## Definition of Done

- [ ] \`module.yaml\` válido (apiVersion/description/version)
- [ ] \`tests/smoke/smoke.yaml\` presente e válido
- [ ] documentação atualizada (este README)
- [ ] \`npm run check:modules\` passa localmente
`,
    ],
    [
      'iac/README.md',
      `# IAC - ${moduleId}

Coloque aqui os artefatos de infraestrutura do módulo.
`,
    ],
    [
      'tests/smoke/smoke.yaml',
      `apiVersion: starfleet/smoke/v1
checks:
  - name: noop
    run: "true"
`,
    ],
  ]
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}
