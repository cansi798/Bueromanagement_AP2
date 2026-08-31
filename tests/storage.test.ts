import { describe, it, expect, beforeEach } from 'vitest'
import { getItem, setItem, storageVerfuegbar } from '../src/lib/storage'

function mockStorage(overrides: Partial<Storage> = {}): void {
  const map = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    ...overrides,
  }
}

describe('storage', () => {
  beforeEach(() => mockStorage())

  it('speichert und liest Objekte', () => {
    expect(setItem('kbm.v1.test', { a: 1 })).toBe(true)
    expect(getItem<{ a: number }>('kbm.v1.test')).toEqual({ a: 1 })
  })

  it('gibt null bei fehlendem Key', () => {
    expect(getItem('kbm.v1.fehlt')).toBeNull()
  })

  it('überlebt kaputtes JSON', () => {
    localStorage.setItem('kbm.v1.kaputt', '{{')
    expect(getItem('kbm.v1.kaputt')).toBeNull()
  })

  it('setItem gibt false statt zu werfen, wenn Storage wirft', () => {
    mockStorage({
      setItem: () => {
        throw new Error('QuotaExceeded')
      },
    })
    expect(setItem('kbm.v1.test', 1)).toBe(false)
  })

  it('storageVerfuegbar erkennt funktionierenden Storage', () => {
    expect(storageVerfuegbar()).toBe(true)
    mockStorage({
      setItem: () => {
        throw new Error('privat')
      },
    })
    expect(storageVerfuegbar()).toBe(false)
  })
})
