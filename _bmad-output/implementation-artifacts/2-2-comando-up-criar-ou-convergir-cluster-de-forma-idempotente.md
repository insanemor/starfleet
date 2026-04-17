# Story 2.2: Comando `up` — criar ou convergir cluster de forma idempotente

Status: done

## Story

As a utilizador,
I want `starfleet up` para criar ou alinhar o cluster k3d ao estado desejado,
So that repetir `up` não introduz drift injustificado (FR1, FR4, NFR7, NFR9).

## Acceptance Criteria

1. Cluster inexistente: `up` cria via k3d e grava `.starfleet/state.json` com `schemaVersion` e fingerprint do spec.
2. Cluster existente + manifesto igual ao último apply: sem recriação; estágios nomeados em log (`up: stage=...`).
3. Falha em `cluster create`: estado com `lastPhase: failed`, `lastStage`, `lastError`.
4. Manifesto alterado face ao estado + cluster ainda listado: `CLUSTER_SPEC_MISMATCH`.

## Tasks / Subtasks

- [x] Estado local `src/core/state/*` (fingerprint SHA-256 do spec, `readState` / `writeState`)
- [x] `K3dRunner.listClusterNames()` + `STARFLEET_K3D_BIN` para testes/mocks
- [x] `convergeClusterUp` + integração em `runUp` (`upAction` created | unchanged)
- [x] `STARFLEET_WORKDIR` para diretório de estado (testes com CLI a correr na raiz do repo)
- [x] Testes `convergeUp.test.ts` + integração `config-cli` com mock k3d
- [x] README: `STARFLEET_WORKDIR`, `STARFLEET_K3D_BIN`

## Dev Agent Record

### File List

- `src/core/state/*`, `src/core/cluster/convergeUp.ts`, `src/core/cluster/k3dRunner.ts`
- `src/core/commandHandlers.ts`, `src/commands/up.ts`
- `src/core/cluster/convergeUp.test.ts`
- `test/fixtures/mock-k3d.sh`, `test/integration/config-cli.test.ts`
- `README.md`
