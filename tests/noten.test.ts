import { describe, it, expect } from 'vitest'
import { ihkNote } from '../src/lib/noten'

describe('IHK-Notenschlüssel', () => {
  it('ordnet Prozentwerte den IHK-Noten zu', () => {
    expect(ihkNote(100)).toEqual({ note: 1, wort: 'sehr gut' })
    expect(ihkNote(92)).toEqual({ note: 1, wort: 'sehr gut' })
    expect(ihkNote(91)).toEqual({ note: 2, wort: 'gut' })
    expect(ihkNote(81)).toEqual({ note: 2, wort: 'gut' })
    expect(ihkNote(80)).toEqual({ note: 3, wort: 'befriedigend' })
    expect(ihkNote(67)).toEqual({ note: 3, wort: 'befriedigend' })
    expect(ihkNote(66)).toEqual({ note: 4, wort: 'ausreichend' })
    expect(ihkNote(50)).toEqual({ note: 4, wort: 'ausreichend' })
    expect(ihkNote(49)).toEqual({ note: 5, wort: 'mangelhaft' })
    expect(ihkNote(30)).toEqual({ note: 5, wort: 'mangelhaft' })
    expect(ihkNote(29)).toEqual({ note: 6, wort: 'ungenügend' })
    expect(ihkNote(0)).toEqual({ note: 6, wort: 'ungenügend' })
  })

  it('rundet krumme Prozentwerte sinnvoll (kaufmännisch auf ganze Prozent)', () => {
    expect(ihkNote(91.5).note).toBe(1) // 92 nach Rundung
    expect(ihkNote(49.4).note).toBe(5)
  })
})
