## Starfleet – Visão e Arquitetura

### 1. Visão do Projeto

**Propósito:**  
Starfleet é um ambiente de LAB local baseado em k3d para **DevOps/SRE** que querem:
- aprender e treinar com ferramentas de DevOps/SRE;
- validar novas ferramentas em forma de **POC**;
- manter um **portfólio reproduzível** do que já construíram.

**Promessa central:**  
Fornecer **POCs e labs de ferramentas DevOps/SRE**, totalmente em **IaC**, com **validação assistida**, abstraindo a dor da **primeira implantação** e mantendo o ambiente **reprodutível, estável e seguro para testes**.

### 2. Princípios Orientadores (“Leis do Starfleet”)

1. **IaC-first sempre**  
   - Toda infraestrutura e módulos são declarativos (YAML na maioria dos casos; HCL/ outros formatos somente quando a ferramenta exigir).  
   - O repositório é a “fonte de verdade” do estado desejado.

2. **Idempotência como contrato**  
   - `starfleet up` deve sempre **convergir para o mesmo estado** conhecido.  
   - Rodar `up` várias vezes não deve gerar drift nem efeitos colaterais inesperados.

3. **Version pinning por módulo**  
   - Ao instalar uma nova ferramenta/módulo, o Starfleet pode usar a **latest**, mas **trava** explicitamente na versão instalada (ex.: `2.0.1`).  
   - Evita que “latest de amanhã” quebre labs antigos ou POCs já consolidadas.

4. **Modularidade com dependências explícitas**  
   - Módulos são “blocos” com um grafo de dependências bem definido.  
   - Se o usuário pede o módulo 3, o Starfleet garante que os módulos 1 (e somente os necessários) sobem junto.  
   - Cada módulo declara claramente **de quem depende** e **quem depende dele**.

5. **Update seguro por módulo**  
   - Atualizações são feitas por módulo/ferramenta (`starfleet update <modulo>`).  
   - Evita um “update all” destrutivo que quebre labs ou POCs em uso.

6. **Validação não é opcional**  
   - Para instalação ou mudança (nova feature, nova versão, novo módulo), é obrigatório:  
     - **Smoke / integração básica**: serviço UP, integrações se comunicando, dados fluindo (logs/métricas/traces quando aplicável).  
     - **Validação assistida**: quando há UI, a IA abre o frontend, navega e mostra visualmente que tudo está funcional.
   - O objetivo é impedir o cenário “a IA disse que está pronto, mas não funciona”.

7. **UP rápido, sem teatrinho, quando nada mudou**  
   - Em um `starfleet up` “normal” (sem novas instalações/updates), o foco é **subir rápido** e rodar checks básicos.  
   - A validação assistida completa fica em comandos explícitos (`starfleet validate`, `starfleet validate --ui`, ou em pipelines de mudança).

8. **Padrão mínimo de módulo (anti-Frankenstein)**  
   Todo módulo precisa ter, no mínimo:
   - **IaC padronizado** (manifests/helm/kustomize/terraform, etc.).  
   - **Install/uninstall** bem definidos.  
   - **Docs**: README do módulo, com como instalar, usar, integrar.  
   - **Testes**: smoke/integration + passo de validação assistida (quando houver UI).  
   - **Metadados declarados** (versão da ferramenta, dependências, endpoints principais).

9. **Portfólio reprodutível, não só prints soltos**  
   - Cada módulo e lab deve permitir **reproduzir** a demo/POC com o menor atrito possível.  
   - Evidências (prints, logs, links) são geradas e organizadas para futuro uso como portfólio.

### 3. Arquitetura de Alto Nível

#### 3.1 Camada 1 – Infra LAB (base k3d)

- Criação e destruição de cluster k3d (ex.: `starfleet up` / `starfleet down`) com:
  - parâmetros padrão de CPU/memória/storage;
  - namespaces padrão (ex.: `starfleet-core`, `starfleet-modules-*`);
  - rede e ingress de base para expor UIs das ferramentas.

#### 3.2 Camada 2 – Core do Starfleet

- **CLI `starfleet`** (pode começar como script, evoluir para binário):
  - `up`: cria/atualiza cluster e aplica o conjunto de módulos ativos.  
  - `down`: derruba cluster/lab.  
  - `status`: mostra saúde da infra, módulos e integrações principais.  
  - `list`: lista módulos e labs disponíveis.  
  - `add <modulo>`: adiciona módulo ao ambiente (resolvendo dependências).
- **Manifesto Starfleet** (ex.: `starfleet.yaml` ou similar):
  - lista módulos ativos, versões, parâmetros e opções de perfil;
  - é a “visão declarativa” do ambiente atual.

