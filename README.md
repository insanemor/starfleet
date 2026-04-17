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

Variáveis úteis (testes / automação):

- `STARFLEET_WORKDIR` — diretório onde gravar `.starfleet/` e resolver paths relativos (por omissão é o diretório de trabalho atual).
- `STARFLEET_K3D_BIN` — caminho alternativo ao binário `k3d` (ex.: mock em testes).
- `STARFLEET_MODULE_HOOKS_DRY_RUN` — se `1` / `true`, não executa comandos dos hooks `install`/`uninstall` (útil em CI).

## Comandos MVP

- `up` (opções: `--profile <nome>` para aplicar `profiles.<nome>.modules` após o cluster)
- `down`
- `status`
- `list`
- `add <module>` (opção `--upgrade` para reexecutar hooks e atualizar pinagem)
- `remove <module>`
- `recover` — recuperação guiada após falhas em `up`/`add` com rotas `retry`, `rollback` e `diagnose`
- `catalog-check` — gate para módulos com `promoted: true` (exige `README.md` e `tests/smoke` no diretório do módulo)
- `validate` — smoke (`tests/smoke/smoke.yaml`), integração opcional (`tests/integration/run.sh`), checklist manual (`validation-checklist.yaml` com `starfleet validate --manual`), relatório em `.starfleet/validation-report.json`; `--confirm` regista confirmação no estado (em CI não interativa use `--confirm --yes`)

Script npm: `npm run catalog:check` (equivale a `catalog-check`).

`list` lê pastas `modules/<nome>/` no diretório de trabalho (`STARFLEET_WORKDIR` ou cwd), carrega `module.yaml` com `apiVersion: starfleet/module/v1` e mostra nome, descrição, dependências e versão sugerida. Entradas inválidas (YAML/schema ou `module.yaml` em falta) aparecem na lista marcadas como **inválido**, com mensagem e dica — não são omitidas silenciosamente.

`add` resolve dependências (ordem topológica estável), executa `hooks.install` no diretório do módulo e grava `modules.active` + `modules.pinned` em `.starfleet/state.json`. Requer cluster já criado (`starfleet up`). `remove` executa `hooks.uninstall` e bloqueia se outro módulo ativo declarar dependência sobre o alvo.

Perfis: em `starfleet.yaml`, secção opcional `profiles.<nome>.modules: [...]`; `starfleet up --profile <nome>` aplica esses módulos após o cluster (mesma resolução de dependências).

`status` mostra um resumo legível do lab (nome no manifesto, fase em `.starfleet/state.json`, presença do cluster no k3d, versão da ferramenta k3d, módulos ativos quando existirem no estado) e sugere `starfleet up` quando não há cluster. Com `--output json`, o mesmo conteúdo aparece no campo `data` do envelope estável (ver secção abaixo), incluindo `message` e campos estruturados (`summary`, `clusterName`, etc.).

`up` pode voltar a ser executado com segurança após uma falha: o estado em `.starfleet/state.json` regista `failed` com o último erro; uma nova execução regista nos logs o estágio `recover` (retry) ou reconcilia o cluster já existente com o manifesto. Em JSON, o campo `action` pode ser `recovered` quando a operação conclui após estado prévio de falha.

Antes de criar um cluster novo, o `up` corre um **preflight** (`up: stage=preflight` nos logs): verifica se a porta da API no host (`cluster.kubeApiPort` ou predefinida) está disponível para bind; se estiver ocupada, falha com código `CLUSTER_PORT_UNAVAILABLE` sem invocar `k3d cluster create`. Os ramos em que o cluster já existe (convergência / no-op) não passam por este passo.

`down` remove o cluster k3d com o nome do manifesto (se existir) e marca o estado em `.starfleet/state.json` como `removed`. Se o cluster já não existir, o comando termina com sucesso (no-op) e o estado é atualizado na mesma.

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

## Taxonomia de falhas externas (Epic 5.1)

Para falhas durante `up` e `add` (invocações de `k3d`, `kubectl` e hooks), o campo `error.code` e a linha `code:` usam categorias estáveis:

| `code` | Categoria | Exemplo de origem |
| --- | --- | --- |
| `EXTERNAL_BINARY_MISSING` | Binário em falta | `k3d`/`kubectl` não instalado no PATH |
| `EXTERNAL_TIMEOUT` | Timeout | comando externo excede tempo limite |
| `EXTERNAL_NETWORK` | Rede | conexão recusada/indisponível ao daemon/API |
| `EXTERNAL_CONFIG` | Configuração | kubeconfig/contexto/flags/configuração inválida |
| `EXTERNAL_COMMAND_FAILED` | Falha genérica de comando | comando terminou com erro não classificado |

O `hint` permanece específico por superfície (`k3d`, `kubectl` ou `module-hook`) para orientar a próxima ação com menor ambiguidade.

## Recuperação guiada (`recover`)

Quando uma operação `up` ou `add` falha, o estado local guarda contexto de recuperação:

- `retry`: reexecuta a mesma operação com logs de tentativa numerados (`recover: retry attempt #N`).
- `rollback`: restaura o snapshot anterior quando disponível.
- `diagnose`: mostra diagnóstico sem alterar estado.

Exemplos:

```bash
./bin/dev.js recover
./bin/dev.js recover --route retry
./bin/dev.js recover --route rollback --no-validate
./bin/dev.js recover --route retry --validate --confirm --yes
```

Pós-recuperação:

- Por omissão, `recover` tenta revalidar (`validate` smoke) após `retry`.
- Se a validação falhar, o ambiente **não** é marcado como saudável e o comando sugere nova rota (`diagnose`, depois `retry`/`rollback`).

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

Após configurar o shell, o Tab completa os comandos MVP (`up`, `down`, `status`, `list`, `add`, `remove`, `catalog-check`, `validate`) e o meta-comando `autocomplete`, bem como flags partilhadas (`--output`, `--verbose`, `--yes`, …). O primeiro uso pode demorar um instante enquanto o cache é construído.

## Qualidade

```bash
npm run test
```
