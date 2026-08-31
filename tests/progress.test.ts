import { describe, it, expect, beforeEach } from 'vitest'
import {
  ladeFortschritt,
  merkeErledigt,
  merkeQuiz,
  aktualisiereStreak,
  bereichsFortschritt,
} from '../src/lib/progress'
import type { Aufgabe } from '../src/types'

beforeEach(() => {
  const map = new Map<string, string>()
  ;(globalThis as any).localStorage = {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
  }
})

const aufgabe = (id: string): Aufgabe => ({
  id,
  themaId: 'thema-x',
  bereich: 'wiso',
  quelle: 'generiert',
  typ: 'offen',
  text: 'Frage?',
  loesung: 'Antwort.',
})

describe('progress', () => {
  it('Default-Fortschritt ist leer', () => {
    const f = ladeFortschritt()
    expect(f.erledigteAufgaben).toEqual([])
    expect(f.streak.tage).toBe(0)
  })

  it('merkeErledigt speichert eindeutig', () => {
    merkeErledigt('a1', '2026-08-31')
    const f = merkeErledigt('a1', '2026-08-31')
    expect(f.erledigteAufgaben).toEqual(['a1'])
  })

  it('merkeQuiz akkumuliert pro Thema', () => {
    merkeQuiz('t1', 2, 3, '2026-08-31')
    const f = merkeQuiz('t1', 1, 1, '2026-08-31')
    expect(f.quizErgebnisse['t1']).toEqual({ richtig: 3, gesamt: 4 })
  })

  it('Streak: erster Tag ⇒ 1, gleicher Tag idempotent', () => {
    let f = ladeFortschritt()
    f = aktualisiereStreak(f, '2026-08-31')
    expect(f.streak.tage).toBe(1)
    f = aktualisiereStreak(f, '2026-08-31')
    expect(f.streak.tage).toBe(1)
  })

  it('Streak: Folgetag +1, Lücke ⇒ zurück auf 1', () => {
    let f = ladeFortschritt()
    f = aktualisiereStreak(f, '2026-08-30')
    f = aktualisiereStreak(f, '2026-08-31')
    expect(f.streak.tage).toBe(2)
    f = aktualisiereStreak(f, '2026-09-05')
    expect(f.streak.tage).toBe(1)
  })

  it('bereichsFortschritt: Anteil erledigter Aufgaben', () => {
    merkeErledigt('a1', '2026-08-31')
    merkeErledigt('a2', '2026-08-31')
    const f = ladeFortschritt()
    const liste = [aufgabe('a1'), aufgabe('a2'), aufgabe('a3'), aufgabe('a4')]
    expect(bereichsFortschritt(f, liste)).toBe(0.5)
    expect(bereichsFortschritt(f, [])).toBe(0)
  })
})
