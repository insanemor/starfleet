import net from 'node:net'
import {afterEach, describe, expect, it} from 'vitest'
import {assertHostTcpPortAvailable} from './preflightHostPort.js'

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer()
    s.once('error', reject)
    s.listen(0, '0.0.0.0', () => {
      const a = s.address()
      const p = typeof a === 'object' && a !== null ? a.port : 0
      s.close((err) => {
        if (err) reject(err)
        else resolve(p)
      })
    })
  })
}

describe('assertHostTcpPortAvailable', () => {
  const holders: net.Server[] = []
  afterEach(() => {
    for (const h of holders) {
      h.close()
    }
    holders.length = 0
  })

  it('resolve quando a porta está livre', async () => {
    const p = await getFreePort()
    await expect(assertHostTcpPortAvailable(p)).resolves.toBeUndefined()
  })

  it('rejeita com CLUSTER_PORT_UNAVAILABLE quando a porta está em uso', async () => {
    const p = await getFreePort()
    const holder = await new Promise<net.Server>((resolve, reject) => {
      const s = net.createServer()
      s.once('error', reject)
      s.listen(p, '0.0.0.0', () => resolve(s))
    })
    holders.push(holder)
    await expect(assertHostTcpPortAvailable(p)).rejects.toMatchObject({
      code: 'CLUSTER_PORT_UNAVAILABLE',
    })
  })
})
