# Story 1.1: Scaffolding oclif e esqueleto dos comandos MVP

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a engenheiro DevOps/SRE,
I want um projeto oclif TypeScript com os comandos `up`, `down`, `status`, `list` e `add` como adaptadores finos,
so that tenho uma base alinhada a arquitetura (`commands -> core`) para evoluir sem reestruturar tudo.

## Acceptance Criteria

1. Repositorio sem codigo previo da CLI Starfleet suporta inicializacao via `oclif generate` (ou equivalente documentado) com dependencias instaladas.
2. `./bin/dev.js --help` lista os cinco comandos MVP: `up`, `down`, `status`, `list`, `add`.
3. Cada comando em `src/commands/` atua como adaptador fino e delega comportamento para `src/core/` (sem logica de dominio pesada no command handler).
4. Mensagens de ajuda sao concisas e informativas (UX-DR1), com foco em onboarding rapido.

## Tasks / Subtasks

- [x] Inicializar o projeto CLI com oclif + TypeScript (AC: 1)
  - [x] Criar scaffold oclif com metadados do projeto `starfleet`
  - [x] Garantir estrutura de binarios `bin/dev.js` e `bin/run.js`
  - [x] Confirmar script de execucao local funcional
- [x] Criar o esqueleto dos comandos MVP (AC: 2)
  - [x] Gerar `up`, `down`, `status`, `list`, `add` via gerador oclif
  - [x] Garantir exibicao no `--help` global
- [x] Aplicar padrao thin command / core orchestration (AC: 3)
  - [x] Criar `src/core/` com stubs iniciais por dominio (config/cluster/modules/output/errors/logging)
  - [x] Fazer cada comando chamar funcao do `src/core/` (placeholder funcional)
  - [x] Evitar chamadas diretas a k3d/kubectl/helm dentro de `src/commands/*`
- [x] Ajustar UX de help e baseline de docs (AC: 4)
  - [x] Revisar descricoes de comandos para clareza e objetividade
  - [x] Incluir README inicial com fluxo de setup e lista de comandos MVP
- [x] Validar baseline de qualidade tecnica (AC: 1-4)
  - [x] Rodar check de tipo/build e validar que CLI sobe sem erro
  - [x] Executar `./bin/dev.js --help` e capturar saida esperada

### Review Findings

- [x] [Review][Patch] Adicionar `.gitignore` para `node_modules/`, `dist/` e artefactos comuns — evita commits acidentais de dependências e build.
- [x] [Review][Patch] Declarar `engines.node` em `package.json` alinhado à arquitetura (Node LTS, ex. `>=24 <26`) — reprodutibilidade e alinhamento com ADR.
- [x] [Review][Patch] Story pedia stubs por domínio em `src/core/` (`config/`, `cluster/`, etc.); só existe `commandHandlers.ts` — completar placeholders mínimos ou atualizar critério da story para refletir o escopo real.

- [x] [Review][Defer] Aviso `DEP0180` (fs.Stats) ao executar `./bin/dev.js` — depende de versão Node/oclif; não bloqueia scaffold — deferred, pre-existing

## Dev Notes

### Contexto funcional e de negocio

- Esta story e a fundacao do MVP: sem ela os demais fluxos (`up/down/status/add`, validacao e evidencia) nao podem evoluir com consistencia.
- O foco principal e **estrutura correta** e **padrao arquitetural correto**, nao implementacao completa da logica de negocio.

### Guardrails tecnicos obrigatorios

- **Stack oficial:** TypeScript + oclif.
- **Sequencia de implementacao da arquitetura:** esta story e explicitamente a primeira do roadmap (ADR-001 + Implementation Sequence).
- **Separacao de camadas:** `src/commands/*` apenas parse de flags/args + delegacao; `src/core/*` concentra regras e orquestracao.
- **Sem API remota no MVP:** manter CLI-only.
- **Estado de dados:** modelo file-first sera implementado nas proximas stories; aqui apenas preparar encaixe.

### Library / framework requirements

