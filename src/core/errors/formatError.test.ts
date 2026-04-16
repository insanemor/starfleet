import {describe, expect, it} from 'vitest'
import {ExitCode} from './exitCodes.js'
import {formatGenericFailure, formatHumanCliError} from './formatError.js'
import {StarfleetError} from './StarfleetError.js'

describe('formatHumanCliError', () => {
  it('omite stack sem --verbose', () => {
    const err = new StarfleetError({
      code: 'TEST',
      message: 'msg',
      hint: 'hint',
      exitCode: ExitCode.usage,
    })
    const out = formatHumanCliError(err, false)
    expect(out).toContain('code: TEST')
    expect(out).not.toContain('stack:')
  })

  it('inclui stack com verbose', () => {
    const err = new StarfleetError({
      code: 'TEST',
      message: 'msg',
      hint: 'hint',
      exitCode: ExitCode.cluster,
    })
    const out = formatHumanCliError(err, true)
    expect(out).toContain('stack:')
  })
})

describe('formatGenericFailure', () => {
  it('omite stack sem verbose', () => {
    const out = formatGenericFailure(new Error('boom'), false)
    expect(out).toContain('INTERNAL_ERROR')
    expect(out).not.toContain('stack:')
  })

  it('inclui stack com verbose', () => {
    const out = formatGenericFailure(new Error('boom'), true)
    expect(out).toContain('stack:')
  })
})