#### 3.3 Camada 3 – Módulos

- Cada módulo vive em algo como `modules/<nome-do-modulo>/` e contém:
  - IaC (YAML/Helm/Kustomize/Terraform, etc.);
  - um arquivo de metadados (ex.: `module.yaml`) declarando:
    - nome, descrição, versão da ferramenta;
    - dependências de outros módulos;
    - endpoints principais (URLs, portas, dashboards);
    - hooks de **install** / **uninstall** / **test**;
    - escopos de acesso (namespaces, secrets relevantes, etc.).
- Perfis/coleções de módulos podem ser definidos por:
  - **ferramenta** (ex.: `grafana`, `prometheus`);  
  - **capacidade** (ex.: `observability-core`, `incident-lab`);  
  - **trilha** (ex.: `sre-101`).

#### 3.4 Camada 4 – Labs / Experiências Guiadas

- Labs combinam módulos + cenários:
  - ex.: “Observabilidade 101” = app demo + Prometheus + Grafana.
- Cada lab tem:
  - arquivo descritivo (Markdown/YAML) com:
    - objetivo do lab;
    - passos sugeridos;
    - comandos relevantes;
    - como validar se o objetivo foi atingido.
- A experiência guiada pode usar a própria IA para:
  - fazer perguntas ao usuário na criação de um novo lab/módulo (como nesta sessão);
  - gerar configurações personalizadas e docs iniciais a partir dessas respostas.

#### 3.5 Camada 5 – Validação e Portfólio

- **Testes**:
  - Smoke: pods prontos, serviços acessíveis.  
  - Integração: serviços conversando (app → métricas → Prometheus → Grafana, etc.).  
  - UI assistida: em instalações/mudanças, a IA abre a UI em um navegador e navega por rotas críticas, com o humano vendo isso acontecer.
- **Portfólio**:
  - Geração de “relatórios de lab/POC” com:
    - quais módulos e versões foram usados;
    - prints (ou referências a capturas) das UIs principais;
    - links para dashboards/URLs;
    - notas de aprendizado ou achados principais.

### 4. Fluxo de Uso Típico

#### 4.1 Fluxo feliz (MVP)

1. Clonar o repositório do Starfleet.  
2. Rodar `starfleet up` para subir:
   - cluster k3d;
   - infra core mínima;
   - um conjunto padrão de módulos (ex.: `observability-core`).  
3. Rodar `starfleet status` para ver:
   - se a infra base está saudável;
   - se os módulos principais estão UP;
   - se há dados fluindo (quando aplicável).  
4. Acessar as UIs expostas (via ingress) e seguir um **lab guiado** simples.  
5. Ao adicionar um novo módulo:
   - `starfleet add <modulo>` → resolver dependências → aplicar IaC;  
   - rodar testes (smoke/integration) + validação assistida inicial.

#### 4.2 Fluxo para adicionar uma nova ferramenta/módulo

1. Decidir a ferramenta e objetivos.  
2. A IA conduz um mini-brainstorming guiado com perguntas (como a sessão atual) para entender:
   - papel da ferramenta no LAB;
   - dependências esperadas;
   - requisitos de validação.  
3. Criar estrutura do módulo:
   - pasta, manifests, `module.yaml`, README.  
4. Implementar IaC conforme padrões do Starfleet.  
5. Declarar dependências (outros módulos necessários).  
6. Rodar `starfleet add <modulo>` em ambiente de teste:
   - subir dependências;
   - instalar módulo;
   - rodar testes e validação assistida (UI, quando existir).  
7. Registrar evidências (prints, notas, diagramas).  
8. Opcional: criar um lab guiado que utilize esse módulo.

### 5. Escopo de MVP (Primeira Entrega)

**Objetivo do MVP:**  
Ter um ambiente LAB Starfleet minimamente funcional que:
- sobe um cluster k3d com infra core básica;
- oferece **um módulo “estrela” bem acabado** (por exemplo, `observability-core`);
- permite `up`, `down`, `status`, `list`, `add`;
- demonstra na prática o conceito de validação assistida + portfólio.

**Componentes do MVP:**
- Infra básica k3d + ingress.  
- CLI inicial (`up`, `down`, `status`, `list`, `add`).  
- 1 módulo completo (ex.: observabilidade) com:
  - IaC completo;
  - tests smoke/integration;
  - fluxo manual de validação assistida;  
  - README + diagrama + prints.  
- 1 lab guiado simples usando esse módulo.

Esse documento é um rascunho vivo: à medida que o Starfleet evoluir, novos módulos, labs e padrões podem ser adicionados, desde que respeitem as **leis do Starfleet** definidas acima.

