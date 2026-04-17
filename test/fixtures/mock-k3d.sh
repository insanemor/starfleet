#!/usr/bin/env sh
# Simulador de k3d para testes (`cluster list` devolve JSON; opcionalmente regista argv).
LOG="${MOCK_K3D_LOG:-/dev/null}"
echo "mock-k3d $*" >> "$LOG"

if [ "${1-}" = "cluster" ] && [ "${2-}" = "list" ]; then
  printf '%s\n' '[]'
  exit "${MOCK_K3D_EXIT:-0}"
fi

if [ "${1-}" = "cluster" ] && [ "${2-}" = "delete" ]; then
  exit "${MOCK_K3D_EXIT:-0}"
fi

exit "${MOCK_K3D_EXIT:-0}"
