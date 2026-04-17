import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'

export type DepGraph = Map<string, {dependencies: string[]}>

/**
 * Ordem topológica estável: dependências antes dos dependentes (filas alfabéticas).
 */
export function resolveModuleInstallOrder(
  seedIds: string[],
  graph: DepGraph,
): {order: string[]} | {error: StarfleetError} {
  for (const id of seedIds) {
    if (!graph.has(id)) {
      return {
        error: new StarfleetError({
          code: 'MODULE_DEPENDENCY_MISSING',
          message: `Módulo desconhecido no catálogo: ${id}`,
          hint: 'Verifique o nome da pasta em modules/ e o manifesto module.yaml.',
          exitCode: ExitCode.module,
          details: {moduleId: id},
        }),
      }
    }
  }

  const closure = new Set<string>()
  const stack = [...seedIds]
  while (stack.length > 0) {
    const m = stack.pop()!
    if (!graph.has(m)) {
      return {
        error: new StarfleetError({
          code: 'MODULE_DEPENDENCY_MISSING',
          message: `Dependência não existe no catálogo: ${m}`,
          hint: 'Corrija o campo dependencies em module.yaml para apontar para pastas existentes em modules/.',
          exitCode: ExitCode.module,
          details: {moduleId: m},
        }),
      }
    }
    if (closure.has(m)) {
      continue
    }
    closure.add(m)
    for (const d of graph.get(m)!.dependencies) {
      stack.push(d)
    }
  }

  const nodes = [...closure]
  const nodeSet = new Set(nodes)

  const inDegree = new Map<string, number>()
  const dependents = new Map<string, string[]>()

  for (const m of nodes) {
    const depsIn = (graph.get(m)!.dependencies ?? []).filter((d) => nodeSet.has(d))
    inDegree.set(m, depsIn.length)
  }

  for (const m of nodes) {
    for (const d of graph.get(m)!.dependencies ?? []) {
      if (!nodeSet.has(d)) {
        continue
      }
      if (!dependents.has(d)) {
        dependents.set(d, [])
      }
      dependents.get(d)!.push(m)
    }
  }

  const remaining = new Set(nodes)
  const order: string[] = []

  while (remaining.size > 0) {
    const ready = [...remaining]
      .filter((m) => (inDegree.get(m) ?? 0) === 0)
      .sort((a, b) => a.localeCompare(b))
    if (ready.length === 0) {
      return {
        error: new StarfleetError({
          code: 'MODULE_DEPENDENCY_CYCLE',
          message: 'Dependências circulares entre módulos; não é possível determinar ordem de instalação.',
          hint: 'Remova o ciclo no grafo de dependencies dos module.yaml.',
          exitCode: ExitCode.module,
          details: {modules: nodes},
        }),
      }
    }
    const u = ready[0]!
    remaining.delete(u)
    order.push(u)
    for (const v of dependents.get(u) ?? []) {
      inDegree.set(v, (inDegree.get(v) ?? 0) - 1)
    }
  }

  return {order}
}
