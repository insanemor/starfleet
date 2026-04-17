---
stepsCompleted:
  - step-01-requirements-extraction
  - step-02-epic-design-approved
  - step-03-stories-complete
  - step-04-final-validation
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
epicsStatus: approved
storiesStatus: ready_for_development
workflowStatus: complete
validatedAt: '2026-04-16'
validationSummary:
  storyCount: 35
  frCoverage: FR1-FR38 mapeados no inventário e cobertos pelos épicos 1-7
  starterTemplateCheck: Story 1.1 alinha com o starter oclif (TypeScript) da Arquitetura
  uxDrCoverage: UX-DR1-DR3 referenciados nas histórias 1.1, 1.3, 2.2 e fluxos de erro/recuperação
  crossEpicNote: A história 5.4 assume capacidades de validação do Épico 4 — implementar o Épico 4 antes ou em paralelo ao fecho do Épico 5
---

# starfleet - Epic Breakdown

## Overview

Este documento decompõe requisitos do PRD e da Arquitetura em épicos orientados a valor de utilizador e, nas fases seguintes, em histórias implementáveis.

## Requirements Inventory

### Functional Requirements

```
FR1: O utilizador pode inicializar o ambiente de LAB local a partir de configuração declarativa.
FR2: O utilizador pode encerrar e limpar o ambiente de LAB quando necessário.
FR3: O utilizador pode inspecionar o ambiente atual e o estado dos módulos ativos.
FR4: O utilizador pode voltar a executar o bring-up do ambiente e obter resultados operacionais consistentes.
FR5: O utilizador pode recuperar o ambiente para estado operacional após falhas de execução.
FR6: O utilizador pode listar módulos/ferramentas disponíveis para instalação no LAB.
FR7: O utilizador pode adicionar um módulo ao ambiente ativo.
FR8: O sistema resolve dependências obrigatórias de módulos antes da ativação.
FR9: O sistema preserva pinagem de versão por módulo para reprodutibilidade.
FR10: O utilizador pode decidir manter ou remover um módulo após validação.
FR11: O sistema pode bloquear promoção de módulo quando critérios mínimos de qualidade não são cumpridos.
FR12: O utilizador pode atualizar um módulo instalado de forma independente do resto do ambiente.
FR13: O utilizador pode ativar perfis predefinidos de módulos compostos por capacidades relacionadas.
FR14: O sistema resolve e aplica dependências de perfil automaticamente antes da ativação do perfil.
FR15: O utilizador pode executar validação funcional para além de verificações básicas de disponibilidade.
FR16: O sistema pode fornecer validação assistida por UI para módulos com frontends.
FR17: O utilizador pode confirmar explicitamente se a validação de funcionalidade/módulo é satisfatória.
FR18: O sistema pode fornecer fallback de validação manual baseada em checklist quando a validação assistida não está disponível.
FR19: O utilizador pode revalidar o ambiente após alterações para confirmar ausência de regressão funcional.
FR20: O utilizador pode receber feedback de falha classificado com causa provável e próximo passo recomendado.
FR21: O utilizador pode escolher uma rota de recuperação (retry rápido, rollback seguro, diagnóstico guiado).
FR22: O sistema pode guiar o fluxo de recuperação até o estado funcional ser restaurado.
FR23: O utilizador pode confirmar conclusão da recuperação com validação funcional renovada.
FR24: O utilizador pode operar o produto através de fluxos interativos na CLI.
FR25: O utilizador pode executar comandos core em modo não interativo para automação.
FR26: O sistema pode produzir saída legível por humanos para operação interativa.
FR27: O sistema pode produzir saída JSON estruturada para integração e fluxos baseados em ficheiros.
FR28: O utilizador pode configurir e gerir definições do ambiente através de `starfleet.yaml`.
FR29: O utilizador pode receber feedback de erros acionável na CLI em fluxos interativos e scriptados.
FR30: O utilizador pode usar completions zsh para descoberta de comandos e argumentos.
FR31: O utilizador pode gerar artefactos de evidência ao concluir labs/experimentos.
FR32: Os artefactos de evidência podem capturar contexto do experimento e resultados observados.
FR33: O utilizador pode usar evidências geradas para demonstrar aprendizagem e progressão de portfólio.
FR34: O utilizador pode iterar funcionalidades do Starfleet mantendo rastreabilidade de validação.
FR35: O mantenedor pode preparar novos módulos alinhados com os padrões mínimos do produto.
FR36: O mantenedor pode submeter atualizações de módulo preservando compatibilidade do ecossistema.
FR37: O sistema pode rejeitar contribuições que não satisfazem critérios de aceitação funcional.
FR38: O mantenedor pode validar que contribuições não comprometem fluxos core do MVP.
```

