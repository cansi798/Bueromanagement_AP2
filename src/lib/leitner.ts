// Leitner-System: 5 Fächer mit wachsenden Wiederholungsintervallen (Tage).
// Richtig beantwortet ⇒ ein Fach höher, falsch ⇒ zurück in Fach 1.

export interface KartenStand {
  fach: 1 | 2 | 3 | 4 | 5
  faelligAm: string // ISO-Datum YYYY-MM-DD
}

export const INTERVALLE = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 } as const

function plusTage(datum: string, tage: number): string {
  const d = new Date(`${datum}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + tage)
  return d.toISOString().slice(0, 10)
}

export function antworten(
  stand: KartenStand | undefined,
  richtig: boolean,
  heute: string,
): KartenStand {
  const aktuellesFach = stand?.fach ?? 1
  const fach = (richtig ? Math.min(aktuellesFach + 1, 5) : 1) as KartenStand['fach']
  return { fach, faelligAm: plusTage(heute, INTERVALLE[fach]) }
}

export function istFaellig(stand: KartenStand | undefined, heute: string): boolean {
  if (!stand) return true // neue Karte
  return stand.faelligAm <= heute
}

export function naechsteFaellige(
  staende: Record<string, KartenStand>,
  ids: string[],
  heute: string,
): string[] {
  const faellige = ids.filter((id) => istFaellig(staende[id], heute))
  // Neue Karten (ohne Stand) zuerst, dann die am längsten überfälligen.
  return faellige.sort((a, b) => {
    const sa = staende[a]
    const sb = staende[b]
    if (!sa && !sb) return 0
    if (!sa) return -1
    if (!sb) return 1
    return sa.faelligAm.localeCompare(sb.faelligAm)
  })
}
