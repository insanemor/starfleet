---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02c-executive-summary', 'step-01b-continue', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 1
projectDocsCount: 1
classification:
  projectType: cli_tool
  domain: general
  complexity: medium
  projectContext: greenfield
documentCounts:
  briefCount: 1
  researchCount: 0
  brainstormingCount: 1
  projectDocsCount: 1
inputDocuments:
  - docs/product-brief-starfleet.md
  - docs/starfleet-vision-and-architecture.md
  - _bmad-output/brainstorming/brainstorming-session-2026-04-16-085620.md
---

# Product Requirements Document - {{project_name}}

**Author:** {{user_name}}
**Date:** {{date}}

## Executive Summary

Starfleet is a local k3d-based lab environment for SREs and DevOps engineers who want to learn, test, and demonstrate modern reliability and operations tooling without paying the “first installation” tax every time. Instead of wrestling with bespoke Helm charts, manifests, and glue code for each tool, users run a single CLI command to bring up a curated stack of DevOps/SRE tools, wired together and ready for exploration. The product’s core goal is to make proof-of-concept work and hands-on learning dramatically faster, more consistent, and easier to reproduce as part of a professional portfolio.

Starfleet is built as an Infrastructure-as-Code–first system, where the repository is the source of truth for desired state. A Starfleet lab is defined by declarative modules (per tool or capability), explicit dependencies, and pinned versions, ensuring that a working setup can be reliably re-created months later. The primary user experience is a CLI (`starfleet up/down/status/list/add`) that orchestrates k3d cluster lifecycle, core infrastructure, and a growing catalog of tool modules and guided labs.

### What Makes This Special

The primary differentiator is **validation by experience, not only by health checks**. When a module is first installed or materially changed, Starfleet does more than verify that pods are running and services respond: it supports **UI-assisted validation** where an AI agent can open the tool’s frontend and walk through critical flows (observing metrics, logs, traces, dashboards, etc.) while the human user watches. This significantly reduces the “it looks deployed, but it doesn’t actually work” risk that is common when manifests are generated or refactored with AI.

Under the hood, Starfleet treats every tool or lab as a **versioned, dependency-aware, testable module**. Each module must adhere to a minimum standard: declarative IaC, explicit install/uninstall hooks, documented dependencies and endpoints, and a basic test suite (smoke/integration plus optional UI-assisted flows). Updates happen at the module level, with versions pinned at install time, avoiding the “update everything to latest and break old labs” trap. Combined, these patterns make Starfleet an “anti-Frankenstein” lab: it can grow to include many tools without collapsing under configuration drift and ad hoc scripts.

For users, this translates into three concrete benefits: faster ramp-up on new tools, higher confidence that what “deployed” is actually usable, and a structured way to generate reproducible lab artifacts (reports, screenshots, diagrams) that serve as a professional portfolio.

## Project Classification

- **Project Type:** CLI tool orchestrating a local k3d-based lab
- **Domain:** General DevOps/SRE lab and tooling ecosystem
- **Complexity:** Medium – multiple modules, dependencies, IaC, and validation flows, but no highly regulated domain constraints
- **Project Context:** Greenfield – new product design that can adopt strong patterns from the start

## Success Criteria

### User Success

- Users go from repository clone to completed MVP lab in <= 20 minutes on a defined reference machine.
- Happy-path execution requires <= 5 manual interventions.
- Completion requires real functional evidence (metrics/logs/traces visible in UI), not only service health.
- Re-execution after 30+ days with the same pinned versions reproduces the same critical outcomes.

### Business Success

- North-star metric: percentage of lab completions with valid evidence artifacts.
- Secondary metrics: accepted module/lab contributions and cycle time to approve module PRs.
- Time-bound targets are defined for both 3-month and 12-month horizons, prioritizing real usage over vanity signals.

### Technical Success

- Idempotency contract: repeated `starfleet up` converges without detectable drift.
- Recovery predictability: `down` + `up` reliably restores the environment.
- Mandatory per-module version pinning.
- Deterministic and auditable dependency resolution.
- Mandatory validation for material changes: smoke + integration + UI-assisted validation where frontend exists.

### Measurable Outcomes

- Happy-path success rate (`up` -> `status` -> `validate`) >= 90% across N executions, with error budget <= 10%.
- Module-star UI checklist achieves 100% critical checks passing.
- Portfolio evidence artifacts are generated in 100% of completed MVP lab runs.
- Re-run after 30 days shows 0 deviations on critical acceptance criteria.

