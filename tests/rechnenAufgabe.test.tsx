import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import RechnenAufgabe from '../src/components/RechnenAufgabe'

const aufgabe = {
  text: 'Berechnen Sie den Umsatz bei 2.000,00 € und 3.500 Stück!',
  loesungswert: 7000000,
  einheit: '€',
  toleranz: 0.01,
  loesungsweg: 'Umsatz = Preis × Menge = 2.000,00 € × 3.500 = **7.000.000,00 €**',
}

describe('RechnenAufgabe', () => {
  it('zeigt Aufgabentext, Eingabefeld mit Einheit und Prüfen-Knopf', () => {
    const html = renderToString(
      <RechnenAufgabe aufgabe={aufgabe} onErgebnis={() => {}} onWeiter={() => {}} weiterText="Neue Aufgabe" />,
    )
    expect(html).toContain('Berechnen Sie den Umsatz')
    expect(html).toContain('<input')
    expect(html).toContain('Prüfen')
    expect(html).toContain('€')
    expect(html).not.toContain('7.000.000') // Lösung vor der Abgabe unsichtbar
  })

  it('zeigt den Quellen-Hinweis, wenn vorhanden', () => {
    const html = renderToString(
      <RechnenAufgabe aufgabe={aufgabe} onErgebnis={() => {}} onWeiter={() => {}} weiterText="Weiter" quelleHinweis="Aufgabensammlung 12, Aufgabe 13" />,
    )
    expect(html).toContain('Aufgabensammlung 12')
  })
})
