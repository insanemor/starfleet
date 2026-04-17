import {z} from 'zod'

export const CHECKLIST_MANIFEST_API = 'starfleet/checklist/v1' as const

export const checklistManifestSchema = z.object({
  apiVersion: z.literal(CHECKLIST_MANIFEST_API),
  items: z.array(
    z.object({
      id: z.string().min(1).optional(),
      text: z.string().min(1),
    }),
  ),
})

export type ChecklistManifest = z.infer<typeof checklistManifestSchema>
