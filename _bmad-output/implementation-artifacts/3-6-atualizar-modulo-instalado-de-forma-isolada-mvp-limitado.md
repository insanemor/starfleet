# Story 3.6: Atualizar módulo (`add --upgrade`)

Status: done

Implementação: flag `--upgrade` em `add`; reexecuta apenas hooks install do módulo alvo e atualiza pinagem (rollback de estado em falha parcial: hooks falham antes do write — upgrade escreve após hooks com sucesso).
