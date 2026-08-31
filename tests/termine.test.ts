import { describe, it, expect } from 'vitest'
import { sammlungsNummer, terminAnzeige, terminVonNummer } from '../src/lib/termine'

describe('termine (Anonymisierung)', () => {
  it('bekannte Termine erhalten stabile Nummern', () => {
    expect(sammlungsNummer('2024-sommer')).toBe(1)
    expect(sammlungsNummer('2025-sommer')).toBe(2)
  })

  it('terminAnzeige nennt nach außen nie den echten Termin', () => {
    expect(terminAnzeige('2024-sommer')).toBe('Aufgabensammlung 1')
    expect(terminAnzeige('2025-sommer')).toBe('Aufgabensammlung 2')
    expect(terminAnzeige('2024-sommer')).not.toContain('2024')
  })

  it('unbekannte/fehlende Termine bekommen neutrale Anzeige', () => {
    expect(terminAnzeige(undefined)).toBe('Übungssammlung')
    expect(terminAnzeige('2019-winter')).toBe('Übungssammlung')
  })

  it('terminVonNummer ist die Umkehrung', () => {
    expect(terminVonNummer('1')).toBe('2024-sommer')
    expect(terminVonNummer(2)).toBe('2025-sommer')
    expect(terminVonNummer('99')).toBeNull()
  })
})
