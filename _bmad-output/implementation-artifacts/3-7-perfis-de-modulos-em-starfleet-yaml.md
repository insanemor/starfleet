# Story 3.7: Perfis em `starfleet.yaml`

Status: done

Implementação: `profiles` no schema de config; `starfleet up --profile <nome>` chama `applyProfileModules` após `convergeClusterUp`. Mesma resolução de dependências que o `add`.
