import { describe, it, expect } from 'vitest'
import { FARBEN } from '../src/lib/farben'

// Regressionsschutz für den Darkmode: Felder mit hellen Hintergründen/Texten
// brauchen zwingend eine dark:-Variante, sonst ist weiße Schrift auf
// Pastellgrund unlesbar (Bug vom 15.09.2026).
describe('FARBEN im Darkmode', () => {
  const pflichtfelder = ['kachel', 'akzentText', 'chip'] as const

  for (const [name, set] of Object.entries(FARBEN)) {
    for (const feld of pflichtfelder) {
      it(`${name}.${feld} hat eine dark:-Variante`, () => {
        expect(set[feld]).toMatch(/dark:/)
      })
    }
    it(`${name}.balken bleibt gesättigt (funktioniert auf hell und dunkel)`, () => {
      expect(set.balken).toMatch(/bg-\w+-[56]00/)
    })
  }
})
