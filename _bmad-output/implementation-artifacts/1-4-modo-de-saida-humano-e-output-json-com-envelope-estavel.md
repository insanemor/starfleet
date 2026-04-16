# Story 1.4: Modo de saída humano e `--output json` com envelope estável

Status: done

## Story

As a operador e como integrador de automação,
I want alternar entre saída legível e JSON com contrato `{ ok, command, data, error }` em camelCase,
So that consigo usar o Starfleet em pipelines sem quebrar parsers (FR26, FR27, NFR10–NFR13).

## Acceptance Criteria

1. Com `--output json` e sucesso, o stdout contém JSON válido com `ok: true`, `command` preenchido, `data` por comando e `error: null`.
2. Com `--output json` e falha, `ok: false` e `error` com `{ code, message, hint, details? }` em camelCase; `timestamp` em ISO-8601 UTC.
3. Campos estáveis documentados no README; política patch/minor sem breaking nos nomes de topo.

## Tasks / Subtasks

- [x] Flag `--output` / `-o` com valores `human` (predefinido) e `json` em `starfleetCliFlags`
- [x] Tipos `CliJsonEnvelope`, `CliJsonError`, `OutputMode` e serialização uma linha + newline
- [x] `writeCliOutput` para sucesso (human vs json)
- [x] `handleCoreError` com ramo JSON (stdout apenas, sem mensagens humanas em falha)
- [x] Mapeamento de erros para JSON (`jsonFromError.ts`)
- [x] Comandos MVP atualizados com `data` por comando (`add` inclui `module`)
- [x] Testes de integração `test/integration/json-output.test.ts`
- [x] README: tabela de campos estáveis

## Dev Notes

- Avisos do Node (ex.: DEP0180) podem aparecer no stderr sem afetar o JSON no stdout.

## Dev Agent Record

### File List

- `src/core/output/jsonEnvelope.ts`, `writeCliOutput.ts`, `jsonFromError.ts`, `index.ts`
- `src/core/cliAdapter.ts`, `src/core/starfleetCliFlags.ts`
- `src/commands/*.ts`
- `test/integration/json-output.test.ts`
- `README.md`
