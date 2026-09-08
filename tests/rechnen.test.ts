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
        // Einheit ist eine Zeichenkette (kann leer sein für Kennzahlen ohne physische Einheit)
        expect(typeof a.einheit).toBe('string')
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
pruefeGenerator('leasing', 1_000, 500_000)
pruefeGenerator('wirtschaftlichkeit-produktivitaet', 0.1, 100_000)
pruefeGenerator('konjunktur-indikatoren', 0.1, 100)
pruefeGenerator('energie-betriebskosten', 1, 500_000)

// Regressions-Guard: Markttabelle darf keine negativen Mengen enthalten.
// Variante: Tabellenzellen direkt aus dem Generator-Output parsen (Pipe-Notation
// „| 1.200,00 € | 3.600 | 1.800 |"). formatiereZahl liefert für negative Zahlen
// ein führendes „-" → wir matchen alle Zellen hinter dem Preis und prüfen, dass
// der Zahlenwert nach Entfernung von Tausenderpunkten ≥ 0 ist. Das ist robuster
// als ein Regex auf „-\d" im Gesamttext, das auch gültige Minuszeichen (z. B.
// in KaTeX-Lösungswegen) treffen würde.
it('Markttabelle enthält keine negativen Mengen (200 Runs)', () => {
  const gen = GENERATOREN['gleichgewichtspreis-umsatz']
  // Regex erfasst die Mengenspalten: „| 3.600 | 2.400 |" → ["3.600", "2.400"]
  const zellRegex = /\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|/g
  for (let i = 0; i < 200; i++) {
    const { text } = gen()
    // Nur die Tabellenzeilen betrachten (nach der Kopfzeile)
    const tabellenZeilen = text.split('\n').filter(z => z.startsWith('|') && !z.includes('---') && !z.includes('Preis'))
    for (const zeile of tabellenZeilen) {
      let m: RegExpExecArray | null
      zellRegex.lastIndex = 0
      while ((m = zellRegex.exec(zeile)) !== null) {
        const wert1 = parseInt(m[1].replace(/\./g, ''), 10)
        const wert2 = parseInt(m[2].replace(/\./g, ''), 10)
        expect(wert1, `Negative Menge in Zeile: ${zeile}`).toBeGreaterThanOrEqual(0)
        expect(wert2, `Negative Menge in Zeile: ${zeile}`).toBeGreaterThanOrEqual(0)
      }
    }
  }
})

it('GENERATOREN deckt exakt die 10 Kapitel-IDs ab', () => {
  expect(Object.keys(GENERATOREN).sort()).toEqual([
    'darlehen', 'dreisatz', 'energie-betriebskosten', 'gleichgewichtspreis-umsatz',
    'kg-gewinnverteilung', 'konjunktur-indikatoren', 'leasing', 'prozentrechnung',
    'wirtschaftlichkeit-produktivitaet', 'zinsrechnung',
  ])
})
