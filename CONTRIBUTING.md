# Contribuindo com módulos Starfleet

Este repositório usa um gate de contribuição para manter consistência e evitar regressões.

## Requisitos mínimos por módulo

Cada módulo em `modules/<nome>/` deve conter:

- `module.yaml` válido (`apiVersion: starfleet/module/v1`, `description`, `version`)
- `README.md` com contexto do módulo
- diretório `iac/`
- `tests/smoke/smoke.yaml` válido (`apiVersion: starfleet/smoke/v1`) com pelo menos 1 check

## Como scaffoldar um novo módulo

```bash
npm run module:scaffold -- observability-core
```

Isto cria `module.yaml`, `README.md`, `iac/` e `tests/smoke/smoke.yaml` mínimos.

## Como reproduzir o gate localmente

```bash
npm run check:modules
```

Se falhar, o CLI retorna `MODULE_CONTRIBUTION_GATE_FAILED` com detalhes.

Exemplo de repro do FR37/checklist:

1. Remova `tests/smoke/smoke.yaml` de um módulo existente.
2. Rode `npm run check:modules`.
3. O gate deve falhar e apontar o módulo inválido.