### NonFunctional Requirements

```
NFR1: O sistema deve fornecer feedback contínuo na CLI durante operações de longa duração (up, add, update), evitando estados silenciosos.
NFR2: O sistema deve expor progresso de execução por estágios nomeados (ex.: preparação, resolução de dependências, apply, validação).
NFR3: O sistema deve fornecer estado operacional em tempo real compreensível por operadores humanos.
NFR4: O sistema deve fornecer logs interativos que indiquem claramente o passo atual, transições de sucesso e transições de falha.
NFR5: O sistema deve sinalizar explicitamente mudanças de estado de execução (em execução, conclusão com sucesso, conclusão com falha).
NFR6: O fluxo primário (up → status → validate) deve atingir taxa mínima de sucesso de 90% nas condições de uso MVP esperadas.
NFR7: O sistema deve suportar reexecução após falhas sem comprometer a consistência esperada do ambiente.
NFR8: O sistema deve fornecer caminhos de recuperação explícitos para falhas de dependência, módulo e validação.
NFR9: O sistema deve manter comportamento previsível em execuções repetidas do mesmo ambiente configurado.
NFR10: O sistema deve fornecer saídas JSON estruturadas para automação e uso em pipelines.
NFR11: Os contratos de saída JSON devem permanecer estáveis em releases minor e patch.
NFR12: Alterações incompatíveis com versões anteriores nos contratos de saída JSON devem exigir major version da CLI.
NFR13: A semântica de estado nas saídas estruturadas deve permanecer consistente para consumidores de automação.
NFR14: O sistema deve suportar crescimento incremental do catálogo de módulos sem quebrar fluxos core do MVP.
NFR15: O sistema deve preservar operação previsível à medida que novas funcionalidades/ferramentas são adicionadas ao longo do tempo.
NFR16: Os fluxos de expansão de módulos devem manter governance e critérios de qualidade definidos pelo produto.
```

### Additional Requirements

