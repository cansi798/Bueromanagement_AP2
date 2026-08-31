import { describe, it, expect } from 'vitest'
import { wertungMC } from '../src/lib/quiz'

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