## Product Scope

### MVP - Minimum Viable Product

- CLI commands: `up`, `down`, `status`, `list`, `add <module>`.
- k3d base infrastructure with ingress and core namespaces.
- One complete flagship module (e.g., observability-core) with metadata, hooks, docs, and tests.
- One guided lab with objective completion criteria.
- Blocking quality gates required before module/lab promotion.

### Growth Features (Post-MVP)

- Safe `update <module>` workflow.
- Expanded module/lab catalog and learning tracks.
- Higher automation for UI-assisted validation.
- More structured generation of portfolio reports.

### Vision (Future)

- Third-party module ecosystem aligned to Starfleet standards.
- Advanced guided experiences (including SRE/chaos scenarios).
- Optional TUI/UI layer for operation and observability.

## User Journeys

### Journey 1 - Primary Success Path: DevOps Building Portfolio

**Opening Scene:** A DevOps professional in transition wants to prove practical capability without fighting complex setup friction.  
**Rising Action:** They clone the repository, run `starfleet up`, and execute a guided lab with clear step-level progress.  
**Climax:** They validate real functionality through mandatory evidence (metrics + logs + traces), not only green service status.  
**Resolution:** They generate a portfolio artifact (experiment summary, evidence, expected vs observed result) and leave with confidence.

- **What could go wrong:** environment partially succeeds and appears healthy while core flow is still broken.
- **Recovery path:** incremental re-validation checklist per stage.
- **Done criteria:** complete functional evidence set and generated portfolio artifact.

### Journey 2 - Primary Edge Case: Failure and Fast Recovery

**Opening Scene:** During `up` or `add`, dependency/config/network/resource failures create immediate friction.  
**Rising Action:** The user receives classified errors with probable cause and next best action.  
**Climax:** They choose one recovery route with time expectation: **fast** (retry), **safe** (rollback), or **investigative** (guided diagnosis).  
**Resolution:** The environment converges and the user captures practical learning instead of abandoning.

- **What could go wrong:** generic error without actionable next step.
- **Recovery path:** guided three-level recovery flow.
- **Done criteria:** service recovered and functional validation re-confirmed.

### Journey 3 - Secondary User: Module Maintainer

**Opening Scene:** A maintainer wants to add or upgrade a module without destabilizing the ecosystem.  
**Rising Action:** They follow the module standard: metadata, explicit dependencies, lifecycle hooks, tests, and docs.  
**Climax:** The module passes quality gates and enters the catalog with pinned versioning.  
**Resolution:** The contribution lands predictably with minimal structural rework.

- **What could go wrong:** incompatible module breaks existing labs.
- **Recovery path:** fallback to previous pinned version and promotion block.
- **Done criteria:** module Definition of Done complete and PR-ready without structural rework.

### Journey 4 - Safe Exploration of a New Tool (Fast POC)

**Opening Scene:** The user wants to test a new tool in the lab without breaking what already works.  
**Rising Action:** They add the module/tool, Starfleet resolves dependencies, and applies standard deployment flow.  
**Climax:** They validate real usage of the new tool (UI/data/integration), not just installation success.  
**Resolution:** They decide to keep or remove the tool with low risk and document learning as portfolio evidence.

- **What could go wrong:** dependency breakage or incomplete integration.
- **Recovery path:** module rollback plus guided diagnosis.
- **Done criteria:** tool validated with functional evidence and clear keep/remove decision.

### Journey 5 - Build and Iterate on Starfleet Itself

**Opening Scene:** The user wants to evolve Starfleet with a new command, feature, or behavior while avoiding Frankenstein drift.  
**Rising Action:** They implement a small change, bring up the environment, and run smoke/integration plus assisted validation where applicable.  
**Climax:** The new feature works without regression to the core flow (`up/down/status/add`).  
**Resolution:** The change is reproducible, documented, and ready to progress on the roadmap.

- **What could go wrong:** regression in a previously stable core flow.
- **Recovery path:** fallback to previous known-good state plus happy-path re-validation.
- **Done criteria:** feature delivered with evidence/tests and no degradation of MVP core paths.

### Journey Requirements Summary

