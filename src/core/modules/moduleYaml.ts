import {z} from 'zod'

export const MODULE_YAML_API = 'starfleet/module/v1' as const

/** Manifesto completo em `modules/<id>/module.yaml` (Épico 3). */
export const moduleManifestSchema = z.object({
  apiVersion: z.literal(MODULE_YAML_API),
  name: z.string().min(1).optional(),
  description: z.string().min(1, 'description é obrigatória'),
  version: z.string().min(1, 'version é obrigatória'),
  dependencies: z.array(z.string().min(1)).optional().default([]),
  hooks: z
    .object({
      install: z.array(z.string().min(1)).optional(),
      uninstall: z.array(z.string().min(1)).optional(),
    })
    .optional(),
  /** Se true, o gate de catálogo (Story 3.5) exige README e tests/smoke. */
  promoted: z.boolean().optional(),
})

export type ModuleManifest = z.infer<typeof moduleManifestSchema>

export function parseModuleManifest(
  raw: unknown,
  directoryName: string,
):
  | {ok: true; value: ModuleManifest; displayName: string}
  | {ok: false; message: string; hint: string} {
  const parsed = moduleManifestSchema.safeParse(raw)
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`)
      .join('; ')
    return {
      ok: false,
      message: `module.yaml não cumpre o schema: ${detail}`,
      hint: 'Consulte a documentação do manifesto de módulo (apiVersion starfleet/module/v1, description, version).',
    }
  }
  const v = parsed.data
  const displayName = v.name?.trim() ?? directoryName
  return {ok: true, value: v, displayName}
}
