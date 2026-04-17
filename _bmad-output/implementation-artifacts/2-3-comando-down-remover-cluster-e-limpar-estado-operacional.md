# Story 2.3: Comando `down` — remover cluster e limpar estado operacional

Status: done

## Story

As a utilizador,
I want `starfleet down` para destruir o cluster e limpar referências locais,
So that libero recursos da máquina (FR2).

## Acceptance Criteria

1. Cluster k3d removido quando existe (`k3d cluster delete <nome>`).
2. Se o cluster já não existir no k3d — no-op seguro (sem falha) e mensagem explícita.
3. `.starfleet/state.json` atualizado com `lastPhase: removed` e rasto do último spec (nome + fingerprint) sem apagar ficheiros fora de `.starfleet/`.

## Tasks / Subtasks

- [x] `K3dRunner.clusterDelete`
- [x] `tearDownLabCluster` + estágios `down: stage=...`
- [x] `runDown` com mesmo `STARFLEET_WORKDIR` que `up`
- [x] `downAction` no resultado / JSON (`deleted` | `already-absent`)
- [x] `ClusterPhase` inclui `removed`
- [x] Testes `tearDown.test.ts`; mock-k3d com `cluster delete`

## Dev Agent Record

### File List

- `src/core/cluster/k3dRunner.ts`, `tearDown.ts`, `tearDown.test.ts`, `index.ts`
- `src/core/commandHandlers.ts`, `src/commands/down.ts`
- `src/core/state/stateTypes.ts`
- `test/fixtures/mock-k3d.sh`
