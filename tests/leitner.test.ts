import { describe, it, expect } from 'vitest'
import { antworten, istFaellig, naechsteFaellige, INTERVALLE } from '../src/lib/leitner'

describe('leitner', () => {
  it('neue Karte + richtig ⇒ Fach 2, fällig morgen', () => {
    const s = antworten(undefined, true, '2026-08-31')
    expect(s.fach).toBe(2)
    expect(s.faelligAm).toBe('2026-09-01')
  })

  it('Fach 3 + falsch ⇒ zurück in Fach 1, sofort fällig', () => {
    const s = antworten({ fach: 3, faelligAm: '2026-08-31' }, false, '2026-08-31')
    expect(s.fach).toBe(1)
    expect(s.faelligAm).toBe('2026-08-31')
  })

  it('Fach 5 + richtig bleibt Fach 5, fällig in 14 Tagen', () => {
    const s = antworten({ fach: 5, faelligAm: '2026-08-31' }, true, '2026-08-31')
    expect(s.fach).toBe(5)
    expect(s.faelligAm).toBe('2026-09-14')
  })

  it('Monatswechsel wird korrekt gerechnet', () => {
    const s = antworten({ fach: 4, faelligAm: '2026-12-30' }, true, '2026-12-30')
    expect(s.fach).toBe(5)
    expect(s.faelligAm).toBe('2027-01-13')
  })

  it('istFaellig: Vergangenheit/heute ⇒ true, Zukunft ⇒ false, neu ⇒ true', () => {
    expect(istFaellig({ fach: 2, faelligAm: '2026-08-30' }, '2026-08-31')).toBe(true)
    expect(istFaellig({ fach: 2, faelligAm: '2026-08-31' }, '2026-08-31')).toBe(true)
    expect(istFaellig({ fach: 2, faelligAm: '2026-09-01' }, '2026-08-31')).toBe(false)
    expect(istFaellig(undefined, '2026-08-31')).toBe(true)
  })

  it('naechsteFaellige: neue Karten zuerst, Zukunft ausgeschlossen', () => {
    const staende = {
      a: { fach: 2 as const, faelligAm: '2026-08-30' },
      b: { fach: 3 as const, faelligAm: '2026-09-05' },
    }
    const ids = ['a', 'b', 'c']
    expect(naechsteFaellige(staende, ids, '2026-08-31')).toEqual(['c', 'a'])
  })

  it('Intervalle sind wie spezifiziert', () => {
    expect(INTERVALLE).toEqual({ 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 })
  })
})
