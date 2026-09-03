import { describe, expect, it } from 'vitest'
import {
  faelligeLernpaare,
  istPositionsgebunden,
  mischeOptionen,
  quizFortschritt,
  themenQuizStand,
} from '../src/lib/lernquiz'
import type { Lernpaar } from '../src/types'

const paar = (id: string, korrekt: number[] = [0]): Lernpaar => ({
  id,
  themaId: 'test-thema',
  bereich: 'wiso',
  frage: `Frage ${id}?`,
  optionen: ['A', 'B', 'C', 'D'],
  korrekt,
  erklaerung: 'Weil.',
})

describe('themenQuizStand', () => {
  it('zählt neue, fällige und gemeisterte Paare', () => {
    const paare = [paar('a'), paar('b'), paar('c')]
    const staende = {
      b: { fach: 5 as const, faelligAm: '2099-01-01' },
      c: { fach: 2 as const, faelligAm: '2020-01-01' },
    }
    const s = themenQuizStand(paare, staende, '2026-09-02')
    expect(s.gesamt).toBe(3)
    expect(s.neu).toBe(1) // a
    expect(s.faellig).toBe(2) // a (neu) + c (überfällig)
    expect(s.gemeistert).toBe(1) // b
    expect(s.fachSumme).toBe(7)
    expect(s.proFach).toEqual([0, 1, 0, 0, 1]) // c in Fach 2, b in Fach 5
  })

  it('Fortschritt ist Fächer-Summe geteilt durch Maximum', () => {
    const s = {
      gesamt: 2,
      faellig: 0,
      neu: 0,
      gemeistert: 1,
      fachSumme: 7,
      proFach: [0, 1, 0, 0, 1] as [number, number, number, number, number],
    }
    expect(quizFortschritt(s)).toBeCloseTo(0.7)
    expect(quizFortschritt({ ...s, gesamt: 0 })).toBe(0)
  })
})

describe('faelligeLernpaare', () => {
  it('liefert neue Paare zuerst, dann überfällige; nicht fällige fehlen', () => {
    const paare = [paar('alt'), paar('neu'), paar('spaeter')]
    const staende = {
      alt: { fach: 1 as const, faelligAm: '2020-01-01' },
      spaeter: { fach: 3 as const, faelligAm: '2099-01-01' },
    }
    const f = faelligeLernpaare(paare, staende, '2026-09-02')
    expect(f.map((p) => p.id)).toEqual(['neu', 'alt'])
  })
})

describe('mischeOptionen', () => {
  it('behält alle Optionen und bildet korrekt-Indizes richtig ab', () => {
    const p = paar('x', [0, 2])
    for (let i = 0; i < 20; i++) {
      const { optionen, korrekt } = mischeOptionen(p)
      expect([...optionen].sort()).toEqual(['A', 'B', 'C', 'D'])
      const richtige = korrekt.map((k) => optionen[k]).sort()
      expect(richtige).toEqual(['A', 'C'])
    }
  })

  it('mischt wirklich: die richtige Antwort landet nicht immer an derselben Position', () => {
    const p = paar('x', [0])
    const positionen = new Set<number>()
    for (let i = 0; i < 200; i++) positionen.add(mischeOptionen(p).korrekt[0])
    expect(positionen.size).toBeGreaterThan(1)
  })

  it('lässt positionsgebundene Optionen an ihrem Platz', () => {
    const p = {
      ...paar('x', [3]),
      optionen: ['A', 'B', 'C', 'Keine der genannten Antworten ist richtig.'],
    }
    for (let i = 0; i < 50; i++) {
      const { optionen, korrekt } = mischeOptionen(p)
      expect(optionen[3]).toBe('Keine der genannten Antworten ist richtig.')
      expect(korrekt).toEqual([3])
    }
  })

  it('akzeptiert auch die Prüfungsaufgaben-Form (nur optionen/korrekt)', () => {
    const { optionen, korrekt } = mischeOptionen({ optionen: ['eins', 'zwei'], korrekt: [1] })
    expect([...optionen].sort()).toEqual(['eins', 'zwei'])
    expect(optionen[korrekt[0]]).toBe('zwei')
  })
})

describe('istPositionsgebunden', () => {
  it('erkennt Formulierungen, die sich auf die übrigen Optionen beziehen', () => {
    expect(istPositionsgebunden('Keine der genannten Antworten ist richtig.')).toBe(true)
    expect(istPositionsgebunden('Alle genannten Aussagen treffen zu.')).toBe(true)
    expect(istPositionsgebunden('Keine der Optionen trifft zu.')).toBe(true)
    expect(istPositionsgebunden('Alle Antworten sind richtig.')).toBe(true)
  })

  it('lässt normale Fachinhalte ungebunden', () => {
    expect(istPositionsgebunden('Alle Arbeitnehmer sind rentenversicherungspflichtig.')).toBe(false)
    expect(istPositionsgebunden('Forderungen 2404 3.570,00 € an Umsatzerlöse 5100')).toBe(false)
    expect(istPositionsgebunden('Der Betriebsrat wird alle vier Jahre gewählt.')).toBe(false)
  })
})
