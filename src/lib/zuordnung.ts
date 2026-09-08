// Wertung der Ziffern-Zuordnung: wie auf dem IHK-Antwortbogen zählt die
// Aufgabe nur als richtig, wenn jede Zeile die exakte Ziffer trägt.
import type { Zuordnung } from '../types'

export interface ZuordnungWertung {
  richtig: boolean
  proItem: Record<string, boolean>
}

// Nur eine nackte Ziffernfolge ohne führende Null gilt als Eintrag ("2", nicht "02").
function gelesen(wert: string | undefined): number | null {
  const t = (wert ?? '').trim()
  if (!/^[1-9][0-9]*$/.test(t)) return null
  return Number(t)
}

export function wertungZuordnung(
  zuordnung: Zuordnung,
  antworten: Record<string, string>,
): ZuordnungWertung {
  const proItem: Record<string, boolean> = {}
  for (const item of zuordnung.items) {
    proItem[item.label] = gelesen(antworten[item.label]) === item.korrekt
  }
  return { richtig: Object.values(proItem).every(Boolean), proItem }
}

export function alleAusgefuellt(
  zuordnung: Zuordnung,
  antworten: Record<string, string>,
): boolean {
  return zuordnung.items.every((item) => (antworten[item.label] ?? '').trim().length > 0)
}
