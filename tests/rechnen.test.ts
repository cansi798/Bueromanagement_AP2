import { describe, expect, it } from 'vitest'
import { GENERATOREN } from '../src/lib/rechnen'
import { formatiereZahl } from '../src/lib/zahl'

// Jeder Generator wird oft gewürfelt: Werte müssen endlich, plausibel und
// mit dem eigenen Lösungsweg konsistent sein (Endwert steht im Text).
export function pruefeGenerator(id: string, minWert: number, maxWert: number) {
  describe(`Generator ${id}`, () => {
    it('liefert 200× plausible, konsistente Aufgaben', () => {
      const gen = GENERATOREN[id]
      expect(gen, `Generator fehlt: ${id}`).toBeDefined()
      for (let i = 0; i < 200; i++) {
        const a = gen()
        expect(Number.isFinite(a.loesungswert)).toBe(true)
        expect(a.loesungswert).toBeGreaterThanOrEqual(minWert)
        expect(a.loesungswert).toBeLessThanOrEqual(maxWert)
        expect(a.text.length).toBeGreaterThan(20)
        expect(a.toleranz).toBeGreaterThanOrEqual(0)
        expect(a.einheit.length).toBeGreaterThan(0)
        // Lösungsweg endet nachvollziehbar mit dem formatierten Endwert.
        expect(
          a.loesungsweg.includes(formatiereZahl(a.loesungswert)) ||
            a.loesungsweg.includes(formatiereZahl(a.loesungswert, 0)) ||
            a.loesungsweg.includes(formatiereZahl(a.loesungswert, 1)),
          `${id}: Endwert fehlt im Lösungsweg`,
        ).toBe(true)
      }
    })
  })
}

pruefeGenerator('dreisatz', 0.01, 1_000_000)
pruefeGenerator('prozentrechnung', 0.01, 1_000_000)
pruefeGenerator('zinsrechnung', 1, 1_000_000)
pruefeGenerator('kg-gewinnverteilung', 1_000, 2_000_000)
pruefeGenerator('gleichgewichtspreis-umsatz', 1_000, 50_000_000)
pruefeGenerator('darlehen', 100, 5_000_000)
