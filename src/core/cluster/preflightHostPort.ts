import net from 'node:net'
import {ExitCode} from '../errors/exitCodes.js'
import {StarfleetError} from '../errors/StarfleetError.js'

/**
 * Garante que é possível fazer bind TCP em `host:port` antes de pedir ao k3d
 * a mesma exposição (alinhado a `--api-port 0.0.0.0:<port>`).
 */
export function assertHostTcpPortAvailable(port: number, host: string = '0.0.0.0'): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    const onError = (err: NodeJS.ErrnoException) => {
      server.removeListener('error', onError)
      if (err.code === 'EADDRINUSE') {
        reject(
          new StarfleetError({
            code: 'CLUSTER_PORT_UNAVAILABLE',
            message: `A porta ${port} no host já está em uso; não é possível expor a API Kubernetes para o novo cluster.`,
            hint: 'Liberte a porta (pare o processo ou remova o cluster k3d que a usa), ou defina outro valor em cluster.kubeApiPort no starfleet.yaml.',
            exitCode: ExitCode.cluster,
            details: {port, host},
          }),
        )
        return
      }
      reject(err)
    }
    server.once('error', onError)
    server.listen({port, host, exclusive: true}, () => {
      server.removeListener('error', onError)
      server.close((closeErr) => {
        if (closeErr) {
          reject(closeErr)
          return
        }
        resolve()
      })
    })
  })
}
