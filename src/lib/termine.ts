// Nach außen werden Prüfungstermine anonymisiert als „Aufgabensammlung N"
// angezeigt — die echten Termine bleiben nur in den Daten und in
// content-pipeline/termine-intern.md dokumentiert.
//
// WICHTIG beim Ergänzen neuer Termine: die nächste freie Nummer vergeben und
// bestehende Nummern NIE umverteilen (Schüler referenzieren sie im Unterricht).

export const SAMMLUNGEN: Record<string, number> = {
  '2024-sommer': 1,
  '2025-sommer': 2,
  '2024-winter': 3,
  '2023-sommer': 4,
  '2023-winter': 5,
  '2022-sommer': 6,
  '2022-winter': 7,
  '2021-sommer': 8,
  '2021-winter': 9,
  '2020-sommer': 10,
  '2020-winter': 11,
  '2019-sommer': 12,
  '2019-winter': 13,
  '2018-sommer': 14,
  '2018-winter': 15,
  '2017-winter': 16,
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
