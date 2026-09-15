import { describe, it, expect } from 'vitest'
import { hellErzwingen } from '../src/lib/hellmodus'

// Fake-Element, weil die Testumgebung "node" ist (kein echtes DOM).
function fakeElement(klassen: string[]) {
  const set = new Set(klassen)
  return {
    classList: {
      contains: (c: string) => set.has(c),
      add: (c: string) => void set.add(c),
      remove: (c: string) => void set.delete(c),
    },
    hat: (c: string) => set.has(c),
  }
}

describe('hellErzwingen', () => {
  it('entfernt dark und stellt es beim Aufräumen wieder her', () => {
    const el = fakeElement(['dark'])
    const aufraeumen = hellErzwingen(el)
    expect(el.hat('dark')).toBe(false)
    aufraeumen()
    expect(el.hat('dark')).toBe(true)
  })

  it('fügt dark beim Aufräumen NICHT hinzu, wenn es vorher fehlte', () => {
    const el = fakeElement([])
    const aufraeumen = hellErzwingen(el)
    aufraeumen()
    expect(el.hat('dark')).toBe(false)
  })
})
