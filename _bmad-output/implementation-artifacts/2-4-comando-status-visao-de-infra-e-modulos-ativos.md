# Story 2.4: Comando `status` — visão de infra e módulos ativos

Status: done

## Story

As a utilizador,
I want `starfleet status` com resumo legível e opcional JSON,
So that sei se o LAB e os módulos reportados estão operacionais (FR3, NFR3).

## Acceptance Criteria

1. Com cluster ativo: saúde do cluster (nome, versão k3d quando disponível) e módulos ativos conforme estado persistido.
2. Sem cluster: indicação clara de “sem cluster” com sugestão para `starfleet up`.
3. `--output json` segue o envelope do Épico 1.

## Tasks / Subtasks

- [x] `collectLabStatus` + resumo (`summary`) e `statusData` para JSON
- [x] `K3dRunner.getK3dVersionLine`
- [x] Estado: `modules.active` opcional; validação em `stateFile`
- [x] `runStatus` / `status` comando com `data` = `message` + `statusData`
- [x] Testes `labStatus.test.ts` e integração `config-cli.test.ts`

## Dev Agent Record

### File List

- `src/core/cluster/labStatus.ts`, `labStatus.test.ts`, `k3dRunner.ts`, `index.ts`
- `src/core/state/stateTypes.ts`, `stateFile.ts`
- `src/core/commandHandlers.ts`, `src/commands/status.ts`
- `test/integration/config-cli.test.ts`