- Simple CLI onboarding and operation with objective-driven flow.
- Mandatory functional validation (not only health checks).
- Guided failure recovery with clear route selection.
- Module governance with Definition of Done, quality gates, pinning, and explicit dependencies.
- Safe POC exploration and core product evolution with regression protection.
- Reproducible portfolio evidence generation.

## Innovation & Novel Patterns

### Detected Innovation Areas

- UI-assisted validation as a core product capability, not an optional add-on.
- Experience-first validation model that goes beyond basic health checks.
- Direct reduction of local-lab friction caused by complexity, delays, and environment drift.

### Market Context & Competitive Landscape

- In local lab workflows, deployment status is often treated as proof of value without functional confirmation.
- Starfleet differentiates by making functional validation part of the default learning and POC loop.
- This section is based on internal product context only, with no external market research in this step.

### Validation Approach

- Primary innovation validation metric: reliability of `up` and reliability when adding new features/modules.
- Practical success condition: users can complete assisted UI validation and confirm useful real-world functionality.
- Innovation success signal: reduced ambiguity between “deployed” and “actually working.”

### Risk Mitigation

- Risk: assisted UI validation does not deliver clear value over traditional manual checks.
- Fallback: checklist-based manual validation plus explicit user confirmation.
- Guardrail: assisted validation remains an incremental layer, not a hard dependency for workflow completion.

## CLI Tool Specific Requirements

### Project-Type Overview

Starfleet is a CLI-first product designed primarily for interactive use, while preserving scriptability for automation workflows. The command experience optimizes human-guided learning and POC execution, with deterministic machine-readable outputs available for integrations.

### Technical Architecture Considerations

- Interaction model follows a 70/30 balance: interactive-first UX with explicit script-friendly pathways.
- Configuration source of truth is `starfleet.yaml`, with predictable loading and validation.
- Output supports both human-readable operational guidance and structured JSON for integration and file workflows.
- Shell integration starts with zsh completion for command and argument discovery.

### Command Structure

- Core command surface remains: `up`, `down`, `status`, `list`, `add`.
- Commands provide clear interactive prompts/messages in human mode.
- Commands remain deterministic and composable for scripted execution.
- Error output includes actionable next steps for both interactive and automation contexts.

### Output Formats

- Default output mode is human-readable for local operation and guided workflows.
- Structured output mode is JSON for file output and integrations.
- Output mode selection is explicit and consistent across commands.
- Core command JSON output keeps stable keys/fields to prevent integration drift.

### Config Schema

- Primary configuration file is `starfleet.yaml`.
- Configuration is declarative, version-aware, and validates module/dependency definitions.
- Config parsing fails fast with clear remediation-oriented error messages.
- Schema supports reproducibility through pinned versions, explicit dependencies, and profile-level options.

### Scripting Support

- Scriptability is a first-class secondary path in the CLI model.
- Commands are safe in non-interactive contexts and preserve idempotent expectations.
- JSON workflows support automation pipelines for status checks and execution chaining.
- zsh completion coverage is included for the MVP command set and core argument patterns.

### Implementation Considerations

- Keep interactive prompts concise and informative to support fast learning loops.
- Maintain stable machine-mode behavior across releases, especially for JSON contracts.
- Align CLI behavior with the differentiator: confidence through reliable setup and validation.
- Prioritize zsh completion quality for MVP usability and discoverability.

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** platform  
**Resource Requirements:** 2-person team (1 DevOps/Dev + 1 SRE/Dev)

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Reliable local lab bring-up and operation.
- Functional validation of a real observability stack.
- Safe evolution path for adding future modules/tools.

**Must-Have Capabilities:**
- Idempotent provisioning of base infrastructure (k3d cluster).
- One complete flagship capability in MVP (`Prometheus + Grafana`) with functional validation.
- Fully functional core command set to enable future expansion (`up`, `down`, `status`, `list`, `add`).

### Post-MVP Features

**Phase 2 (Post-MVP):**
- Initial ELK stack module:
  - Elasticsearch
  - Kibana
  - Filebeat

**Phase 3 (Expansion):**
- Expanded module catalog and guided learning tracks.
- Higher automation of assisted validation and portfolio evidence generation.
- Incremental hardening of module lifecycle and update workflows.

### Risk Mitigation Strategy

**Technical Risks:** Module additions can cause regressions in core flows.  
**Mitigation:** Enforce quality gates, checklist/UI-assisted validation, and pinned-version fallback paths.

