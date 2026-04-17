import {z} from 'zod'

/** Contrato mínimo do ficheiro `starfleet.yaml` (MVP). */
export const starfleetConfigSchema = z.object({
  apiVersion: z.literal('starfleet/v1'),
  cluster: z.object({
    name: z.string().min(1, 'cluster.name é obrigatório'),
    /** Porta no host para a API Kubernetes (k3d `--api-port 0.0.0.0:PORT`). */
    kubeApiPort: z.coerce.number().int().min(1024).max(65535).optional(),
    servers: z.coerce.number().int().min(1).optional(),
    agents: z.coerce.number().int().min(0).optional(),
    /** Limite de memória dos nós server (formato aceite pelo k3d, ex.: `512mb`). */
    serversMemory: z.string().min(1).optional(),
    agentsMemory: z.string().min(1).optional(),
  }),
  /** Perfis nomeados: listas de módulos (pastas em modules/) aplicadas com `starfleet up --profile`. */
  profiles: z
    .record(
      z.string().min(1),
      z.object({
        modules: z.array(z.string().min(1)),
      }),
    )
    .optional(),
})

export type StarfleetConfig = z.infer<typeof starfleetConfigSchema>
