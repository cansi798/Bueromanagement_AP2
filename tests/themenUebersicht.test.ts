import { describe, expect, it } from 'vitest'
import { baueThemenUebersicht } from '../src/lib/themenUebersicht'
import type { Fortschritt } from '../src/lib/progress'
import type { Aufgabe, Lernpaar, Thema } from '../src/types'

const thema = (id: string): Thema => ({
  id, bereich: 'wiso', name: `Thema ${id}`, beschreibung: '',
  haeufigkeit: [], lernzettel: '', eselsbruecken: [], selbstcheck: [],
})
const aufgabe = (id: string, themaId: string): Aufgabe => ({
  id, themaId, bereich: 'wiso', quelle: 'original', typ: 'mc', text: '', loesung: '',
})
const paar = (id: string, themaId: string): Lernpaar => ({
  id, themaId, bereich: 'wiso', frage: '', erklaerung: '',
})
const leererFortschritt: Fortschritt = {
  erledigteAufgaben: [], quizErgebnisse: {}, aufgabenStatistik: {},
  simulationen: [], streak: { letzterTag: '', tage: 0 }, unterricht: {},
}

describe('baueThemenUebersicht', () => {
  it('summiert Quiz- und Aufgaben-Statistik pro Thema', () => {
    const zeilen = baueThemenUebersicht({
      themen: [thema('t1')],
      aufgaben: [aufgabe('a1', 't1')],
      lernpaare: [],
      fortschritt: {
        ...leererFortschritt,
        quizErgebnisse: { t1: { richtig: 3, gesamt: 4 } },
        aufgabenStatistik: { a1: { richtig: 1, falsch: 1 } },
      },
      staende: {},
    })
    expect(zeilen).toHaveLength(1)
    expect(zeilen[0]).toMatchObject({ geuebt: 6, richtig: 4, falsch: 2, gekonnt: false })
    expect(zeilen[0].quote).toBeCloseTo(4 / 6)
  })

  it('markiert gekonnt erst ab Quote 80 % und 5 Übungen', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [],
      fortschritt: { ...leererFortschritt, quizErgebnisse: { t1: { richtig: 4, gesamt: 5 } } },
      staende: {},
    })
    expect(z.gekonnt).toBe(true)
  })

  it('leitet zuletzt aus Leitner-Stand und Unterricht her (Maximum)', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [paar('p1', 't1')],
      fortschritt: { ...leererFortschritt, unterricht: { t1: { abgeschlossen: '2026-09-01' } } },
      // Fach 3 fällig am 2026-09-13 → beantwortet am 2026-09-10 (Intervall 3 Tage)
      staende: { p1: { fach: 3, faelligAm: '2026-09-13' } },
    })
    expect(z.zuletzt).toBe('2026-09-10')
  })

  it('Themen ohne Aktivität: quote null, zuletzt null', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [], fortschritt: leererFortschritt, staende: {},
    })
    expect(z).toMatchObject({ geuebt: 0, quote: null, zuletzt: null, gekonnt: false })
  })
})
