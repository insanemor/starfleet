# Story 1.6: Completions zsh para comandos e argumentos MVP

Status: done

## Story

As a utilizador zsh,
I want completions para o conjunto MVP de comandos e padrões de argumentos,
So that descubro a superfície da CLI rapidamente (FR30).

## Acceptance Criteria

1. Instruções de instalação do completion no README.
2. Com Tab, listar comandos MVP + `autocomplete` e flags comuns conforme implementado.
3. Completion não gera erros fatais em fluxos normais (script zsh / refresh-cache).

## Tasks / Subtasks

- [x] Dependência `@oclif/plugin-autocomplete` e registo em `package.json` → `oclif.plugins`
- [x] Verificar `starfleet autocomplete` / `autocomplete script zsh` após build
- [x] README: passos zsh e nota sobre `./bin/dev.js` vs `starfleet`
- [x] Testes de integração mínimos (`autocomplete` no help, `script zsh`, `--refresh-cache`)

## Dev Notes

- O plugin pode emitir avisos de deprecação do Node ou `UnparsedCommand` internos ao gerar cache; exit code mantém-se 0. Evoluções futuras podem atualizar o plugin.

## Dev Agent Record

### File List

- `package.json`
- `README.md`
- `test/integration/autocomplete-zsh.test.ts`
