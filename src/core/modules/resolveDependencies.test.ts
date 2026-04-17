import {describe, expect, it} from 'vitest'
import {resolveModuleInstallOrder} from './resolveDependencies.js'

describe('resolveModuleInstallOrder', () => {
  const graph = new Map([
    ['a', {dependencies: [] as string[]}],
    ['b', {dependencies: ['a']}],
    ['c', {dependencies: ['a', 'b']}],
  ])

  it('ordena dependências antes dos dependentes', () => {
    const r = resolveModuleInstallOrder(['c'], graph)
    if ('error' in r) {
      throw r.error
    }
    expect(r.order.indexOf('a')).toBeLessThan(r.order.indexOf('b'))
    expect(r.order.indexOf('b')).toBeLessThan(r.order.indexOf('c'))
  })

  it('falha com ciclo', () => {
    const g = new Map([
      ['x', {dependencies: ['y']}],
      ['y', {dependencies: ['x']}],
    ])
    const r = resolveModuleInstallOrder(['x'], g)
    expect('error' in r && r.error.code).toBe('MODULE_DEPENDENCY_CYCLE')
  })

  it('falha com dependência em falta no grafo', () => {
    const g = new Map([['a', {dependencies: ['ghost']}]])
    const r = resolveModuleInstallOrder(['a'], g)
    expect('error' in r && r.error.code).toBe('MODULE_DEPENDENCY_MISSING')
  })
})
