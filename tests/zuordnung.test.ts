import { describe, expect, it } from 'vitest'
import { alleAusgefuellt, wertungZuordnung } from '../src/lib/zuordnung'
import type { Zuordnung } from '../src/types'

const zuordnung: Zuordnung = {
  ziffern: [
    { nr: 1, text: 'Komplementäre Ziele' },
    { nr: 2, text: 'Konkurrierende Ziele' },
    { nr: 3, text: 'Indifferente Ziele' },
  ],
  items: [
    { label: 'a', text: 'Gewinn – Klimaabgabe', korrekt: 2 },
    { label: 'b', text: 'Arbeitsklima – Recycling', korrekt: 3 },
    { label: 'c', text: 'Fortbildung – Verkaufskompetenz', korrekt: 1 },
  ],
}

describe('wertungZuordnung', () => {
  it('wertet nur als richtig, wenn alle Ziffern stimmen', () => {
    const w = wertungZuordnung(zuordnung, { a: '2', b: '3', c: '1' })
    expect(w.richtig).toBe(true)
    expect(w.proItem).toEqual({ a: true, b: true, c: true })
  })

  it('markiert einzelne falsche Zeilen, Gesamtwertung falsch', () => {
    const w = wertungZuordnung(zuordnung, { a: '2', b: '1', c: '1' })
    expect(w.richtig).toBe(false)
    expect(w.proItem).toEqual({ a: true, b: false, c: true })
  })

  it('toleriert Leerzeichen um die Ziffer', () => {
    expect(wertungZuordnung(zuordnung, { a: ' 2 ', b: '3', c: '1' }).richtig).toBe(true)
  })

  it('wertet leere oder nicht-numerische Eingaben als falsch', () => {
    const w = wertungZuordnung(zuordnung, { a: '', b: 'x', c: '1' })
    expect(w.richtig).toBe(false)
    expect(w.proItem).toEqual({ a: false, b: false, c: true })
  })

  it('wertet fehlende Antworten als falsch', () => {
    const w = wertungZuordnung(zuordnung, { a: '2' })
    expect(w.proItem).toEqual({ a: true, b: false, c: false })
  })

  it('akzeptiert "02" nicht als 2 — eingetragen wird die Ziffer wie auf dem Bogen', () => {
    expect(wertungZuordnung(zuordnung, { a: '02', b: '3', c: '1' }).proItem.a).toBe(false)
  })
})

describe('alleAusgefuellt', () => {
  it('ist wahr, wenn jede Zeile eine Eingabe hat', () => {
    expect(alleAusgefuellt(zuordnung, { a: '2', b: '3', c: '1' })).toBe(true)
  })

  it('ist falsch bei leeren oder fehlenden Zeilen', () => {
    expect(alleAusgefuellt(zuordnung, { a: '2', b: ' ', c: '1' })).toBe(false)
    expect(alleAusgefuellt(zuordnung, { a: '2', c: '1' })).toBe(false)
  })
})
