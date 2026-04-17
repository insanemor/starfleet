# Issue (copiar para GitHub)

**Rastreio interno:** Story **2.6** — implementada; ver artefacto `2-6-preflight-do-up-validar-porta-e-conflitos-antes-de-criar-cluster.md` e `src/core/cluster/preflightHostPort.ts`.

**Título sugerido:** `feat(up): validar conflito de porta / ambiente antes de criar cluster k3d`

---

## Contexto

Ao executar `starfleet up`, se a porta da API Kubernetes no host (ex.: `6550` por defeito) já estiver ocupada por outro cluster k3d ou processo, o `k3d cluster create` falha com rollback. O utilizador só descobre no fim do fluxo, com mensagem longa do k3d/Docker.

Cenário real: cluster k3d antigo ainda ativo ou outro serviço na mesma porta.

## Objetivo

Falhar **cedo** e com mensagem **clara e accionável** quando o `up` for criar um cluster novo e o ambiente já inviabilizar a criação (porta em uso, ou política definida para nome duplicado).

## Proposta (alto nível)

1. **Antes** de `k3d cluster create`, executar um **preflight** que inclua pelo menos:
   - Verificar se a porta do host escolhida para a API (`kubeApiPort` / default) **já está em escuta** (ou equivalente suportado em Linux/macOS/Windows do MVP).
   - Opcionalmente: correlacionar com `k3d cluster list` / metadata para sugerir `k3d cluster delete <nome>` ou mudança de `kubeApiPort` no `starfleet.yaml`.

2. Se o preflight falhar, devolver erro **classificado** (`StarfleetError`) com:
   - `code` estável (ex.: `CLUSTER_PORT_UNAVAILABLE` ou nome acordado),
   - `message` e `hint` curtos (porta X em uso; liberte a porta ou defina `cluster.kubeApiPort`),
   - exit code alinhado à matriz existente (domínio cluster).

3. **Não** alterar o comportamento do ramo em que o cluster **já existe** e o Starfleet apenas converge / no-op (fluxo actual do `convergeClusterUp`).

## Critérios de aceitação

- [ ] Com porta já ocupada no host, `starfleet up` **não** invoca `cluster create` (ou falha imediatamente após detecção documentada).
- [ ] Mensagem humana + JSON (`--output json`) consistentes com o envelope do Épico 1.
- [ ] Testes automatizados com porta simulada ocupada ou mock do runner (evitar depender do estado real da máquina em CI).

## Notas

- Detecção “porta em uso” pode ter nuances (SO, permissões); documentar limitações na mensagem ou em docs se necessário.
- Relacionado: melhor UX do que depender apenas do stderr do k3d para `Bind for 0.0.0.0:6550 failed`.
