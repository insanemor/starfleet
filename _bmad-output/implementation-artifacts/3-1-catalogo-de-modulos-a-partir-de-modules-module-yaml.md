# Story 3.1: Catálogo de módulos a partir de `modules/*/module.yaml`

Status: done

## Story

As a utilizador,
I want `starfleet list` a mostrar módulos disponíveis com metadados,
So that sei o que posso instalar (FR6).

## Acceptance Criteria

1. Pastas sob `modules/` com `module.yaml` válido → nome, descrição curta, versão pinada sugerida.
2. `module.yaml` inválido ou em falta → entrada na lista como inválida com mensagem e dica (política: não omitir silenciosamente).

## Tasks / Subtasks

- [x] Schema Zod `starfleet/module/v1` (`moduleYaml.ts`)
- [x] `scanModuleCatalog` + `formatModuleCatalogHuman` (`catalog.ts`)
- [x] `runList` + `listData` no JSON; exemplo `modules/demo-metrics/module.yaml`
- [x] Testes `catalog.test.ts`; integração e JSON atualizados

## Dev Agent Record

### File List

- `src/core/modules/moduleYaml.ts`, `catalog.ts`, `catalog.test.ts`, `index.ts`
- `src/core/commandHandlers.ts`, `src/commands/list.ts`
- `modules/demo-metrics/module.yaml`
- `README.md`, `test/integration/config-cli.test.ts`, `test/integration/json-output.test.ts`

### Política documentada

- Entradas inválidas aparecem com `[inválido]`, `message` e `hint`; em JSON, `kind: "invalid"` e caminhos relativos.
