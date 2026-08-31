import { describe, it, expect } from 'vitest'
import { pruefeCode } from '../src/lib/gate'

describe('gate', () => {
  it('akzeptiert den richtigen Code', async () => {
    expect(await pruefeCode('KBMap2')).toBe(true)
  })

  it('lehnt falsche Codes ab', async () => {
    expect(await pruefeCode('falsch')).toBe(false)
    expect(await pruefeCode('')).toBe(false)
    expect(await pruefeCode('kbmap2')).toBe(false)
  })
})
