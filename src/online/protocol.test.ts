import { describe, expect, it } from 'vitest'
import { backoffMs, generateCode, isValidCode, msg, parseMsg, PROTOCOL_VERSION } from './protocol'

describe('protocol', () => {
  it('accepts well-formed messages', () => {
    expect(parseMsg(msg.hello('Ana'))).toEqual({ v: PROTOCOL_VERSION, t: 'hello', name: 'Ana' })
    expect(parseMsg(msg.action('ready'))?.t).toBe('action')
    expect(parseMsg(msg.reject('full'))?.t).toBe('reject')
  })

  it('rejects malformed input', () => {
    expect(parseMsg(null)).toBeNull()
    expect(parseMsg('x')).toBeNull()
    expect(parseMsg({ t: 'hello', name: 'Ana' })).toBeNull()
    expect(parseMsg({ v: 1, t: 'hello' })).toBeNull()
    expect(parseMsg({ v: 1, t: 'action', type: 'hit' })).toBeNull()
    expect(parseMsg({ v: 1, t: 'nope' })).toBeNull()
  })

  it('generates valid room codes', () => {
    expect(isValidCode(generateCode())).toBe(true)
    expect(generateCode(() => 0)).toBe('aaaaaa')
  })

  it('backs off exponentially up to a cap', () => {
    expect([0, 1, 2, 3, 10].map(backoffMs)).toEqual([1000, 2000, 4000, 8000, 10_000])
  })
})
