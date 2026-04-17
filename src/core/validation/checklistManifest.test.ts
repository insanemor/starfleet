import {describe, expect, it} from 'vitest'
import {CHECKLIST_MANIFEST_API, checklistManifestSchema} from './checklistManifest.js'

describe('checklistManifestSchema', () => {
  it('aceita checklist com itens', () => {
    const r = checklistManifestSchema.safeParse({
      apiVersion: CHECKLIST_MANIFEST_API,
      items: [{id: 'x', text: 'Passo um'}],
    })
    expect(r.success).toBe(true)
  })

  it('aceita item só com texto', () => {
    const r = checklistManifestSchema.safeParse({
      apiVersion: CHECKLIST_MANIFEST_API,
      items: [{text: 'Só texto'}],
    })
    expect(r.success).toBe(true)
  })
})
