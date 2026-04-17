# Story 2.5: Recuperação básica pós-falha de `up` (reexecução segura)

Status: done

## Story

As a utilizador,
I want voltar a tentar `up` após uma falha sem corromper o estado,
So that recupero o ambiente quando possível (FR5, NFR7).

## Acceptance Criteria

1. Nova execução de `up` reconcilia ou recria de forma documentada (sem estado “meio aplicado” silencioso).
2. Logs mostram transição de estágios e resultado final (sucesso ou falha classificada).

## Tasks / Subtasks

- [x] Estágio `recover` + metadados (`retry-cluster-create`, último erro) antes de repetir `cluster-create`
- [x] Convergência quando cluster existe mas estado tinha `failed` → `reconcile-after-failure`, `action: recovered`
- [x] Falha em `cluster-create`: gravar `failed` para qualquer erro (incl. não-`StarfleetError` com `INTERNAL_ERROR`)
- [x] `upAction` / JSON: `recovered` após sucesso pós-falha
- [x] Testes unitários (`FlakyCreateRunner` + estado `failed` com cluster presente)

## Dev Agent Record

### File List

- `src/core/cluster/convergeUp.ts`
- `src/core/cluster/convergeUp.test.ts`
- `src/core/commandHandlers.ts`
- `README.md`
