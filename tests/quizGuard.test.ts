// Guard-Logik gegen Doppel-Wertung bei Moduswechsel (Finding 1):
// Die Session-Komponente nutzt ein Set (gewertetRef), um sicherzustellen,
// dass dieselbe Karte pro Runde nur einmal gewertet wird.
// Dieser Test prüft das Guard-Muster isoliert (pur, ohne React-Rendering).
import { describe, expect, it } from 'vitest'

// Minimale Nachbildung der Guard-Logik aus Quiz.tsx (Session.ergebnis / ergebnisSelbst).
function erstelleGuard() {
  const gewertet = new Set<string>()

  function versucheWerten(id: string): boolean {
    if (gewertet.has(id)) return false // bereits gewertet → ignorieren
    gewertet.add(id)
    return true
  }

  function reset() {
    gewertet.clear()
  }

  return { versucheWerten, reset }
}

describe('Quiz-Session Doppel-Wertungs-Guard', () => {
  it('erster Wertungsaufruf für eine Karte wird zugelassen', () => {
    const { versucheWerten } = erstelleGuard()
    expect(versucheWerten('karte-1')).toBe(true)
  })

  it('zweiter Aufruf für dieselbe Karte wird blockiert', () => {
    const { versucheWerten } = erstelleGuard()
    versucheWerten('karte-1')
    expect(versucheWerten('karte-1')).toBe(false)
  })

  it('zwei verschiedene Karten werden beide zugelassen', () => {
    const { versucheWerten } = erstelleGuard()
    expect(versucheWerten('karte-1')).toBe(true)
    expect(versucheWerten('karte-2')).toBe(true)
  })

  it('nach Reset wird dieselbe Karte erneut zugelassen (neue Runde)', () => {
    const { versucheWerten, reset } = erstelleGuard()
    versucheWerten('karte-1')
    reset()
    expect(versucheWerten('karte-1')).toBe(true)
  })

  it('mehrfache Wertungsversuche (Moduswechsel-Szenario) zählen nur einmal', () => {
    const { versucheWerten } = erstelleGuard()
    let zaehler = 0
    // Simulation: Auswahl-Modus → onErgebnis, dann Moduswechsel → erneut onErgebnis
    if (versucheWerten('karte-1')) zaehler++
    if (versucheWerten('karte-1')) zaehler++ // darf NICHT zählen
    if (versucheWerten('karte-1')) zaehler++ // darf NICHT zählen
    expect(zaehler).toBe(1)
  })
})