- oclif atual estavel: linha 4.x (referencia pesquisada: 4.23.0 em abr/2026).
- Node baseline: 24 LTS (Krypton), consistente com a arquitetura.
- Nao introduzir frameworks alternativos de CLI (Commander/Cobra/Typer etc.).

### File structure requirements (alvo minimo desta story)

- `bin/dev.js` e `bin/run.js` funcionais.
- `src/commands/up.ts`
- `src/commands/down.ts`
- `src/commands/status.ts`
- `src/commands/list.ts`
- `src/commands/add.ts`
- `src/core/` com stubs iniciais (sem compromisso de implementacao completa nesta story).

### Testing requirements para esta story

- Validar smoke estrutural (nao funcional):
  - CLI inicia sem crash.
  - `--help` global lista comandos MVP.
  - Cada comando responde ao `--help` individual sem erro.
- Preferir adicionar teste(s) basicos de comando para evitar regressao de scaffold.

### Anti-erros para o Dev Agent

- Nao implementar logica de dominio em command handlers.
- Nao iniciar implementacao de modulos/k3d nesta story (escopo indevido).
- Nao quebrar convencoes de nomes e layout gerado pelo oclif.
- Nao introduzir JSON contract final ainda; isso vem em stories seguintes do Epico 1.

### Project Structure Notes

- Alinhar ao padrao definido em arquitetura para CLI modular.
- Evitar conflitos com artefatos BMAD em `_bmad-output/`; codigo de runtime da CLI nao deve depender desses ficheiros.

### References

- `_bmad-output/planning-artifacts/epics.md` (Epic 1, Story 1.1, ACs de fundacao).
- `_bmad-output/planning-artifacts/architecture.md` (Starter Template, ADR-001, Implementation Sequence, Pattern Rules).
- `_bmad-output/planning-artifacts/prd.md` (FR24-FR30 + NFRs de transparencia operacional aplicaveis ao desenho da CLI).
- [Releases oclif](https://github.com/oclif/oclif/releases)
- [Node.js 24.14.0 LTS (Krypton)](https://nodejs.org/tr/blog/release/v24.14.0)

## Dev Agent Record

### Agent Model Used

gpt-5.3-codex

### Debug Log References

- `npm init -y`
- `npx oclif@latest init --yes --bin starfleet --module-type ESM --package-manager npm --topic-separator spaces`
- `npx oclif@latest generate command up/down/status/list/add`
- `npm run build`
- `./bin/dev.js --help`
- `./bin/dev.js add --help`
- `npm test`

### Completion Notes List

- Scaffold oclif inicializado no root do projeto com binarios `bin/dev.js` e `bin/run.js`.
- Comandos MVP criados e ajustados para padrao thin command com delegacao para `src/core/commandHandlers.ts`.
- Build TypeScript configurado com output em `dist/commands` para descoberta correta do oclif.
- Testes de integracao adicionados para garantir presenca dos comandos no help global e help individual.
- Todos os ACs validados com `npm test` e verificacao manual de `./bin/dev.js --help`.
- Code review (batch): `.gitignore`, `engines` no `package.json`, stubs `src/core/{config,cluster,modules,output,errors,logging}/index.ts` ligados em `commandHandlers.ts`.

### File List

- `_bmad-output/implementation-artifacts/1-1-scaffolding-oclif-e-esqueleto-dos-comandos-mvp.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `README.md`
- `src/commands/up.ts`
- `src/commands/down.ts`
- `src/commands/status.ts`
- `src/commands/list.ts`
- `src/commands/add.ts`
- `src/core/commandHandlers.ts`
- `test/integration/cli-help.test.ts`
- `bin/dev.js`
- `bin/run.js`
- `bin/dev.cmd`
- `bin/run.cmd`
- `.gitignore`
- `src/core/config/index.ts`
- `src/core/cluster/index.ts`
- `src/core/modules/index.ts`
- `src/core/output/index.ts`
- `src/core/errors/index.ts`
- `src/core/logging/index.ts`

## Change Log

- 2026-04-16: Implementacao completa da Story 1.1 (scaffold oclif + comandos MVP + testes de help + alinhamento commands->core).
- 2026-04-16: Pos-code-review — `.gitignore`, `engines`, stubs por dominio em `src/core/`.
