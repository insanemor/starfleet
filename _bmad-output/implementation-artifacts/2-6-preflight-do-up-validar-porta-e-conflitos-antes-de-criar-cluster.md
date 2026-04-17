# Story 2.6: Preflight do `up` — validar porta e conflitos antes de criar cluster

Status: done

## Story

As a utilizador,
I want que `starfleet up` detete cedo se a porta da API ou o ambiente impedem criar o cluster,
So that não perco tempo com rollback do k3d nem mensagens opacas de Docker (FR4, FR20, FR29, NFR4).

## Acceptance Criteria

1. No caminho que vai a `k3d cluster create`, falhar antes do create se a porta da API no host estiver indisponível, com erro classificado e `hint` acionável.
2. Log de estágio explícito (`up: stage=preflight`).
3. Não alterar convergência / no-op quando o cluster já existe e está alinhado.
4. Saída humana e JSON conforme Épico 1.
5. Testes com mock / simulação (sem depender do estado real da máquina em CI).

## Tasks / Subtasks

- [x] Código `CLUSTER_PORT_UNAVAILABLE` + `assertHostTcpPortAvailable` (bind TCP em `0.0.0.0`)
- [x] Integração em `convergeUp` antes de gravar `provisioning` / `cluster-create`
- [x] Testes `preflightHostPort.test.ts` e extensão `convergeUp.test.ts` (porta ocupada + porta efémera no suite)

## Dev Agent Record

### File List

- `src/core/cluster/preflightHostPort.ts`, `preflightHostPort.test.ts`
- `src/core/cluster/convergeUp.ts`, `convergeUp.test.ts`
- `src/core/cluster/index.ts`

### Notas

- A verificação é um instantâneo antes do create; uma corrida rara entre o preflight e o k3d continua possível (o k3d ainda pode falhar com mensagem própria).
