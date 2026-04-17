# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-04-17

### Added

- CLI base com comandos principais de ciclo de vida: `up`, `down`, `status`, `list`.
- Comandos de gestão de módulos: `add`, `remove`, `catalog-check`.
- Comandos de validação e recuperação: `validate`, `recover`.
- Comandos de evidência: `evidence capture`, `evidence report`.
- Fluxo de mantenedor: `module scaffold` e `check-modules`.
- Saída JSON estável (`--output json`) com envelope consistente para automação.
- Modelo de erros com códigos de domínio e hints de ação.
- Taxonomia de falhas externas (`EXTERNAL_*`) para operações de cluster/hooks.
- Geração de evidências em `.starfleet/evidence/`:
  - manifesto JSON (`starfleet/evidence/v1`);
  - relatório Markdown derivado do manifesto.
- Rastreabilidade no manifesto de evidência com campos opcionais:
  - `cliVersion`;
  - `sourceRevision` (quando `GIT_COMMIT` está definido).
- Gate de contribuição para módulos com validações automáticas:
  - `README.md`,
  - `iac/`,
  - `tests/smoke/smoke.yaml` válido e com checks.
- `CONTRIBUTING.md` com requisitos mínimos e reprodução local do gate.
- Suporte a completions zsh via plugin de autocomplete.

### Changed

- Evolução incremental de arquitetura para separar comandos (`src/commands`) e núcleo (`src/core`).
- `up` com comportamento idempotente e reconciliação com estado local.
- `status` passou a refletir estado consolidado (manifesto, runtime k3d, estado local).
- `README.md` expandido para cobrir novos comandos, modos e fluxos operacionais.
- `package.json` com scripts operacionais para mantenedores:
  - `catalog:check`,
  - `check:modules`,
  - `module:scaffold`.

### Fixed

- Tratamento consistente de falhas de subprocessos externos (`k3d`, `kubectl`, hooks).
- Melhor sinalização de estados não saudáveis após recuperação com validação falha.
- Correção de casos de deriva entre estado local e runtime de cluster.
- Melhoria de robustez na validação de manifestos YAML (configuração, smoke, módulo).

### Docs

- Documentação de recuperação guiada com rotas `retry`, `rollback`, `diagnose`.
- Documentação de fluxo de evidências e campos de rastreabilidade.
- Documentação de padrões mínimos para criação e contribuição de módulos.
- Atualizações em artefatos de sprint para refletir conclusão dos Epics 1–7.
