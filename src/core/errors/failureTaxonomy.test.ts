import {describe, expect, it} from 'vitest'
import {classifyExternalFailure, detectSurfaceFromCommand} from './failureTaxonomy.js'

describe('detectSurfaceFromCommand', () => {
  it('deteta kubectl no comando', () => {
    expect(detectSurfaceFromCommand('kubectl get pods')).toBe('kubectl')
  })

  it('deteta k3d no comando', () => {
    expect(detectSurfaceFromCommand('k3d cluster list -o json')).toBe('k3d')
  })

  it('usa fallback quando não reconhece binário', () => {
    expect(detectSurfaceFromCommand('bash tests/integration/run.sh', 'module-hook')).toBe('module-hook')
  })
})

describe('classifyExternalFailure', () => {
  it('classifica binário em falta', () => {
    const out = classifyExternalFailure({
      surface: 'k3d',
      command: 'k3d',
      errno: 'ENOENT',
      message: 'spawn k3d ENOENT',
    })
    expect(out.code).toBe('EXTERNAL_BINARY_MISSING')
    expect(out.category).toBe('binary-missing')
  })

  it('classifica timeout', () => {
    const out = classifyExternalFailure({
      surface: 'kubectl',
      command: 'kubectl get pods',
      message: 'request timed out',
      timedOut: true,
    })
    expect(out.code).toBe('EXTERNAL_TIMEOUT')
    expect(out.category).toBe('timeout')
  })

  it('classifica erro de rede', () => {
    const out = classifyExternalFailure({
      surface: 'module-hook',
      command: 'curl https://example.invalid',
      errno: 'ECONNREFUSED',
      message: 'connect ECONNREFUSED',
    })
    expect(out.code).toBe('EXTERNAL_NETWORK')
    expect(out.category).toBe('network')
  })

  it('classifica erro de configuração', () => {
    const out = classifyExternalFailure({
      surface: 'kubectl',
      command: 'kubectl get pods',
      stderr: 'error: invalid configuration: context "dev" does not exist',
    })
    expect(out.code).toBe('EXTERNAL_CONFIG')
    expect(out.category).toBe('config')
  })

  it('classifica fallback de comando falhado', () => {
    const out = classifyExternalFailure({
      surface: 'module-hook',
      command: 'bash -lc "exit 1"',
      message: 'Command failed with exit code 1',
    })
    expect(out.code).toBe('EXTERNAL_COMMAND_FAILED')
    expect(out.category).toBe('command-failed')
  })
})
