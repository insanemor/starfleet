---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - docs/product-brief-starfleet.md
  - docs/starfleet-vision-and-architecture.md
workflowType: 'architecture'
project_name: 'starfleet'
user_name: 'Moreira'
date: '2026-04-16'
lastStep: 8
status: 'complete'
completedAt: '2026-04-16'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
The project defines 38 functional requirements spanning environment lifecycle management, module catalog and dependency management, functional validation, guided failure recovery, CLI interaction/automation, portfolio evidence generation, and maintainer contribution workflows.

Architecturally, this implies:
- A deterministic orchestration core for environment lifecycle (`up`, `down`, `status`).
- A module system with explicit dependency graph handling, per-module version pinning, and isolated module updates.
- A validation subsystem combining smoke/integration checks with optional UI-assisted validation flows.
- A recovery orchestration flow that classifies failures and routes users through retry, rollback, or guided diagnosis.
- A dual-interface CLI design that preserves parity between interactive UX and machine-readable automation outputs.
- A traceable evidence pipeline for lab completion and learning artifacts.

**Non-Functional Requirements:**
The architecture is strongly shaped by:
- Reliability targets (>=90% success in primary flow).
- Operational transparency (continuous stage-based CLI feedback).
- Integration stability (stable JSON contracts and semantic consistency).
- Scalability of module catalog growth without destabilizing core flows.

These NFRs drive decisions around state management, execution engine observability, contract governance, and module boundary design.

**Scale & Complexity:**
The project scope is medium-to-high complexity due to cross-cutting concerns and platform-style extensibility requirements.

- Primary domain: CLI-driven local platform orchestration for DevOps/SRE labs
- Complexity level: medium-high
- Estimated architectural components: 8-12 core components

### Technical Constraints & Dependencies

Known constraints and dependencies include:
- k3d as foundational local cluster runtime.
- IaC-first and repository-as-source-of-truth operating model.
- Mandatory idempotency and deterministic convergence behavior.
- Explicit dependency declarations between modules.
- Mandatory version pinning per module for reproducibility.
- Validation requirements beyond health checks, including UI-assisted verification where applicable.
- zsh completion support for MVP command surface.
- `starfleet.yaml` as declarative environment configuration source.

### Cross-Cutting Concerns Identified

The following concerns will affect multiple components and architectural layers:
- State convergence and drift prevention.
- Dependency resolution determinism and conflict handling.
- Module lifecycle governance (install/update/remove with guardrails).
- Validation orchestration and evidence traceability.
- Error taxonomy and guided recovery UX.
- Contract versioning and backward compatibility for JSON outputs.
- Security/secrets handling across module boundaries.
- Reproducibility over time (30+ day rerun consistency with pinned versions).

## Starter Template Evaluation

### Primary Technology Domain

CLI tool platform based on project requirements analysis (local k3d orchestration, modular lifecycle, validation and automation support).

### Starter Options Considered

- **TypeScript + oclif (selected)**  
  Actively maintained framework for production CLIs, with recent 2026 releases and built-in generator workflow.
- **TypeScript + Commander boilerplates**  
  Viable for lightweight CLIs, but boilerplates are fragmented and less standardized for large lifecycle/governance features.
- **Go + Cobra**  
  Strong fit for infra CLIs, but not selected due to current preference for TypeScript ecosystem and faster JS tooling iteration.
- **Python + Typer / Rust + clap**  
  Good ecosystems, but lower alignment with selected stack and current implementation direction.

### Selected Starter: oclif (TypeScript)

**Rationale for Selection:**
- Matches the chosen stack (TypeScript) and project type (CLI-first platform).
- Provides opinionated structure for command/topic growth (`up`, `down`, `status`, `list`, `add`, future `validate`, `update`).
- Strong release cadence and active maintenance in 2026.
- Supports both npm distribution and packaged installers/tarballs for broader delivery options.
- Good fit for interactive CLI UX plus machine-oriented output contracts.

**Decision score:** 91/100 (weighted comparative matrix)

**Key trade-off:** higher runtime/distribution footprint than native Go binaries, in exchange for faster TypeScript iteration and command-surface evolution.

**Mitigation strategy:** dual distribution path (npm global + packaged artifacts for end users), plus strict Node LTS governance.

**Initialization Command:**

