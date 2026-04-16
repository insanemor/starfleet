# Story 1.3: Modelo de erro `StarfleetError`, exit codes e renderização humana

Status: done

## Story

As a utilizador em modo interativo,
I want erros com taxonomia estável e exit codes determinísticos,
So that integro scripts e entendo a causa e o próximo passo (UX-DR2).

## Acceptance Criteria

1. Falhas propagadas do core para o comando mostram em modo humano `message` curta, `hint` acionável e `code` estável; exit code segue a matriz (0 / 1 / 2 / 10+ por domínio).
2. Erros internos não vazam stack traces verbosos por omissão; `--verbose` (`-v`) mostra stack/causa quando aplicável.

## Tasks / Subtasks

- [x] Introduzir `ExitCode` e `StarfleetError` (`src/core/errors/exitCodes.ts`, `StarfleetError.ts`)
- [x] Substituir `ConfigBoundaryError` por `StarfleetError` com `exitCode` explícito na carga de config (mantém exit `2` para manifesto inválido)
- [x] Centralizar formatação humana em `formatError.ts` (`formatHumanCliError`, `formatGenericFailure`, `formatUnknownFailure`)
- [x] Atualizar `handleCoreError` para `StarfleetError` (exit do erro), `Error` genérico (exit `1`), unknown (exit `1`)
- [x] Flag `--verbose` partilhada (`starfleetCliFlags`) em todos os comandos MVP
- [x] Simulação de falhas para testes: `STARFLEET_SIMULATE_EXTERNAL_FAILURE` (domínio cluster, exit `10`), `STARFLEET_SIMULATE_INTERNAL_FAILURE` (Error genérico, exit `1`)
- [x] Testes unitários (`formatError.test.ts`) e integração (`starfleet-error-human.test.ts`)

## Dev Notes

### Matriz de exit codes

- `0` sucesso · `1` genérico · `2` uso/manifesto na fronteira · `10` cluster · `20` módulo · `30` validação (architecture 5A).

### Referências

- [Source: _bmad-output/planning-artifacts/architecture.md — Error Handling Patterns, decisão 5A]

## Dev Agent Record

### Completion Notes List

- Variáveis de ambiente de simulação são apenas para testes de integração; não documentadas como API pública até haver necessidade de QA externo.

### File List

- `src/core/errors/exitCodes.ts`, `StarfleetError.ts`, `formatError.ts`, `formatError.test.ts`, `index.ts`
- `src/core/cliAdapter.ts`, `src/core/starfleetCliFlags.ts`, `src/core/commandHandlers.ts`
- `src/core/config/loadStarfleetConfig.ts`
- `src/core/output/index.ts`
- `src/commands/up.ts`, `down.ts`, `status.ts`, `list.ts`, `add.ts`
- `test/integration/starfleet-error-human.test.ts`
- Removidos: `configBoundary.ts`, `configErrorFormat.ts`
