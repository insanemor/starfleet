### Starfleet – Product Brief

#### 1. Resumo executivo

O **Starfleet** é um ambiente de LAB local, baseado em **k3d**, voltado para **SREs e DevOps** que querem aprender, testar e demonstrar ferramentas de observabilidade, confiabilidade e operações modernas sem sofrer com a “primeira instalação dolorosa”.

Ele combina:
- **IaC** para reprodutibilidade,
- um modelo de **módulos e labs guiados**,
- e **validação assistida** (incluindo navegação em UIs),

para permitir que qualquer profissional suba um ambiente realista de ferramentas, rode cenários de treino/POC e ainda produza **evidências reutilizáveis** (portfólio).

---

#### 2. Problema

SREs e DevOps enfrentam alguns padrões recorrentes:

- **“Primeira instalação” traumática**  
  - Cada ferramenta (Prometheus, Grafana, Loki, Tempo, ArgoCD, etc.) tem um conjunto próprio de manifests, charts, configs e armadilhas.  
  - Refazer isso para cada estudo, POC ou demo consome tempo demais.

- **Labs pouco reprodutíveis**  
  - Demos e POCs costumam viver em scripts soltos, blocos de notas, prints não versionados.  
  - É difícil voltar meses depois e **reproduzir exatamente** o cenário.

- **Ambientes Frankensteins difíceis de manter**  
  - Ao juntar muitas ferramentas diferentes sem padrão de módulo, o cluster vira um Frankenstein:  
    - difícil de atualizar,  
    - difícil de remover componentes,  
    - alto risco de quebrar labs antigos ao atualizar “latest”.

- **Validação superficial (especialmente com IA ajudando)**  
  - Quando a IA ajuda a escrever manifests, é comum “parecer certo, mas não funcionar”:  
    - serviços sobem mas não se integram,  
    - UIs não mostram dados,  
    - labs não têm critérios claros de “ok, isso funciona”.

Para a comunidade, falta um **LAB de referência** que seja:
- fácil de subir/derrubar,
- modular e extensível,
- e com **padrões** que evitem esse Frankenstein.

---

#### 3. Solução – O que é o Starfleet

O **Starfleet** é um **LAB em k3d** com:

- **Camada de infra**: criação/destruição de cluster k3d com namespaces, ingress e componentes core prontos para receber módulos.
- **Core do produto**: uma **CLI `starfleet`** que oferece `up`, `down`, `status`, `list`, `add`, e orquestra os módulos.
- **Módulos plugáveis**:
  - Cada módulo encapsula uma ferramenta ou capacidade (ex.: `observability-core`, `incident-lab`, `chaos-lab`).
  - Declara dependências, versões, endpoints, testes e docs.
- **Labs guiados**:
  - Combina módulos + cenários (ex.: “Observability 101”) em experiências guiadas para aprendizado e treino.
- **Validação assistida**:
  - Além de smoke/integration tests, o Starfleet prevê um passo de **validação assistida via UI** em instalações/updates de módulos.

Resultado: o profissional baixa o repo, roda alguns comandos e rapidamente tem **um ambiente completo**, validado e documentado, para aprender, fazer POCs ou demonstrar habilidades.

---

#### 4. Público-alvo

- **SREs e DevOps** que:
  - querem estudar ferramentas novas em um ambiente “quase produção” local;
  - querem testar combinações de ferramentas (observabilidade, deploy, incident response, etc.);
  - querem **material de portfólio** estruturado, reprodutível.

- **Engenheiros em transição** (ex.: dev → SRE/DevOps) que precisam:
  - de um playground seguro,
  - com labs guiados,
  - e exemplos claros de boas práticas em IaC.

- **Comunidade open source**:
  - mantenedores que desejam fornecer um “módulo Starfleet” para facilitar onboarding da sua ferramenta.

---

#### 5. Proposta de valor

Para a comunidade SRE/DevOps, o Starfleet entrega:

- **Velocidade para aprender e testar**  
  - Em vez de “dias lutando com manifests”, em minutos você tem:
    - cluster k3d pronto,
    - módulos de observabilidade/deploy instalados,
    - labs sugeridos para brincar com incidentes e métricas.

- **Reprodutibilidade real**  
  - Tudo é **IaC** e declarado:
    - versões de ferramentas pinadas,
    - dependências explícitas por módulo,
    - labs descritos em arquivos versionados.

- **Ambiente anti-Frankenstein**  
  - Padrão mínimo de módulo:
    - install/uninstall definidos,
    - doc e diagramas,
    - testes de saúde e integração,
    - validação assistida quando há UI.
  - Atualização é por módulo, com controle de versão e impacto.

- **Portfólio profissional pronto para mostrar**  
  - Cada lab/módulo pode gerar um “report”:
    - o que foi instalado,  
    - prints e links de dashboards,  
    - notas de aprendizado.  
  - Fica fácil mostrar para recrutadores ou pares: “isso aqui fui eu que montei e consigo reproduzir”.

---

#### 6. Escopo inicial (MVP)

**Objetivo do MVP:** demonstrar o conceito de Starfleet na prática com um caso forte e simples.

- **Infra base**:
  - scripts/CLI para subir e derrubar cluster k3d;
  - namespaces/ingress core;

- **CLI inicial `starfleet`**:
  - `up`, `down`, `status`, `list`, `add <modulo>`.

- **Um módulo “estrela” completo**  
  Exemplo: `observability-core` (app demo + Prometheus + Grafana, ou stack similar):
  - IaC completo, com version pinning;
  - dependências declaradas;
  - testes smoke/integration (serviços UP, métricas chegando, dashboards acessíveis);
  - fluxo manual de validação assistida (roteiro claro do que abrir e verificar na UI);
  - README + diagramas + prints.

- **Um lab guiado inicial**  
  Exemplo: “Observability 101”:
  - sobe o módulo `observability-core`;
  - guia o usuário a:
    - gerar tráfego no app demo;
    - ver métricas/logs/traces no stack;
  - define critérios objetivos de “lab concluído”.

---

#### 7. Diferenciais frente a alternativas implícitas

- Diferente de “scripts pessoais + README solto”:
  - tem **padrão de módulo**, versionamento e dependências formais.
- Diferente de labs estáticos de documentação:
  - roda **localmente** com sua infra (k3d) e é hackável.
- Diferente de “instalar tudo na unha”:
  - reduz o atrito da primeira instalação e ainda garante validação e docs.

---

#### 8. Próximos passos (alto nível)

- Priorizar e implementar o **MVP observability-core**.  
- Definir formato canônico de:
  - `module.yaml` (metadados de módulos),
  - descrição de labs,
  - relatórios/portfólio.  
- Abrir o Starfleet para contribuições de novos módulos, mantendo o padrão anti-Frankenstein.