```bash
npm install --global oclif
oclif generate starfleet --yes
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- TypeScript-first CLI scaffold on Node.js LTS.
- Module type and package/bin metadata initialized via generator defaults or flags.

**Styling Solution:**
- Not applicable as UI styling layer; terminal UX uses CLI output patterns and optional formatting libs.

**Build Tooling:**
- Dev/production bin entry points (`bin/dev.js`, `bin/run.js`) with TypeScript workflow.
- Packaging/release paths supported by oclif tooling for npm and installers.

**Testing Framework:**
- Starter-ready project where test stack can be standardized early (unit + command behavior + integration orchestration tests).

**Code Organization:**
- Command-oriented structure under `src/commands`.
- Clear separation of command surface and reusable service/orchestration layers.

**Development Experience:**
- Fast command scaffolding (`oclif generate command ...`), local dev execution, and predictable project conventions.
- Suitable base for expanding module governance, dependency resolution, validation orchestration, and JSON contract stability.

### Pre-mortem Risk Notes

1. **Local works, CI/user fails**  
   - Cause: Node/version drift and unpinned toolchain  
   - Prevention: explicit Node LTS, `engines`, lockfile, CI matrix pinned to supported runtime
2. **JSON contract drift in minor releases**  
   - Cause: ungoverned output changes  
   - Prevention: contract tests (golden/snapshot), semver discipline
3. **Poor UX in long-running commands**  
   - Cause: weak stage feedback and log flow  
   - Prevention: execution engine emitting stage events and streaming logs
4. **Distribution friction for users without Node**  
   - Cause: npm-only release path  
   - Prevention: packaged installer/tarball channel in release process
5. **Domain logic coupled to command layer**  
   - Cause: shortcut implementation inside `commands/*`  
   - Prevention: strict layering with thin commands + `core` orchestration modules

### ADR-001: Base CLI with TypeScript + oclif

**Status:** Accepted (for architecture baseline)  
**Date:** 2026-04-16

**Context**
Starfleet requires:
- A modular CLI with predictable command growth.
- Long-running operations with stage-based feedback.
- Stable JSON contracts for automation.
- Fast MVP iteration with strong developer ergonomics.
- A distribution path for both technical and non-technical users.

**Decision**
Adopt **TypeScript + oclif** as the official CLI starter for Starfleet.

**Alternatives Considered**
- Go + Cobra
- Python + Typer
- Rust + clap
- TypeScript + Commander (less opinionated boilerplate)

**Decision Drivers**
- Fit for CLI domain and command/topic scalability.
- Active maintenance and release cadence.
- Productivity in the selected TypeScript ecosystem.
- Distribution options (npm + packaged artifacts).
- Compatibility with layered architecture (thin commands + orchestration core).

**Consequences**
- **Positive:** scalable command structure, high iteration speed, better CLI standards baseline.
- **Negative/trade-off:** Node runtime dependency and need for layering discipline.
- **Mitigations:** Node LTS pinning, contract tests, dual distribution path, explicit layer boundaries.

**Implementation Note**
Project initialization should start with:
- `npm install --global oclif`
- `oclif generate starfleet --yes`

**Note:** Project initialization using this command should be the first implementation story.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- CLI platform baseline: TypeScript + oclif (from starter evaluation)
- Data architecture: file-first core state and config
- API/communication baseline: CLI-only MVP with stable JSON output mode
- Infrastructure baseline: local-first k3d execution model
- Security baseline: no CLI auth/RBAC in MVP, local operator trust model

**Important Decisions (Shape Architecture):**
- Validation on load for config/state schemas at CLI boundaries
- Error taxonomy standard (`code`, `message`, `hint`, `details`) + process exit codes
- In-process service communication model (no event bus/microservices)
- Structured logging model with optional JSON output
- README-first command contract documentation in MVP

**Deferred Decisions (Post-MVP):**
- State schema migration framework
- Formal JSON contract spec system
- Remote API surface and API security controls
- RBAC and multi-operator auth model
- CI/CD hardening and release automation

### Data Architecture

- **Primary storage model:** File-first core (`starfleet.yaml` + operational state files)
- **Data validation:** Required at CLI load boundaries (schema validation enabled)
- **State migration strategy:** Not required in MVP
- **Caching strategy:** In-memory only per execution, no persistent cache

**Rationale:**
Keeps MVP setup simple and transparent while preserving reproducibility and deterministic behavior.

### Authentication & Security

- **Authentication method:** None in MVP (single local operator model)
- **Authorization model:** No internal RBAC in MVP
- **Secrets strategy:** Local `.env` (gitignored)
- **Encryption approach:** Sensitive secrets only, no full state encryption
- **API security:** N/A in MVP (no remote API surface)

**Rationale:**
Security posture is aligned with local-lab MVP scope and reduced operational complexity.

### API & Communication Patterns

- **API design:** CLI-only in MVP
- **Output contracts:** Human-readable default + stable `--output json`
- **Error handling standard:** Structured taxonomy + deterministic exit codes
- **Internal communication:** In-process service interfaces
- **Contract documentation:** README-based (textual), no formal contract spec in MVP

**Rationale:**
Supports both human and automation workflows while avoiding premature API complexity.

### Frontend Architecture

- **Frontend for Starfleet product:** N/A in MVP
- **UI role in MVP:** External tool UIs (e.g., Grafana/Kibana) are validation targets, not product frontend

**Rationale:**
Maintains CLI-first focus and avoids splitting effort across interface surfaces in MVP.

### Infrastructure & Deployment

- **Execution/hosting strategy:** Local-first mandatory with k3d
- **CI/CD approach:** No formal CI pipeline in MVP
- **Environment configuration:** `starfleet.yaml` + `.env`
- **Monitoring/logging:** Structured logs with level controls and JSON option
- **Scaling strategy:** Modular monolith for core and module lifecycle

**Reference versions (verified April 2026):**
- Node.js LTS baseline: **24 (Krypton)**
- k3d: **v5.8.3**
- kubectl: **1.35.3**
- Helm: **4.1.x** (current stable line; e.g. **4.1.4**)
- GitHub Actions runner label `ubuntu-latest`: **Ubuntu 24.04**

**Rationale:**
Prioritizes speed and low complexity for initial delivery while preserving clear evolution paths.

### Decision Impact Analysis

**Implementation Sequence:**
1. Initialize oclif project and define command skeleton (`up/down/status/list/add`)
2. Implement config/state contracts and load-time validation
3. Implement orchestration core and module lifecycle interfaces
4. Implement deterministic error taxonomy and exit code mapping
5. Implement structured logging and JSON output pathways
6. Implement validation flows and evidence generation hooks

**Cross-Component Dependencies:**
- File-first data contracts directly shape command behavior and error taxonomy
- CLI output and logging standards constrain validation/reporting and automation flows
- Security model (local operator) constrains deployment model (local-first) and API deferrals
- No CI in MVP increases need for strict local validation gates and reproducible command workflows

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:**
12 áreas onde agentes diferentes poderiam divergir sem regras explícitas: convenção de arquivos da CLI, formato JSON, localização de testes, taxonomia de erros, exit codes, logging estruturado, nomes de flags, organização `commands` vs `core`, tratamento de paths locais, carregamento de `starfleet.yaml`/`.env`, mensagens humanas vs payload JSON, e extensão de novos comandos oclif.

### Naming Patterns

**Database Naming Conventions:**
N/A no MVP (sem banco de dados no core).

**API Naming Conventions:**
N/A no MVP (sem API HTTP remota). Superfície pública = comandos oclif + flags.

**Code & File Naming Conventions:**
- **Comandos e scaffolding:** seguir exatamente o layout e convenções geradas pelo **oclif** (decisão 1C). Novos comandos devem ser criados com `oclif generate command ...` e respeitar pastas/padrões do template.
- **TypeScript:** `PascalCase` para classes/tipos exportados; `camelCase` para funções, variáveis e propriedades internas.
- **Constantes de domínio:** `SCREAMING_SNAKE_CASE` apenas para constantes verdadeiramente fixas (ex.: códigos de erro estáveis).
- **Arquivos utilitários fora do gerador:** preferir nomes curtos e consistentes com o restante do repo existente; se houver conflito, alinhar ao estilo predominante do diretório pai.

### Structure Patterns

**Project Organization:**
- **`src/commands/`:** apenas adaptadores finos de CLI (parse de flags, chamada ao core, formatação de saída).
- **`src/core/` (ou equivalente):** orquestração, resolução de módulos, estado, validação, integração com k3d/ferramentas externas.
- **Módulos do lab:** manter fronteira clara entre “código da CLI Starfleet” e “IaC/módulos” (ex.: `modules/<nome>/`), sem misturar lógica de domínio dentro de templates Helm/YAML.

**File Structure Patterns:**
- Configuração: `starfleet.yaml` na raiz do uso do projeto (ou caminho explícito via flag, quando existir).
- Segredos: `.env` local, nunca commitado; fornecer `.env.example` sem valores sensíveis.
- Estado operacional: arquivos dedicados (ex.: diretório `.starfleet/` ou nome acordado na implementação), com formato versionado por campo quando necessário, sem framework de migração no MVP.

**Tests:**
- **Unitários:** co-localizados (`*.test.ts` junto ao código).
- **Integração:** `test/integration/` apenas para fluxos que acionam binário, k3d, ou subprocessos reais.

### Format Patterns

**API Response Formats:**
N/A como HTTP. Para **CLI JSON**, padronizar envelope mínimo:

```json
{
  "ok": true,
  "command": "up",
  "data": {},
  "error": null
}
```

- Em falha: `ok: false`, `error` com `{ "code", "message", "hint", "details" }` (campos em **camelCase**).
- **Regra:** todos os campos estáveis de `--output json` usam **camelCase** (decisão 2A).

**Data Exchange Formats:**
- **Datas/horas:** ISO-8601 em string UTC (`...Z`) nos payloads JSON.
- **Booleanos:** `true` / `false` (nunca `1`/`0` em JSON).
- **Opcionais ausentes:** omitir campo opcional quando possível; se necessário, `null` apenas para campos explicitamente anuláveis no contrato.

### Communication Patterns

**Event System Patterns:**
N/A no MVP (sem event bus). Eventos internos, se existirem, são **in-process** e devem usar nomes em `camelCase` ou `PascalCase` consistente com tipos TypeScript, sem payloads globais não tipados.

**State Management Patterns:**
- Estado em memória durante execução: preferir objetos imutáveis ou cópias explícitas ao cruzar limites de camada (commands → core).
- Persistência: somente via arquivos acordados; nenhum cache persistente entre execuções.

### Process Patterns

**Error Handling Patterns:**
- Sempre propagar erro estruturado até a camada de comando, que decide renderização humana vs JSON.
- **Taxonomia:** todo erro exposto deve mapear para `code` estável (string), `message` curta, `hint` acionável, `details` opcional (objeto/array).
- **Exit codes (decisão 5A):**
  - `0` — sucesso
  - `1` — erro genérico / falha não classificada
  - `2` — uso inválido (flags/argumentos)
  - `10+` — erros por domínio (ex.: `10` k3d, `20` módulo, `30` validação); reservar faixas em documentação ao introduzir domínios

**Loading State Patterns:**
- Para operações longas (`up`, `add`): progresso por **estágios nomeados** + logs; em JSON, emitir eventos/estrutura de progresso estável (definir campos na implementação e não mudar sem bump de versão major da CLI).

### Enforcement Guidelines

**All AI Agents MUST:**
- Respeitar o layout e geração de comandos via **oclif** (não reinventar estrutura de CLI).
- Manter **JSON camelCase** e compatibilidade backward em releases minor/patch.
- Colocar testes conforme regra híbrida (unit co-localizado; integração em `test/integration/`).
- Usar apenas os níveis de log `debug | info | warn | error`.
- Respeitar a matriz de **exit codes** acima.

**Pattern Enforcement:**
- Revisar PRs procurando por: campos JSON em snake_case, testes de integração fora de `test/integration/`, lógica pesada em `src/commands/*`, exit codes ad hoc.
- Violações: corrigir antes de merge; atualizar este documento se a convenção mudar (com nota de breaking change).

### Pattern Examples

**Good Examples:**
- `oclif generate command modules:list` seguido de implementação fina em `src/commands/modules/list.ts` chamando `src/core/modules/catalog.ts`.
- JSON: `{ "ok": true, "command": "status", "data": { "clusterName": "starfleet" }, "error": null }`

**Anti-Patterns:**
- Colocar chamadas diretas a `kubectl`/`k3d` dentro de `src/commands/*` sem passar pelo core.
- Misturar snake_case e camelCase no mesmo payload JSON.
- Usar exit code `1` para “uso inválido” (deve ser `2`).

## Project Structure & Boundaries

### Complete Project Directory Structure

```
starfleet/
├── README.md
├── package.json
├── tsconfig.json
├── eslint.config.js
├── .gitignore
├── .env.example
├── starfleet.yaml.example
├── bin/
│   ├── dev.js
│   ├── dev.cmd
│   ├── run.js
│   └── run.cmd
├── src/
│   ├── index.ts
│   ├── commands/
│   │   ├── up.ts
│   │   ├── down.ts
│   │   ├── status.ts
│   │   ├── list.ts
│   │   └── add.ts
│   └── core/
│       ├── config/
│       │   ├── loadStarfleetConfig.ts
│       │   └── loadStarfleetConfig.test.ts
│       ├── state/
│       │   ├── stateStore.ts
│       │   └── stateStore.test.ts
│       ├── cluster/
│       │   ├── k3dRunner.ts
│       │   └── k3dRunner.test.ts
│       ├── modules/
│       │   ├── catalog.ts
│       │   ├── resolver.ts
│       │   ├── lifecycle.ts
│       │   └── moduleTypes.ts
│       ├── validate/
│       │   ├── validateRunner.ts
│       │   └── validateRunner.test.ts
│       ├── errors/
│       │   ├── exitCodes.ts
│       │   ├── StarfleetError.ts
│       │   └── formatError.ts
│       ├── output/
│       │   ├── humanFormatter.ts
│       │   ├── jsonFormatter.ts
│       │   └── outputMode.ts
│       └── logging/
│           ├── logger.ts
│           └── logger.test.ts
├── modules/
│   └── observability-core/
│       ├── module.yaml
│       ├── README.md
│       ├── iac/
│       │   └── (helm/kustomize/manifests conforme módulo)
│       └── tests/
│           ├── smoke/
│           └── integration/
├── labs/
│   └── observability-101/
│       ├── lab.yaml
│       └── README.md
├── test/
│   └── integration/
│       ├── cli-smoke.test.ts
│       └── k3d-happy-path.test.ts
├── docs/
│   ├── product-brief-starfleet.md
│   └── starfleet-vision-and-architecture.md
└── _bmad-output/
    └── (artefatos BMAD — fora do runtime da CLI)
```

Arquivos exatos sob `src/commands/` devem seguir o layout gerado pelo **oclif**; os nomes acima são alvo lógico de comandos MVP (`up`, `down`, `status`, `list`, `add`).

### Architectural Boundaries

**API Boundaries:** Nenhuma API HTTP no MVP. Superfície pública = binário `starfleet` + flags; integrações externas via subprocessos/CLI (`k3d`, `kubectl`, `helm`).

**Component Boundaries:** `src/commands/*` apenas adaptadores de CLI; lógica de domínio em `src/core/*`. Conteúdo em `modules/*` é IaC + metadados do módulo, não biblioteca TypeScript da CLI salvo hooks explícitos.

**Service Boundaries:** Serviços internos como módulos TS em `src/core/<domínio>/`, consumidos pelos commands via interfaces pequenas.

**Data Boundaries:** `starfleet.yaml` + estado em diretório operacional (ex.: `.starfleet/`); `.env` apenas para segredos; sem persistência relacional no core no MVP.

### Requirements to Structure Mapping

**Environment lifecycle (FR1–FR5):** `src/core/cluster/`, `src/commands/up.ts`, `down.ts`, `status.ts`.

**Module catalog & dependencies (FR6–FR14):** `src/core/modules/`, `modules/*/module.yaml`, `src/commands/list.ts`, `add.ts`.

**Functional validation (FR15–FR19):** `src/core/validate/`, `modules/*/tests/`, `labs/*/`.

**Guided recovery (FR20–FR23):** `src/core/errors/`, fluxos coordenados em `src/core/cluster/` e ciclo de vida em `src/core/modules/`.

**CLI & automation (FR24–FR30):** `src/commands/*`, `src/core/output/`, `src/core/config/`.

**Portfolio evidence (FR31–FR34):** extensão em `src/core/` (ex.: `evidence/` na implementação), artefatos em diretório operacional documentado.

**Maintainer workflow (FR35–FR38):** contratos em `modules/*/module.yaml`, verificações em `src/core/modules/`, docs em `modules/*/README.md`.

### Integration Points

**Internal:** commands → core (tipos explícitos); core → runners externos encapsulados (`k3dRunner`, etc.).

**External:** ferramentas no PATH; versões de referência documentadas no README e por módulo.

**Data flow:** `starfleet.yaml` + `.env` → load/validate → plano de execução → mutações em cluster/FS → estado persistido → saída human-readable ou JSON.

### File Organization Patterns

**Configuration:** `starfleet.yaml.example` e `.env.example` na raiz; instâncias reais ignoradas pelo git quando aplicável.

**Source:** `src/commands` (oclif) + `src/core` (domínio).

**Tests:** unitários `*.test.ts` co-localizados; integração em `test/integration/`.

**Assets / generated:** evidências e artefatos gerados fora de `src/`, em diretório operacional com `.gitignore`.

### Development Workflow Integration

**Development:** `./bin/dev.js <comando>` (padrão oclif).

**Build:** compilação TypeScript para `dist/` conforme toolchain do projeto; produção via `bin/run.js`.

**Distribution:** npm / empacotamento oclif quando houver pipeline de release (CI deliberadamente ausente no MVP).

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**  
Stack TypeScript + oclif + Node LTS, execução k3d local, estado file-first, saída human + JSON em camelCase, erros com taxonomia e exit codes, segurança de operador local com `.env`, ausência de API remota e ausência de CI no MVP formam um conjunto coerente. Trade-off aceito: menos guardrails automatizados (CI), mais dependência de validação local e disciplina de revisão.

**Pattern Consistency:**  
As regras da seção Implementation Patterns & Consistency Rules sustentam as decisões da seção Core Architectural Decisions (contratos JSON, logs, separação commands/core).

**Structure Alignment:**  
A árvore de Project Structure & Boundaries suporta os FRs agrupados (ciclo de vida, módulos, validação, recuperação, CLI, evidências, mantenedores).

### Requirements Coverage Validation

**Epic/Feature Coverage:**  
Não há épicos versionados nos documentos de entrada; a cobertura foi feita por categorias de FR e NFR do PRD.

**Functional Requirements Coverage:**  
O mapeamento FR → diretórios cobre FR1–FR38 em linhas gerais. **Gap importante:** o detalhe de validação assistida por UI (browser/agente) ainda não está decomposto em componentes nomeados — deve ser especificado na implementação dentro de `src/core/validate/` e processos auxiliares.

**Non-Functional Requirements Coverage:**  
Transparência operacional, confiabilidade, contratos JSON e crescimento modular estão endereçados. **Gap:** métricas de taxa de sucesso exigem convenção de registro local (artefatos de execução ou checklist) — a definir na implementação.

### Implementation Readiness Validation

**Decision Completeness:**  
Decisões críticas documentadas; versões de referência para Node, k3d, kubectl e Helm registradas. A versão exata do pacote `oclif` no projeto será fixada no primeiro PR de scaffolding.

**Structure Completeness:**  
Árvore e limites definidos; pequenas divergências com o gerador oclif são esperadas e devem seguir a regra “alinhado ao template oclif”.

**Pattern Completeness:**  
Principais pontos de conflito entre agentes cobertos; documentação README por comando permanece responsabilidade de implementação.

### Gap Analysis Results

**Critical gaps:** nenhum bloqueador lógico entre o PRD e esta arquitetura.

**Important gaps:**  
1) Decompor validação assistida por UI (pré-requisitos, falha segura, artefatos).  
2) Definir formato mínimo de evidência de portfólio (manifest, paths, JSON).

**Nice-to-have:** CI quando existir; spec formal de JSON; ADR de pinagem exata do oclif no repositório.

### Validation Issues Addressed

Nenhuma correção estrutural adicional além do registro dos gaps acima.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION  
**Confidence Level:** medium-high  

**Key Strengths:**  
Separação commands/core, contratos de saída CLI, modelo local reprodutível, modularidade de módulos e labs.

**Areas for Future Enhancement:**  
CI/CD, spec formal de JSON, migração de estado persistido, autenticação multi-operador.

### Implementation Handoff

**AI Agent Guidelines:**  
Seguir este documento como fonte de verdade arquitetural; respeitar limites de pastas e padrões de consistência.

**First Implementation Priority:**  
`npm install --global oclif` → `oclif generate starfleet --yes` → esqueleto dos comandos MVP e `src/core/config` com validação de `starfleet.yaml`.
