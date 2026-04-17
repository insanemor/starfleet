# Story 2.1: Runner k3d encapsulado no `src/core/cluster`

Status: done

## Story

As a utilizador do Starfleet,
I want chamadas a `k3d` isoladas no core (não nos commands),
So that posso testar e substituir o runner sem duplicar lógica (requisito adicional de arquitetura).

## Acceptance Criteria

1. Criação de cluster via core com parâmetros derivados de `starfleet.yaml` usa argv explícitos para `k3d cluster create` (nome, API port, servers/agents, memória opcional).
2. Log `info` antes do subprocesso com metadados do pedido.
3. Falhas do subprocesso mapeadas para `StarfleetError` com `code` `CLUSTER_K3D_FAILED` e exit domínio cluster (`10`).

## Tasks / Subtasks

- [x] Estender schema `cluster.*` opcional (`kubeApiPort`, `servers`, `agents`, `serversMemory`, `agentsMemory`)
- [x] `mapConfigToK3dSpec`, `buildK3dClusterCreateArgs`, `K3dRunner`, `createLabCluster`
- [x] Logger `logInfo` em `src/core/logging/logger.ts`
- [x] Testes unitários (`k3dArgs`, `K3dRunner` com `test/fixtures/mock-k3d.sh`)
- [x] `starfleet.yaml.example` atualizado com campos opcionais comentados

## Dev Notes

- O comando `up` passará a invocar `createLabCluster` na Story 2.2; aqui fica apenas a API de core testável.

## Dev Agent Record

### File List

- `src/core/cluster/k3dTypes.ts`, `k3dArgs.ts`, `k3dRunner.ts`, `createCluster.ts`, `index.ts`
- `src/core/cluster/k3dArgs.test.ts`, `k3dRunner.test.ts`
- `src/core/logging/logger.ts`, `index.ts`
- `src/core/config/schema.ts`
- `starfleet.yaml.example`
- `test/fixtures/mock-k3d.sh`
