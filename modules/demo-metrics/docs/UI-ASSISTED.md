# Validação assistida por UI (roteiro)

Este módulo pode expor interfaces web (ex.: Grafana). Use este roteiro para reduzir cenários “deploy feito mas inutilizável”.

## Pré-requisitos

- Cluster acessível (`kubectl get nodes`).
- Port-forward ou Ingress conforme o módulo documentar.
- Browser moderno; sem bloqueio de cookies de terceiros se a UI depender disso.

## Limitações

- O Starfleet não abre o browser automaticamente neste MVP; um agente ou extensão pode consumir os passos abaixo.
- SSO/OIDC pode exigir login manual — não automatizável sem credenciais.

## Roteiro mínimo

1. Identificar URL do serviço (ver README do módulo ou `kubectl get svc`).
2. Abrir a URL e confirmar carregamento sem erro 5xx.
3. Navegar até um dashboard ou vista listada como crítica no lab.
4. Confirmar visualmente dados recentes (últimos minutos) ou estado “OK” explícito.

## Artefactos esperados

- Captura de ecrã ou nota no checklist manual (`starfleet validate --manual`).
- Opcional: URL e timestamp anotados no relatório de validação.

## Secção UI-assisted (extensão / agente)

Campos para ferramentas externas:

- `entryUrl`: primeira URL a abrir.
- `successSelectors`: lista de seletores CSS ou texto visível que indica sucesso.
- `timeoutMs`: tempo máximo por passo.

Estes campos são convencionais; a CLI não os interpreta no MVP — servem para roteiros gerados por agente.
