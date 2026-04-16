# Story 1.5: Modo não interativo e comportamento determinístico

Status: done

## Story

As a utilizador de CI ou scripts,
I want executar comandos sem prompts bloqueantes,
So that automação é fiável (FR25).

## Acceptance Criteria

1. Variável de ambiente ou flag documentada para modo não interativo (`STARFLEET_NON_INTERACTIVE` e/ou `--yes`).
2. Comandos que exigiriam confirmação/input não ficam bloqueados; falhas por falta de input com exit code adequado.
3. Comportamento documentado no README.

## Tasks / Subtasks

- [x] `resolveNonInteractive` + `isNonInteractiveFromEnv` (`src/core/runtime/nonInteractive.ts`)
- [x] Flag global `--yes` / `-y` em `starfleetCliFlags`
- [x] `add`: em modo não interativo, MODULE obrigatório — senão `StarfleetError` `INPUT_REQUIRED`, exit `2`
- [x] Testes unitários e integração
- [x] README

## Dev Agent Record

### File List

- `src/core/runtime/nonInteractive.ts`, `nonInteractive.test.ts`
- `src/core/starfleetCliFlags.ts`
- `src/commands/add.ts`
- `test/integration/non-interactive.test.ts`
- `README.md`
