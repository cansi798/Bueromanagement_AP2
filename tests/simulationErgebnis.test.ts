// tests/simulationErgebnis.test.ts
import { describe, expect, it } from 'vitest'
import { berechneZwischenstand } from '../src/lib/simulationErgebnis'

describe('berechneZwischenstand', () => {
  it('ohne offene Aufgaben sofort fertig', () => {
    const z = berechneZwischenstand(40, 50, [])
    expect(z).toMatchObject({ fertig: true, gesamt: 40, gesamtMax: 50, unbewertet: 0 })
  })

  it('unbewertete offene Aufgaben → nicht fertig, Zähler stimmen', () => {
    const z = berechneZwischenstand(40, 50, [
      { max: 10, erreicht: null },
      { max: 20, erreicht: 15 },
    ])
    expect(z).toMatchObject({
      fertig: false, autoPunkte: 40, autoMax: 50,
      offenErreicht: 15, offenMax: 30, unbewertet: 1, unbewertetMax: 10,
      gesamt: 55, gesamtMax: 80,
    })
  })

  it('alle offenen bewertet → fertig', () => {
    const z = berechneZwischenstand(40, 50, [{ max: 10, erreicht: 5 }])
    expect(z).toMatchObject({ fertig: true, gesamt: 45, gesamtMax: 60 })
  })
})
