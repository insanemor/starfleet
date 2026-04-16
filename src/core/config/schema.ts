import {z} from 'zod'

/** Contrato mínimo do ficheiro `starfleet.yaml` (MVP). */
export const starfleetConfigSchema = z.object({
  apiVersion: z.literal('starfleet/v1'),
  cluster: z.object({
    name: z.string().min(1, 'cluster.name é obrigatório'),
  }),
})

export type StarfleetConfig = z.infer<typeof starfleetConfigSchema>
