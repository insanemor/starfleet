export type ExternalFailureSurface = 'k3d' | 'kubectl' | 'module-hook'

export type ExternalFailureCategory =
  | 'binary-missing'
  | 'timeout'
  | 'network'
  | 'config'
  | 'command-failed'

export type ClassifiedExternalFailure = {
  code: string
  category: ExternalFailureCategory
  hint: string
  surface: ExternalFailureSurface
}

type ClassifyExternalFailureInput = {
  surface: ExternalFailureSurface
  command?: string
  errno?: unknown
  signal?: unknown
  timedOut?: boolean
  message?: string
  stderr?: string
  stdout?: string
}

const CATEGORY_CODE: Record<ExternalFailureCategory, string> = {
  'binary-missing': 'EXTERNAL_BINARY_MISSING',
  timeout: 'EXTERNAL_TIMEOUT',
  network: 'EXTERNAL_NETWORK',
  config: 'EXTERNAL_CONFIG',
  'command-failed': 'EXTERNAL_COMMAND_FAILED',
}

const NETWORK_ERRNO = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'EHOSTUNREACH',
  'ENOTFOUND',
  'EAI_AGAIN',
])

const NETWORK_PATTERN =
  /(connection refused|connection reset|network is unreachable|no route to host|dial tcp|tls handshake timeout|temporary failure in name resolution|server unavailable)/i

const CONFIG_PATTERN =
  /(kubeconfig|invalid configuration|invalid config|parse error|yaml|schema|unknown flag|no configuration has been provided|context .* does not exist|permission denied)/i

const BINARY_NOT_FOUND_PATTERN =
  /(command not found|not found|comando n[aã]o encontrado|is not recognized as an internal or external command)/i

export function detectSurfaceFromCommand(
  command: string,
  fallback: ExternalFailureSurface = 'module-hook',
): ExternalFailureSurface {
  const c = command.toLowerCase()
  if (/\bkubectl(?:\.exe)?\b/.test(c)) {
    return 'kubectl'
  }
  if (/\bk3d(?:\.exe)?\b/.test(c)) {
    return 'k3d'
  }
  return fallback
}

export function classifyExternalFailure(
  input: ClassifyExternalFailureInput,
): ClassifiedExternalFailure {
  const errno = typeof input.errno === 'string' ? input.errno : undefined
  const text = [input.message, input.stderr, input.stdout]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join('\n')
    .toLowerCase()

  const category = detectCategory({
    errno,
    signal: typeof input.signal === 'string' ? input.signal : undefined,
    timedOut: input.timedOut === true,
    command: input.command,
    text,
  })

  return {
    code: CATEGORY_CODE[category],
    category,
    hint: hintFor(input.surface, category),
    surface: input.surface,
  }
}

function detectCategory(input: {
  errno?: string
  signal?: string
  timedOut: boolean
  command?: string
  text: string
}): ExternalFailureCategory {
  const {errno, signal, timedOut, command, text} = input
  const commandLower = command?.toLowerCase() ?? ''

  const maybeMissingBinary =
    errno === 'ENOENT' ||
    BINARY_NOT_FOUND_PATTERN.test(text) ||
    (text.includes('status 127') && (commandLower.includes('kubectl') || commandLower.includes('k3d')))
  if (maybeMissingBinary) {
    return 'binary-missing'
  }

  const maybeTimeout =
    timedOut ||
    errno === 'ETIMEDOUT' ||
    (signal === 'SIGTERM' && /\b(timeout|timed out|deadline exceeded)\b/i.test(text)) ||
    /\b(timeout|timed out|deadline exceeded)\b/i.test(text)
  if (maybeTimeout) {
    return 'timeout'
  }

  const maybeNetwork = (errno !== undefined && NETWORK_ERRNO.has(errno)) || NETWORK_PATTERN.test(text)
  if (maybeNetwork) {
    return 'network'
  }

  if (CONFIG_PATTERN.test(text)) {
    return 'config'
  }

  return 'command-failed'
}

function hintFor(surface: ExternalFailureSurface, category: ExternalFailureCategory): string {
  switch (surface) {
    case 'k3d':
      return hintForK3d(category)
    case 'kubectl':
      return hintForKubectl(category)
    case 'module-hook':
    default:
      return hintForModuleHook(category)
  }
}

function hintForK3d(category: ExternalFailureCategory): string {
  switch (category) {
    case 'binary-missing':
      return 'Instale o k3d e confirme que o executável está no PATH (ou defina STARFLEET_K3D_BIN).'
    case 'timeout':
      return 'A operação k3d excedeu o tempo limite. Verifique carga do host/Docker e tente novamente.'
    case 'network':
      return 'Falha de rede ao falar com o Docker/k3d. Verifique conectividade local e estado do daemon.'
    case 'config':
      return 'Falha de configuração no k3d. Revise flags, portas e parâmetros do manifesto.'
    case 'command-failed':
    default:
      return 'Comando k3d falhou. Verifique Docker em execução, conflitos de porta e logs do stderr.'
  }
}

function hintForKubectl(category: ExternalFailureCategory): string {
  switch (category) {
    case 'binary-missing':
      return 'Instale o kubectl no PATH do ambiente onde o comando/hook executa.'
    case 'timeout':
      return 'kubectl excedeu o tempo limite. Verifique API server, contexto e latência de rede.'
    case 'network':
      return 'Falha de rede no acesso ao cluster via kubectl. Verifique endpoint, DNS e conectividade.'
    case 'config':
      return 'Configuração kubectl inválida (contexto/kubeconfig). Revise KUBECONFIG e contexto ativo.'
    case 'command-failed':
    default:
      return 'Comando kubectl falhou. Revise permissões RBAC, namespace e argumentos usados.'
  }
}

function hintForModuleHook(category: ExternalFailureCategory): string {
  switch (category) {
    case 'binary-missing':
      return 'Hook referencia um binário inexistente. Instale a ferramenta ou corrija hooks no module.yaml.'
    case 'timeout':
      return 'Hook excedeu o tempo limite. Simplifique o comando ou ajuste a rotina executada.'
    case 'network':
      return 'Hook falhou por rede. Verifique acesso a dependências externas e retry manual.'
    case 'config':
      return 'Hook falhou por configuração inválida. Revise argumentos, ficheiros e variáveis de ambiente.'
    case 'command-failed':
    default:
      return 'Hook falhou durante a execução. Verifique stderr e o comando definido em module.yaml.'
  }
}
