# Story 1.2: Carregar e validar `starfleet.yaml` na fronteira da CLI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilizador do Starfleet,
I want que a CLI valide o ficheiro de configuração ao arranque de comandos que precisam dele,
So that falhas de configuração são imediatas com remediação clara.

## Acceptance Criteria

1. Dado um `starfleet.yaml` inválido (schema/campos obrigatórios), quando executo um comando que requer config (ex.: `up`), o processo termina com exit code `2` e erro estruturado com `code`, `message`, `hint` e `details` opcionais.
2. Existe `starfleet.yaml.example` na raiz documentando campos mínimos MVP.
3. Comandos que não precisam de manifesto (ex.: `list`) continuam operacionais sem `starfleet.yaml`.

## Tasks / Subtasks

- [x] Definir schema mínimo MVP (`apiVersion: starfleet/v1`, `cluster.name`) e validação na fronteira do core (AC: 1)
- [x] Resolver caminho via `starfleet.yaml` no CWD ou `STARFLEET_CONFIG` (caminho absoluto) para testes e automação (AC: 1)
- [x] Propagar falhas como `ConfigBoundaryError` e formatar saída humana com `code` / `message` / `hint` / `details` (AC: 1)
- [x] Garantir exit code `2` nos comandos que carregam config: `up`, `down`, `status`, `add` (AC: 1)
- [x] Adicionar `starfleet.yaml.example` na raiz (AC: 2)
- [x] Testes de integração: ficheiro em falta, YAML inválido, schema inválido, manifesto válido, `list` sem config, override `STARFLEET_CONFIG` (AC: 1–3)
- [x] Evitar ficheiros utilitários em `src/commands/` (oclif regista cada ficheiro como comando) — helper em `src/core/cliAdapter.ts`

## Dev Notes

### Contexto funcional e de negocio

- Alinha-se à arquitetura: validação na carga na fronteira da CLI; modelo file-first (`starfleet.yaml`).
- Story 1.3 irá generalizar taxonomia (`StarfleetError`); aqui mantém-se `ConfigBoundaryError` + exit `2` para config.

### Guardrails tecnicos obrigatorios

- Dependências: `yaml` (parse), `zod` (schema).
- Não colocar helpers partilhados em `src/commands/` exceto classes `Command` exportadas.

### File structure requirements

- `src/core/config/schema.ts`, `loadStarfleetConfig.ts`, `index.ts`
- `src/core/errors/configBoundary.ts`
- `src/core/output/configErrorFormat.ts`
- `src/core/cliAdapter.ts`
- `starfleet.yaml.example` (raiz do repositório)

### Testing requirements

- Integração em `test/integration/config-cli.test.ts` com `execa`, `cwd` no root do projeto e `STARFLEET_CONFIG` apontando para ficheiros temporários.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data validation at CLI load boundaries]

## Dev Agent Record

### Agent Model Used

Composer (dev-story)

### Debug Log References

### Completion Notes List

- Validação síncrona na fronteira; comandos MVP com config envolvem `try/catch` + `handleCoreError`.
- Teste `cli-help` paralelizado para evitar timeout com cold start do oclif/ts-node.

### File List

- `starfleet.yaml.example`
- `src/core/config/schema.ts`
- `src/core/config/loadStarfleetConfig.ts`
- `src/core/config/index.ts`
- `src/core/errors/configBoundary.ts`
- `src/core/errors/index.ts`
- `src/core/output/configErrorFormat.ts`
- `src/core/output/index.ts`
- `src/core/cliAdapter.ts`
- `src/core/commandHandlers.ts`
- `src/commands/up.ts`, `down.ts`, `status.ts`, `add.ts`
- `test/integration/config-cli.test.ts`
- `test/integration/cli-help.test.ts`
- `package.json` (deps `zod`, `yaml`)
