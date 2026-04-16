# Starfleet CLI

Scaffold inicial do CLI Starfleet baseado em `oclif` + TypeScript.

## Setup

```bash
npm install
```

## Desenvolvimento

```bash
./bin/dev.js --help
./bin/dev.js up
./bin/dev.js add observability-core
```

## Comandos MVP

- `up`
- `down`
- `status`
- `list`
- `add <module>`

## Saída JSON (`--output json` / `-o json`)

Contrato estável (camelCase) — uma linha JSON no **stdout** por execução; campos de topo não devem mudar em releases patch/minor sem nota de compatibilidade.

| Campo | Significado |
| --- | --- |
| `ok` | `true` em sucesso, `false` em falha |
| `command` | Nome lógico do comando (`up`, `down`, …) |
| `data` | Payload em sucesso (`null` em falha) |
| `error` | `{ code, message, hint, details? }` em falha (`null` em sucesso) |
| `timestamp` | Instantâneo em ISO-8601 UTC |

Em falhas, o exit code segue a mesma matriz que em modo humano (ex.: `2` para manifesto inválido, `1` para erro interno genérico).

## Modo não interativo (CI / scripts)

- **Flag:** `--yes` / `-y` — não usa prompts; operações que exigem input explícito falham com erro classificado (tipicamente exit `2`).
- **Ambiente:** `STARFLEET_NON_INTERACTIVE=1` (ou `true` / `yes`, case-insensitive) — mesmo efeito que `--yes` para deteção de modo não interativo.

Exemplo: em modo não interativo, `add` exige o argumento do módulo na linha de comando; caso contrário o processo termina com `INPUT_REQUIRED` e não fica à espera de input.

## Completions (zsh)

O Starfleet inclui o plugin oficial **`@oclif/plugin-autocomplete`**. Com o projeto compilado (`npm run build`):

1. Gerar/atualizar o cache e ver instruções para o zsh:
   ```bash
   ./bin/dev.js autocomplete zsh
   ```
2. Obter o fragmento a colar no `~/.zshrc` (ou executar o `printf`/`source` que o comando mostrar):
   ```bash
   ./bin/dev.js autocomplete script zsh
   ```

Se o binário `starfleet` estiver no `PATH` (instalação global ou `npm link`), substitua `./bin/dev.js` por `starfleet`.

Após configurar o shell, o Tab completa os comandos MVP (`up`, `down`, `status`, `list`, `add`) e o meta-comando `autocomplete`, bem como flags partilhadas (`--output`, `--verbose`, `--yes`, …). O primeiro uso pode demorar um instante enquanto o cache é construído.

## Qualidade

```bash
npm run test
```