```
- Baseline da CLI: TypeScript + oclif; primeira prioridade de implementação: `oclif generate starfleet` e esqueleto dos comandos MVP.
- Armazenamento file-first: `starfleet.yaml` + estado operacional em diretório dedicado (ex.: `.starfleet/`); `.env` local gitignored para segredos.
- Validação de config/estado ao carregar na fronteira da CLI (schema validation).
- Modelo de erro: taxonomia `{ code, message, hint, details }` + exit codes determinísticos (0 sucesso, 1 genérico, 2 uso inválido, 10+ por domínio).
- Saída: modo humano por omissão; `--output json` com envelope `{ ok, command, data, error }` e campos em camelCase; datas ISO-8601 UTC.
- Separação estrita: `src/commands/*` finos; lógica em `src/core/*`; IaC em `modules/<nome>/` sem misturar domínio da CLI em templates Helm/YAML.
- Execução local-first com k3d; integrações externas via subprocessos (k3d, kubectl, helm) encapsulados no core.
- Versões de referência documentadas (Node LTS, k3d, kubectl, Helm) e pinagem de toolchain (engines, lockfile).
- Logging estruturado com níveis debug|info|warn|error e opção JSON; feedback por estágios em comandos longos.
- Testes: unitários co-localizados `*.test.ts`; integração em `test/integration/` para binário/k3d/subprocessos.
- MVP sem API HTTP remota, sem auth/RBAC interno; completitions zsh para o conjunto MVP de comandos.
- Estrutura alvo: módulo `observability-core` e lab `observability-101` conforme árvore na Arquitetura.
- Gaps a endereçar na implementação: decompor validação assistida por UI (pré-requisitos, falha segura, artefactos); formato mínimo de evidência de portfólio (manifest, paths, JSON).
```

### UX Design Requirements

```
Nenhum ficheiro "UX Design" dedicado foi encontrado em planning-artifacts. A Arquitetura define frontend do produto Starfleet como N/A no MVP; as UIs alvo são ferramentas externas (ex.: Grafana) para validação.

UX-DR1: A CLI deve priorizar mensagens concisas e informativas em modo interativo para suportar ciclos rápidos de aprendizagem (alinhado ao PRD tipo CLI).
UX-DR2: Em falhas, a apresentação humana deve expor causa provável e próximo passo acionável, consistente com a taxonomia de erros (FR20, FR29).
UX-DR3: O operador deve conseguir seguir progresso por estágios nomeados e logs claros em operações longas (NFR1–NFR5), sem perder contexto do passo atual.
```

### FR Coverage Map

```
FR1: Épico 2 - Inicializar LAB a partir de configuração declarativa
FR2: Épico 2 - Encerrar e limpar o ambiente
FR3: Épico 2 - Inspecionar ambiente e estado dos módulos ativos
FR4: Épico 2 - Reexecutar bring-up com resultados consistentes (idempotência)
FR5: Épico 2 - Recuperar ambiente após falhas de execução
FR6: Épico 3 - Listar módulos disponíveis
FR7: Épico 3 - Adicionar módulo ao ambiente ativo
FR8: Épico 3 - Resolver dependências obrigatórias antes da ativação
FR9: Épico 3 - Preservar pinagem de versão por módulo
FR10: Épico 3 - Manter ou remover módulo após validação
FR11: Épico 3 - Bloquear promoção quando qualidade mínima falha
FR12: Épico 3 - Atualizar módulo instalado de forma independente
FR13: Épico 3 - Ativar perfis predefinidos de módulos
FR14: Épico 3 - Resolver e aplicar dependências de perfil
FR15: Épico 4 - Validação funcional além de disponibilidade básica
FR16: Épico 4 - Validação assistida por UI quando há frontend
FR17: Épico 4 - Confirmação explícita de satisfação da validação
FR18: Épico 4 - Fallback manual por checklist
FR19: Épico 4 - Revalidação após alterações (anti-regressão)
FR20: Épico 5 - Falhas classificadas com causa e próximo passo
FR21: Épico 5 - Escolha de rota de recuperação (retry/rollback/diagnóstico)
FR22: Épico 5 - Fluxo de recuperação guiado até estado funcional
FR23: Épico 5 - Confirmação de recuperação com validação renovada
FR24: Épico 1 - Fluxos interativos na CLI
FR25: Épico 1 - Modo não interativo para automação
FR26: Épico 1 - Saída legível para humanos
FR27: Épico 1 - Saída JSON estruturada
FR28: Épico 1 - Configuração via `starfleet.yaml`
FR29: Épico 1 - Erros acionáveis em fluxos interativos e scriptados
FR30: Épico 1 - Completions zsh
FR31: Épico 6 - Gerar artefactos de evidência ao concluir labs
FR32: Épico 6 - Evidência com contexto e resultados observados
FR33: Épico 6 - Usar evidências para portfólio e aprendizagem
FR34: Épico 6 - Iterar o produto com rastreabilidade de validação
FR35: Épico 7 - Preparar novos módulos aos padrões mínimos
FR36: Épico 7 - Submeter atualizações preservando compatibilidade
FR37: Épico 7 - Rejeitar contribuições fora dos critérios funcionais
FR38: Épico 7 - Garantir que contribuições não quebram fluxos core do MVP
```

## Epic List

### Épico 1: CLI Starfleet fiável (configuração, saída e automação)

O utilizador opera o Starfleet com `starfleet.yaml` validado, mensagens e erros acionáveis, saída JSON estável para pipelines e completions zsh, em modo interativo ou scriptado.

**FRs cobertos:** FR24, FR25, FR26, FR27, FR28, FR29, FR30

### Épico 2: Ciclo de vida do LAB local (k3d)

O utilizador cria, inspeciona, reproduz e recupera o cluster LAB local de forma idempotente e previsível.

**FRs cobertos:** FR1, FR2, FR3, FR4, FR5

### Épico 3: Catálogo, dependências e ciclo de vida de módulos

O utilizador descobre módulos, adiciona-os com dependências resolvidas e versões pinadas, usa perfis e opera atualizações/remoções sem degradar o ecossistema.

**FRs cobertos:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14

### Épico 4: Validação funcional e confiança no que está instalado

O utilizador valida integrações reais (smoke/integration), com opção de validação assistida por UI quando aplicável, checklist manual de fallback e revalidação anti-regressão.

**FRs cobertos:** FR15, FR16, FR17, FR18, FR19

### Épico 5: Recuperação guiada quando algo corre mal

Perante falhas, o utilizador recebe diagnóstico classificado, escolhe uma estratégia de recuperação e é guiado até restaurar o estado funcional com validação renovada.

**FRs cobertos:** FR20, FR21, FR22, FR23

### Épico 6: Evidências de portfólio e resultados de aprendizagem

Ao concluir labs ou experimentos, o utilizador gera artefactos reutilizáveis que documentam o que correu, o que foi observado e suporta iteração futura com rastreabilidade.

**FRs cobertos:** FR31, FR32, FR33, FR34

### Épico 7: Caminho do mantenedor e barreiras de qualidade

Mantenedores preparam e submetem módulos alinhados ao contrato do produto; o sistema aplica gates que impedem regressões e contribuições fora dos critérios.

**FRs cobertos:** FR35, FR36, FR37, FR38

## Epic 1: CLI Starfleet fiável (configuração, saída e automação)

O utilizador opera o Starfleet com `starfleet.yaml` validado, mensagens e erros acionáveis, saída JSON estável para pipelines e completions zsh, em modo interativo ou scriptado.

### Story 1.1: Scaffolding oclif e esqueleto dos comandos MVP

As a engenheiro DevOps/SRE,
I want um projeto oclif TypeScript com os comandos `up`, `down`, `status`, `list` e `add` como adaptadores finos,
So that tenho uma base alinhada à Arquitetura (commands → core) para evoluir sem reestruturar tudo.

**Acceptance Criteria:**

**Given** repositório sem código da CLI Starfleet
**When** executo o fluxo documentado (`oclif generate` / equivalente versionado no repo) e instalo dependências
**Then** `./bin/dev.js --help` lista os cinco comandos MVP e cada comando delega para `src/core/` (sem lógica pesada em `commands/`)
**And** mensagens de ajuda são concisas e informativas (UX-DR1)

### Story 1.2: Carregar e validar `starfleet.yaml` na fronteira da CLI

As a utilizador do Starfleet,
I want que a CLI valide o ficheiro de configuração ao arranque de comandos que precisam dele,
So that falhas de configuração são imediatas com remediação clara.

**Acceptance Criteria:**

**Given** um `starfleet.yaml` inválido (schema/campos obrigatórios)
**When** executo um comando que requer config (ex.: `up`)
**Then** o processo termina com exit code `2` (uso/config inválido) e erro estruturado com `code`, `message`, `hint` e `details` opcionais
**And** existe `starfleet.yaml.example` na raiz documentando campos mínimos MVP

### Story 1.3: Modelo de erro `StarfleetError`, exit codes e renderização humana

As a utilizador em modo interativo,
I want erros com taxonomia estável e exit codes determinísticos,
So that integro scripts e entendo a causa e o próximo passo (UX-DR2).

**Acceptance Criteria:**

**Given** uma falha simulada no core (ex.: binário externo em falta)
**When** o comando propaga o erro até à camada de comando
**Then** em modo humano vejo `message` curta, `hint` acionável e `code` estável; o exit code segue a matriz (0/1/2/10+ por domínio acordado)
**And** erros internos não vazam stack traces verbosos por omissão em modo humano (opcional `--verbose`)

### Story 1.4: Modo de saída humano e `--output json` com envelope estável

As a operador e como integrador de automação,
I want alternar entre saída legível e JSON com contrato `{ ok, command, data, error }` em camelCase,
So that consigo usar o Starfleet em pipelines sem quebrar parsers (FR26, FR27, NFR10–NFR13).

**Acceptance Criteria:**

**Given** qualquer um dos comandos MVP implementados neste épico
**When** executo com `--output json` e sucesso
**Then** o stdout contém JSON válido com `ok: true`, `command` preenchido, `data` tipado por comando e `error: null`
**When** executo com `--output json` e falha
**Then** `ok: false` e `error` com `{ code, message, hint, details }` em camelCase; timestamps em ISO-8601 UTC quando aplicável
**And** os campos estáveis documentados no README não mudam sem política de versão (minor/patch estáveis)

### Story 1.5: Modo não interativo e comportamento determinístico

As a utilizador de CI ou scripts,
I want executar comandos sem prompts bloqueantes,
So that automação é fiável (FR25).

**Acceptance Criteria:**

**Given** variável de ambiente ou flag documentada para modo não interativo (ex.: `STARFLEET_NON_INTERACTIVE=1` ou `--yes`)
**When** executo comandos que poderiam pedir confirmação
**Then** não há prompts interativos pendurados; falhas por falta de input são classificadas e terminam com exit code adequado
**And** o comportamento está documentado no README do pacote

### Story 1.6: Completions zsh para comandos e argumentos MVP

As a utilizador zsh,
I want completions para o conjunto MVP de comandos e padrões de argumentos,
So that descubro a superfície da CLI rapidamente (FR30).

**Acceptance Criteria:**

**Given** instruções de instalação do completion no README
**When** carrego o script de completion no zsh
**Then** tab-complete lista `up`, `down`, `status`, `list`, `add` e flags comuns (`--output`, etc.) conforme implementado
**And** o completion não gera erros em comandos parciais

## Epic 2: Ciclo de vida do LAB local (k3d)

O utilizador cria, inspeciona, reproduz e recupera o cluster LAB local de forma idempotente e previsível.

### Story 2.1: Runner k3d encapsulado no `src/core/cluster`

As a utilizador do Starfleet,
I want chamadas a `k3d` isoladas no core (não nos commands),
So that posso testar e substituir o runner sem duplicar lógica (requisito adicional de arquitetura).

**Acceptance Criteria:**

**Given** `k3d` disponível no PATH
**When** o core invoca criação de cluster com parâmetros derivados de `starfleet.yaml`
**Then** o subprocesso usa argumentos explícitos (nome do cluster, portas base, recursos) registados em log `info`
**And** erros do subprocesso são mapeados para `StarfleetError` com `code` do domínio cluster (faixa 10+)

### Story 2.2: Comando `up` — criar ou convergir cluster de forma idempotente

As a utilizador,
I want `starfleet up` para criar ou alinhar o cluster k3d ao estado desejado,
So that repetir `up` não introduz drift injustificado (FR1, FR4, NFR7, NFR9).

**Acceptance Criteria:**

**Given** cluster inexistente
**When** executo `starfleet up`
**Then** o cluster é criado e o estado persistido em `.starfleet/` (ou diretório acordado) inclui identificador e versão de schema de estado
**Given** cluster já existente e config inalterada
**When** executo `starfleet up` novamente
**Then** a operação conclui sem recriar recursos desnecessários (convergência) e emite estágios nomeados no log (NFR1–NFR5, UX-DR3)
**When** falha a meio
**Then** o estado de execução reflete falha e o utilizador vê estágio onde parou

### Story 2.3: Comando `down` — remover cluster e limpar estado operacional

As a utilizador,
I want `starfleet down` para destruir o cluster e limpar referências locais,
So that libero recursos da máquina (FR2).

**Acceptance Criteria:**

**Given** cluster existente gerido pelo Starfleet
**When** executo `starfleet down`
**Then** o cluster k3d é removido ou o comando documenta no-op seguro se já não existir
**And** ficheiros de estado em `.starfleet/` são atualizados para refletir “sem cluster ativo” sem apagar evidências de utilizador fora desse escopo

### Story 2.4: Comando `status` — visão de infra e módulos ativos

As a utilizador,
I want `starfleet status` com resumo legível e opcional JSON,
So that sei se o LAB e os módulos reportados estão operacionais (FR3, NFR3).

**Acceptance Criteria:**

**Given** cluster ativo
**When** executo `starfleet status`
**Then** vejo saúde do cluster (nome, versão k3d se aplicável) e lista de módulos ativos conforme estado persistido
**Given** sem cluster
**When** executo `starfleet status`
**Then** o resultado indica claramente “sem cluster” com `hint` para `starfleet up`
**And** `--output json` segue o envelope do Épico 1

### Story 2.5: Recuperação básica pós-falha de `up` (reexecução segura)

As a utilizador,
I want voltar a tentar `up` após uma falha sem corromper o estado,
So that recupero o ambiente quando possível (FR5, NFR7).

**Acceptance Criteria:**

**Given** uma execução anterior de `up` falhou após criar artefactos parciais
**When** executo `starfleet up` novamente
**Then** o plano de execução reconcilia ou recria componentes de forma documentada (sem estado “meio aplicado” silencioso)
**And** logs mostram transição de estágios e resultado final (sucesso ou falha classificada)

### Story 2.6: Preflight do `up` — validar porta e conflitos antes de criar cluster

As a utilizador,
I want que `starfleet up` detete cedo se a porta da API ou o ambiente impedem criar o cluster,
So that não perco tempo com rollback do k3d nem mensagens opacas de Docker (FR4, FR20, FR29, NFR4).

**Acceptance Criteria:**

**Given** é necessário criar um cluster novo (caminho `cluster create`)
**When** a porta de host configurada para a API Kubernetes (`kubeApiPort` / default) já está ocupada ou o ambiente é incompatível conforme política definida na implementação
**Then** o comando falha **antes** de invocar `k3d cluster create`, com `StarfleetError` classificado, `hint` acionável (ex.: libertar porta, alterar `kubeApiPort`, remover cluster antigo) e log de estágio explícito (ex.: `up: stage=preflight`)
**And** modo humano e `--output json` seguem o envelope do Épico 1
**Given** o cluster já existe e o fluxo é apenas convergência / no-op
**Then** o preflight não altera o comportamento actual de convergência

_Rastreabilidade: proposta detalhada em `_bmad-output/github-issue-up-preflight-validation.md`._

## Epic 3: Catálogo, dependências e ciclo de vida de módulos

O utilizador descobre módulos, adiciona-os com dependências resolvidas e versões pinadas, usa perfis e opera atualizações/remoções sem degradar o ecossistema.

### Story 3.1: Catálogo de módulos a partir de `modules/*/module.yaml`

As a utilizador,
I want `starfleet list` a mostrar módulos disponíveis com metadados,
So that sei o que posso instalar (FR6).

**Acceptance Criteria:**

**Given** pastas sob `modules/` com `module.yaml` válido
**When** executo `starfleet list`
**Then** vejo nome, descrição curta e versão pinada sugerida de cada módulo
**When** um `module.yaml` está inválido
**Then** o módulo aparece como inválido com `hint` de correção ou é omitido com aviso explícito (política documentada)

### Story 3.2: Resolver dependências de módulos de forma determinística

As a utilizador,
I want que dependências obrigatórias sejam resolvidas antes de aplicar um módulo,
So that não fico com stacks incompletos (FR8).

**Acceptance Criteria:**

**Given** módulo A depende de B
**When** peço instalação de A
**Then** o plano de ativação inclui B antes de A (ordem topológica estável)
**Given** dependência circular
**When** tento resolver
**Then** falha com erro classificado e exit code adequado, sem aplicar alterações parciais

### Story 3.3: Comando `add <módulo>` — aplicar IaC e gravar pinagem no estado

As a utilizador,
I want `starfleet add observability-core` (ou outro módulo) a aplicar manifests/helm e gravar versões,
So that o ambiente é reprodutível (FR7, FR9).

**Acceptance Criteria:**

**Given** módulo com hooks `install` declarados em `module.yaml`
**When** executo `starfleet add <modulo>`
**Then** o Starfleet executa resolução de dependências, aplica o plano e atualiza o estado com versões pinadas por módulo
**And** a operação emite progresso por estágios (NFR1–NFR2)

### Story 3.4: Remover ou desativar módulo após validação

As a utilizador,
I want remover um módulo do ambiente ativo quando decido que não o quero,
So that o LAB fica alinhado às minhas necessidades (FR10).

**Acceptance Criteria:**

**Given** módulo instalado e hook `uninstall` definido
**When** executo o comando documentado de remoção (ex.: `starfleet remove` ou `add --remove`, a definir no desenho)
**Then** os recursos associados são removidos ou marcados como inativos conforme contrato do módulo e o estado persistido atualiza
**And** módulos dependentes são tratados com política explícita (bloquear remoção ou cascata documentada)

### Story 3.5: Gate de qualidade mínima antes de “promover” entrada de catálogo

As a curador do repositório,
I want critérios mínimos (tests, docs) verificáveis,
So that módulos incompletos não entram no catálogo canónico (FR11).

**Acceptance Criteria:**

**Given** um módulo sem pasta `tests/smoke` ou sem README exigido
**When** executo o verificador de catálogo (comando ou script npm documentado)
**Then** o módulo falha o gate com mensagem acionável
**When** o módulo cumpre o checklist
**Then** passa o gate e pode ser listado como “promovido” (metadado em `module.yaml` ou lista curada)

### Story 3.6: Atualizar módulo instalado de forma isolada (MVP limitado)

As a utilizador,
I want atualizar um único módulo sem reinstalar todo o LAB,
So that evoluo ferramentas com controlo (FR12, NFR14–NFR16).

**Acceptance Criteria:**

**Given** módulo instalado com versão pinada
**When** executo o fluxo MVP documentado (ex.: `starfleet add <modulo> --upgrade` ou comando dedicado se existir)
**Then** apenas esse módulo é reconciliado; outras pinagens permanecem salvo conflito documentado
**And** falhas revertem para a versão pinada anterior quando a política de rollback MVP estiver definida

### Story 3.7: Perfis de módulos em `starfleet.yaml`

As a utilizador,
I want ativar um perfil (conjunto de módulos) declarativamente,
So that subo stacks coerentes de uma vez (FR13, FR14).

**Acceptance Criteria:**

**Given** `starfleet.yaml` com secção `profiles` ou lista nomeada de módulos
**When** executo `up` ou comando de perfil documentado
**Then** todos os módulos do perfil entram no plano com dependências resolvidas na mesma ordem determinística do Story 3.2
**And** o estado gravado reflete cada módulo do perfil e respetivas versões

## Epic 4: Validação funcional e confiança no que está instalado

O utilizador valida integrações reais (smoke/integration), com opção de validação assistida por UI quando aplicável, checklist manual de fallback e revalidação anti-regressão.

### Story 4.1: Runner de smoke tests por módulo (pods/serviços UP)

As a utilizador,
I want smoke tests automáticos pós-`add`,
So that sei que pods e serviços essenciais estão prontos (FR15).

**Acceptance Criteria:**

**Given** módulo com `tests/smoke` definidos
**When** executo o passo de smoke após instalação
**Then** falhas reportam qual check falhou com `hint` (ex.: namespace, label, timeout)
**And** sucesso produz registo estruturado referenciável pelo estado

### Story 4.2: Testes de integração (fluxo app → métricas → dashboards)

As a utilizador,
I want validação de integração para o módulo estrela,
So that confirmo que dados fluem entre componentes (FR15).

**Acceptance Criteria:**

**Given** `observability-core` instalado
**When** executo a suíte `tests/integration` do módulo (via CLI ou script documentado)
**Then** pelo menos um cenário valida dados observáveis (ex.: métrica esperada ou health de endpoint interno)
**And** falhas distinguem timeouts de misconfiguration

### Story 4.3: Fluxo de validação assistida por UI (roteiro + extensão para agente)

As a utilizador,
I want um roteiro claro de validação UI e um gancho para agente/navegador quando disponível,
So that reduzo “deployed mas não funciona” (FR16).

**Acceptance Criteria:**

**Given** módulo com UI (Grafana)
**When** sigo o roteiro na documentação do módulo
**Then** consigo verificar visualmente os passos críticos listados
**And** existe secção “UI-assisted” descrevendo pré-requisitos, limitações e artefactos esperados (gap da Arquitetura endereçado)

### Story 4.4: Confirmação explícita de validação pelo utilizador

As a utilizador,
I want confirmar se a validação foi satisfatória,
So that o estado reflecte a minha decisão (FR17).

**Acceptance Criteria:**

**Given** validação concluída
**When** executo o passo de confirmação (flag `--confirm` ou prompt em modo interativo)
**Then** o estado ou relatório regista `validationStatus` com timestamp ISO-8601 UTC
**And** modo não interativo suporta confirmação apenas via flag (sem prompt)

### Story 4.5: Checklist manual de fallback

As a utilizador sem agente UI,
I want checklist YAML/Markdown gerado automaticamente,
So that ainda cumpro FR18 quando assistência não está disponível.

**Acceptance Criteria:**

**Given** módulo com `validation-checklist.md` ou equivalente
**When** executo `starfleet validate --manual` (nome final documentado)
**Then** recebo lista numerada de passos com campos para notas opcionais no output humano
**And** com `--output json`, recebo estrutura de checklist com itens e estado `pending|pass|fail`

### Story 4.6: Comando `validate` e revalidação pós-mudanças

As a utilizador,
I want `starfleet validate` após alterações,
So that deteto regressões (FR19, NFR6 parcialmente endereçável).

**Acceptance Criteria:**

**Given** ambiente já instalado
**When** executo `starfleet validate`
**Then** reroda smoke/integration conforme política MVP e atualiza relatório de validação
**When** falha um check
**Then** o comando termina com exit code != 0 e erro classificado com próximo passo

## Epic 5: Recuperação guiada quando algo corre mal

Perante falhas, o utilizador recebe diagnóstico classificado, escolhe uma estratégia de recuperação e é guiado até restaurar o estado funcional com validação renovada.

### Story 5.1: Taxonomia de falhas para operações de cluster e módulos

As a utilizador,
I want falhas classificadas (rede, binário em falta, timeout, config),
So that sei a causa provável (FR20, NFR8).

**Acceptance Criteria:**

**Given** erros simulados de k3d, kubectl e hooks de módulo
**When** ocorrem durante `up` ou `add`
**Then** o output humano e JSON incluem `code` estável por categoria e `hint` específico
**And** os códigos estão documentados numa tabela no README

### Story 5.2: Seleção de rota de recuperação (retry, rollback, diagnóstico)

As a utilizador,
I want escolher entre retry rápido, rollback seguro ou modo diagnóstico,
So that reajo ao tipo de falha (FR21).

**Acceptance Criteria:**

**Given** uma falha recuperável detetada
**When** executo o fluxo interativo de recuperação (comando `starfleet recover` ou flags em `up`)
**Then** sou apresentado a opções com expectativa de tempo/efeito colateral descrita
**And** modo não interativo aceita rota via flag explícita

### Story 5.3: Orquestração do fluxo de recuperação até estado consistente

As a utilizador,
I want que o Starfleet guie os passos até convergir ou falhar de forma explícita,
So that não fico com estado ambíguo (FR22).

**Acceptance Criteria:**

**Given** rota “retry” selecionada
**When** o fluxo corre
**Then** os mesmos estágios de `up`/`add` são reexecutados com logs de tentativa numerados
**Given** rota “rollback”
**When** o fluxo corre
**Then** o estado volta à revisão pinada anterior ou documenta impossibilidade com erro claro

### Story 5.4: Confirmação pós-recuperação com validação renovada

As a utilizador,
I want validar novamente após recuperação,
So that tenho confiança de que voltei a um estado funcional (FR23).

**Acceptance Criteria:**

**Given** recuperação concluída com sucesso
**When** aceito correr validação automática
**Then** `validate` (Épico 4) é invocado ou os mesmos checks são reutilizados internamente e o resultado é registado
**When** a validação falha
**Then** o sistema não marca o ambiente como saudável e sugere próxima rota

## Epic 6: Evidências de portfólio e resultados de aprendizagem

Ao concluir labs ou experimentos, o utilizador gera artefactos reutilizáveis que documentam o que correu, o que foi observado e suporta iteração futura com rastreabilidade.

### Story 6.1: Formato mínimo de manifesto de evidência e escrita em disco

As a utilizador,
I want um ficheiro de evidência versionado com módulos, versões e timestamps,
So that posso anexar a um portfólio (FR31, FR32, gap da Arquitetura).

**Acceptance Criteria:**

**Given** conclusão de um lab com sucesso
**When** executo o comando de geração de evidência (ex.: `starfleet evidence capture`)
**Then** é criado um manifesto JSON (camelCase) com lista de módulos, versões pinadas, checksum opcional de `starfleet.yaml` e hora UTC
**And** o path de saída fica sob diretório documentado (ex.: `.starfleet/evidence/`) respeitando `.gitignore` conforme política

### Story 6.2: Relatório legível (Markdown) derivado do manifesto

As a utilizador,
I want um resumo Markdown para humanos,
So that partilho rapidamente com recrutadores ou pares (FR33).

**Acceptance Criteria:**

**Given** manifesto existente
**When** gero relatório Markdown
**Then** o ficheiro inclui secções: contexto, módulos, resultados de validação, links para UIs conhecidas
**And** não inclui segredos de `.env`

### Story 6.3: Rastreabilidade de evidência à versão da CLI e do estado

As a contribuidor,
I want evidências a referenciar versão da CLI e commit/hash quando disponível,
So that iterações futuras mantêm contexto (FR34).

**Acceptance Criteria:**

**Given** ambiente de build com `package.json` version e variável `GIT_COMMIT` opcional
**When** gero evidência
**Then** o manifesto inclui `cliVersion` e `sourceRevision` quando detectados
**And** campos opcionais omitidos não quebram consumidores do JSON

## Epic 7: Caminho do mantenedor e barreiras de qualidade

Mantenedores preparam e submetem módulos alinhados ao contrato do produto; o sistema aplica gates que impedem regressões e contribuições fora dos critérios.

### Story 7.1: Scaffold/checklist para novo módulo alinhado ao padrão Starfleet

As a mantenedor,
I want um template de `module.yaml`, pastas `iac/`, `tests/` e README mínimos,
So that crio módulos consistentes (FR35).

**Acceptance Criteria:**

**Given** comando ou documentação de scaffold (ex.: `npm run module:scaffold`)
**When** executo com nome do módulo
**Then** é criada a estrutura mínima conforme árvore da Arquitetura
**And** o README lista Definition of Done do módulo

### Story 7.2: Verificações de compatibilidade e regressão em contribuições

As a mantenedor,
I want validação local antes de abrir PR,
So that não quebro fluxos core (FR36, FR38).

**Acceptance Criteria:**

**Given** script `npm run check:modules` (nome exemplificativo)
**When** corro após alterações num módulo
**Then** executa gates de metadados + smoke rápidos ou dry-run documentado
**And** falhas bloqueiam merge apenas quando integrado em pipeline futuro; no MVP documenta-se uso obrigatório manual

### Story 7.3: Critérios de aceitação automáticos para rejeitar contribuições inválidas

As a mantenedor,
I want o gate a falhar quando faltam testes ou contratos,
So that PRs fora do padrão são detetados (FR37).

**Acceptance Criteria:**

**Given** PR que remove `tests/smoke` de módulo existente
**When** o gate corre
**Then** falha com mensagem referenciando FR37/checklist
**And** o documento `CONTRIBUTING.md` descreve os requisitos mínimos e como reproduzir o gate localmente
