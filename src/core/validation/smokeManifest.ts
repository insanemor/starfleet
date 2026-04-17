import {z} from 'zod'

export const SMOKE_MANIFEST_API = 'starfleet/smoke/v1' as const

export const smokeManifestSchema = z.object({
  apiVersion: z.literal(SMOKE_MANIFEST_API),
  checks: z.array(
    z.object({
      name: z.string().min(1),
      /** Comando shell (sh -c) executado com cwd no diretório do módulo. */
      run: z.string().min(1),
      timeoutMs: z.number().int().positive().optional(),
    }),
  ),
})

export type SmokeManifest = z.infer<typeof smokeManifestSchema>
