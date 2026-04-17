# Story 3.3: Comando `add` — hooks e pinagem

Status: done

Implementação: `applyAddModule` em `moduleApply.ts` — resolve deps, `hooks.install`, atualiza `modules.active` e `modules.pinned`; logs `add: stage=plan|apply|upgrade`. `add --upgrade` reexecuta install. Requer estado de cluster válido.
