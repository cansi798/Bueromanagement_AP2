import { beforeEach, describe, expect, it } from 'vitest'
import { ladeRechnenStand, merkeRechnenAufgabe, merkeRechnenUebung } from '../src/lib/rechnenFortschritt'

function mockStorage(overrides: Partial<Storage> = {}): void {
  const map = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => void map.clear(),
    ...overrides,
  }
}

beforeEach(() => mockStorage())

describe('Rechnen-Fortschritt', () => {
  it('startet leer', () => {
    expect(ladeRechnenStand()).toEqual({ kapitel: {} })
  })

  it('zählt Generator-Übungen je Kapitel', () => {
    merkeRechnenUebung('dreisatz', true)
    merkeRechnenUebung('dreisatz', false)
    merkeRechnenUebung('dreisatz', true)
    expect(ladeRechnenStand().kapitel['dreisatz']).toEqual({ richtig: 2, falsch: 1, geloest: [] })
  })

  it('merkt gelöste feste Aufgaben idempotent', () => {
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-01', true)
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-01', true)
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-02', false)
    const stand = ladeRechnenStand().kapitel['darlehen']
    expect(stand.geloest).toEqual(['rechnen-darlehen-01'])
    expect(stand.richtig).toBe(2)
    expect(stand.falsch).toBe(1)
  })
})
