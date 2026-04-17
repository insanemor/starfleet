import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {ExitCode} from '../errors/exitCodes.js'
import {classifyExternalFailure} from '../errors/failureTaxonomy.js'
import {StarfleetError} from '../errors/StarfleetError.js'
import {logInfo} from '../logging/logger.js'
import {buildK3dClusterCreateArgs} from './k3dArgs.js'
import type {K3dClusterSpec} from './k3dTypes.js'

const execFileAsync = promisify(execFile)

export class K3dRunner {
  constructor(private readonly options: {executable?: string} = {}) {}

  get executable(): string {
    const fromEnv = process.env.STARFLEET_K3D_BIN?.trim()
    if (fromEnv && fromEnv.length > 0) {
      return fromEnv
    }
    return this.options.executable ?? 'k3d'
  }

  /** Cria cluster com argumentos explícitos; falhas do subprocesso → `StarfleetError` domínio cluster. */
  async clusterCreate(spec: K3dClusterSpec): Promise<void> {
    const args = buildK3dClusterCreateArgs(spec)
    const bin = this.executable
    logInfo('k3d: cluster create', {
      executable: bin,
      args,
      clusterName: spec.name,
      kubeApiHostPort: spec.kubeApiHostPort,
      servers: spec.servers,
      agents: spec.agents,
      serversMemory: spec.serversMemory ?? null,
      agentsMemory: spec.agentsMemory ?? null,
    })
    try {
      await execFileAsync(bin, args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })
    } catch (raw) {
      throw mapK3dExecError(bin, args, raw, 'cluster create')
    }
  }

  /** Lista nomes de clusters k3d (JSON). */
  async listClusterNames(): Promise<string[]> {
    const bin = this.executable
    const args = ['cluster', 'list', '-o', 'json']
    logInfo('k3d: cluster list', {executable: bin, args})
    try {
      const {stdout} = await execFileAsync(bin, args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })
      let parsed: unknown
      try {
        parsed = JSON.parse(stdout)
      } catch (e) {
        const classification = classifyExternalFailure({
          surface: 'k3d',
          command: `${bin} cluster list -o json`,
          message: `invalid json: ${String(e)}`,
          stdout,
        })
        throw new StarfleetError({
          code: classification.code === 'EXTERNAL_COMMAND_FAILED' ? 'EXTERNAL_CONFIG' : classification.code,
          message: 'Resposta inválida de k3d cluster list (JSON).',
          hint:
            classification.code === 'EXTERNAL_COMMAND_FAILED'
              ? 'k3d retornou JSON inválido. Verifique versão/compatibilidade da ferramenta.'
              : classification.hint,
          exitCode: ExitCode.cluster,
          details: {
            cause: String(e),
            surface: 'k3d',
            category: 'config',
            command: bin,
          },
        })
      }
      if (!Array.isArray(parsed)) {
        return []
      }
      return parsed
        .map((row) =>
          row && typeof row === 'object' && row !== null && 'name' in row
            ? String((row as {name: unknown}).name)
            : '',
        )
        .filter((n) => n.length > 0)
    } catch (raw) {
      if (raw instanceof StarfleetError) {
        throw raw
      }
      throw mapK3dExecError(bin, args, raw, 'cluster list')
    }
  }

  /** Remove cluster (`k3d cluster delete NAME`). Idempotente se o k3d não encontrar o cluster. */
  async clusterDelete(clusterName: string): Promise<void> {
    const bin = this.executable
    const args = ['cluster', 'delete', clusterName]
    logInfo('k3d: cluster delete', {executable: bin, args, clusterName})
    try {
      await execFileAsync(bin, args, {
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
      })
    } catch (raw) {
      throw mapK3dExecError(bin, args, raw, 'cluster delete')
    }
  }

  /** Primeira linha de `k3d version` (best-effort para `status`). */
  async getK3dVersionLine(): Promise<string> {
    const bin = this.executable
    try {
      const {stdout} = await execFileAsync(bin, ['version'], {
        encoding: 'utf8',
        maxBuffer: 2 * 1024 * 1024,
      })
      const line = stdout.trim().split('\n')[0]
      return line && line.length > 0 ? line : 'unknown'
    } catch {
      return 'unavailable'
    }
  }
}

function mapK3dExecError(
  bin: string,
  args: string[],
  raw: unknown,
  operation: 'cluster create' | 'cluster list' | 'cluster delete',
): StarfleetError {
  const e = raw as NodeJS.ErrnoException & {
    stderr?: Buffer | string
    stdout?: Buffer | string
    status?: number
    signal?: string
    killed?: boolean
    code?: string | number
  }
  const stderr = e.stderr !== undefined ? String(e.stderr) : ''
  const stdout = e.stdout !== undefined ? String(e.stdout) : ''
  const classification = classifyExternalFailure({
    surface: 'k3d',
    command: bin,
    errno: e.code,
    signal: e.signal,
    timedOut: e.killed === true,
    message: e.message,
    stderr,
    stdout,
  })

  return new StarfleetError({
    code: classification.code,
    message:
      classification.category === 'binary-missing'
        ? `Executável não encontrado: ${bin}`
        : `k3d falhou em ${operation}: ${e.message ?? String(raw)}`.trim(),
    hint: classification.hint,
    exitCode: ExitCode.cluster,
    details: {
      surface: classification.surface,
      category: classification.category,
      command: bin,
      args,
      errno: e.code,
      exitStatus: e.status,
      stderr: stderr.trim(),
      stdout: stdout.trim(),
    },
  })
}
