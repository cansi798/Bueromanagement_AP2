// src/lib/simulationErgebnis.ts
// Ehrlicher Zwischenstand nach der Abgabe: Note gibt es erst, wenn alle
// offenen Aufgaben bewertet sind (Selbsteinschätzung oder KI).

export interface Zwischenstand {
  fertig: boolean
  autoPunkte: number
  autoMax: number
  offenErreicht: number
  offenMax: number
  unbewertet: number
  unbewertetMax: number
  gesamt: number
  gesamtMax: number
}

export function berechneZwischenstand(
  autoPunkte: number,
  autoMax: number,
  offene: { max: number; erreicht: number | null }[],
): Zwischenstand {
  const offenMax = offene.reduce((s, o) => s + o.max, 0)
  const bewertete = offene.filter((o) => o.erreicht !== null)
  const offenErreicht = bewertete.reduce((s, o) => s + (o.erreicht ?? 0), 0)
  const unbewertete = offene.filter((o) => o.erreicht === null)
  return {
    fertig: unbewertete.length === 0,
    autoPunkte,
    autoMax,
    offenErreicht,
    offenMax,
    unbewertet: unbewertete.length,
    unbewertetMax: unbewertete.reduce((s, o) => s + o.max, 0),
    gesamt: Math.round((autoPunkte + offenErreicht) * 10) / 10,
    gesamtMax: autoMax + offenMax,
  }
}
