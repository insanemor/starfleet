import {describe, expect, it} from 'vitest'
import {SMOKE_MANIFEST_API, smokeManifestSchema} from './smokeManifest.js'

describe('smokeManifestSchema', () => {
  it('aceita manifesto mínimo válido', () => {
    const r = smokeManifestSchema.safeParse({
      apiVersion: SMOKE_MANIFEST_API,
      checks: [{name: 'a', run: 'true'}],
    })
    expect(r.success).toBe(true)
  })

  it('rejeita apiVersion errada', () => {
    const r = smokeManifestSchema.safeParse({
      apiVersion: 'wrong',
      checks: [{name: 'a', run: 'true'}],
    })
    expect(r.success).toBe(false)
  })
})
