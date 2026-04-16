import {afterEach, describe, expect, it} from 'vitest'
import {isNonInteractiveFromEnv, resolveNonInteractive} from './nonInteractive.js'

describe('nonInteractive', () => {
  const prev = process.env.STARFLEET_NON_INTERACTIVE

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.STARFLEET_NON_INTERACTIVE
    } else {
      process.env.STARFLEET_NON_INTERACTIVE = prev
    }
  })

  it('isNonInteractiveFromEnv reconhece 1, true, yes', () => {
    for (const val of ['1', 'true', 'yes', 'TRUE', ' Yes ']) {
      process.env.STARFLEET_NON_INTERACTIVE = val
      expect(isNonInteractiveFromEnv()).toBe(true)
    }
  })

  it('isNonInteractiveFromEnv é falso quando vazio ou ausente', () => {
    delete process.env.STARFLEET_NON_INTERACTIVE
    expect(isNonInteractiveFromEnv()).toBe(false)
    process.env.STARFLEET_NON_INTERACTIVE = '0'
    expect(isNonInteractiveFromEnv()).toBe(false)
  })

  it('resolveNonInteractive: --yes tem prioridade sobre env', () => {
    delete process.env.STARFLEET_NON_INTERACTIVE
    expect(resolveNonInteractive({yes: true})).toBe(true)
  })

  it('resolveNonInteractive: usa env quando --yes não está definido', () => {
    process.env.STARFLEET_NON_INTERACTIVE = '1'
    expect(resolveNonInteractive({})).toBe(true)
  })
})
