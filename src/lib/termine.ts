// Nach außen werden Prüfungstermine anonymisiert als „Aufgabensammlung N"
// angezeigt — die echten Termine bleiben nur in den Daten und in
// content-pipeline/termine-intern.md dokumentiert.
//
// WICHTIG beim Ergänzen neuer Termine: die nächste freie Nummer vergeben und
// bestehende Nummern NIE umverteilen (Schüler referenzieren sie im Unterricht).

export const SAMMLUNGEN: Record<string, number> = {
  '2024-sommer': 1,
  '2025-sommer': 2,
}

export function sammlungsNummer(termin: string): number | null {
  return SAMMLUNGEN[termin] ?? null
}

export function terminAnzeige(termin?: string): string {
  if (!termin) return 'Übungssammlung'
  const nr = sammlungsNummer(termin)
  return nr === null ? 'Übungssammlung' : `Aufgabensammlung ${nr}`
}

export function terminVonNummer(nr: string | number): string | null {
  const ziel = Number(nr)
  for (const [termin, n] of Object.entries(SAMMLUNGEN)) {
    if (n === ziel) return termin
  }
  return null
}
