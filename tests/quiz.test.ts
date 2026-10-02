import { describe, it, expect } from 'vitest'
import { begruendungMC, wertungMC } from '../src/lib/quiz'

describe('wertungMC', () => {
  it('exakte Menge ⇒ richtig, Reihenfolge egal', () => {
    expect(wertungMC([0, 2], [2, 0])).toBe(true)
    expect(wertungMC([1], [1])).toBe(true)
  })

  it('Teilmenge ⇒ falsch', () => {
    expect(wertungMC([0, 2], [0])).toBe(false)
  })

  it('Übermenge ⇒ falsch', () => {
    expect(wertungMC([0], [0, 1])).toBe(false)
  })

  it('leere Auswahl ⇒ falsch', () => {
    expect(wertungMC([0], [])).toBe(false)
  })
})

describe('begruendungMC', () => {
  it('bevorzugt die Erklärung', () => {
    expect(begruendungMC({ erklaerung: 'E', loesung: 'L' })).toBe('E')
  })

  it('fällt auf die Lösung zurück, wenn keine Erklärung existiert', () => {
    expect(begruendungMC({ loesung: 'L' })).toBe('L')
    expect(begruendungMC({ erklaerung: '  ', loesung: 'L' })).toBe('L')
  })

  it('liefert undefined ohne beides', () => {
    expect(begruendungMC({})).toBeUndefined()
  })
})