**Market Risks:** Early value proposition may be unclear without a compelling first experience.  
**Mitigation:** Keep focus on a strong observability MVP with fast time-to-value and demonstrable outcomes.

**Resource Risks:** Small team can be overrun by roadmap breadth.  
**Mitigation:** Keep strict MVP boundaries around platform foundation and defer non-essential features to later phases.

## Functional Requirements

### Environment Lifecycle Management

- FR1: User can initialize the local lab environment from declarative configuration.
- FR2: User can shut down and clean the lab environment when needed.
- FR3: User can inspect current environment and active module status.
- FR4: User can re-run environment bring-up and receive consistent operational outcomes.
- FR5: User can recover the environment back to operational state after execution failures.

### Module Catalog & Dependency Management

- FR6: User can list available modules/tools for installation in the lab.
- FR7: User can add a module to the active environment.
- FR8: System can resolve mandatory module dependencies before activation.
- FR9: System can preserve per-module version pinning for reproducibility.
- FR10: User can decide to keep or remove a module after validation.
- FR11: System can block module promotion when minimum quality criteria are not met.
- FR12: User can update an installed module independently from the rest of the environment.
- FR13: User can activate predefined module profiles composed of related capabilities.
- FR14: System can resolve and apply profile dependencies automatically before profile activation.

### Functional Validation & Confidence

- FR15: User can execute functional validation beyond basic availability checks.
- FR16: System can provide UI-assisted validation for modules with frontends.
- FR17: User can explicitly confirm whether feature/module validation is satisfactory.
- FR18: System can provide checklist-based manual validation fallback when assisted validation is unavailable.
- FR19: User can re-validate the environment after changes to confirm no functional regression.

### Guided Error Recovery

- FR20: User can receive classified failure feedback with probable cause and recommended next step.
- FR21: User can choose a recovery route (fast retry, safe rollback, guided diagnosis).
- FR22: System can guide recovery flow until functional state is restored.
- FR23: User can confirm recovery completion with renewed functional validation.

### CLI Interaction, Configuration & Automation

- FR24: User can operate the product through interactive CLI workflows.
- FR25: User can execute core commands in non-interactive mode for automation.
- FR26: System can produce human-readable output for interactive operation.
- FR27: System can produce structured JSON output for integration and file workflows.
- FR28: User can configure and manage environment settings through `starfleet.yaml`.
- FR29: User can receive actionable CLI error feedback in both interactive and scripted flows.
- FR30: User can use zsh shell completion for command and argument discovery.

### Portfolio Evidence & Learning Outcomes

- FR31: User can generate evidence artifacts upon completing labs/experiments.
- FR32: Evidence artifacts can capture experiment context and observed outcomes.
- FR33: User can use generated evidence to demonstrate learning and portfolio progression.
- FR34: User can iterate Starfleet features while maintaining validation traceability.

### Maintainer Contribution Workflow

- FR35: Maintainer can prepare new modules aligned with product minimum standards.
- FR36: Maintainer can submit module updates while preserving ecosystem compatibility.
- FR37: System can reject contributions that do not satisfy functional acceptance criteria.
- FR38: Maintainer can validate that contributions do not compromise MVP core flows.

## Non-Functional Requirements

### Performance & Operational Transparency

- The system must provide continuous CLI feedback during long-running operations (`up`, `add`, `update`) to avoid silent states.
- The system must expose stage-based execution progress (e.g., preparation, dependency resolution, apply, validation).
- The system must provide real-time operational status understandable by human operators.
- The system must provide interactive logs that clearly indicate current step, success transitions, and failure transitions.
- The system must explicitly signal execution state changes (running, successful completion, failed completion).

### Reliability

- The primary flow (`up` -> `status` -> `validate`) must achieve a minimum 90% success rate in expected MVP usage conditions.
- The system must support repeat execution after failures without compromising expected environment consistency.
- The system must provide explicit recovery paths for dependency, module, and validation failures.
- The system must maintain predictable behavior across repeated executions of the same configured environment.

### Integration

- The system must provide structured JSON outputs for automation and pipeline use.
- JSON output contracts must remain stable across minor and patch releases.
- Backward-incompatible output contract changes must require a major version change.
- Status semantics in structured outputs must remain consistent for automation consumers.

### Scalability

- The system must support incremental growth of module catalog scope without breaking MVP core flows.
- The system must preserve predictable operation as new features/tools are added over time.
- Module expansion workflows must retain governance and quality criteria defined by the product.
