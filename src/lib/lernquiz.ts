// Leitner-Verwaltung für das Themen-Quiz (Lernpaare): eigener Speicher-Key,
// dieselbe Fächer-Logik wie bei den Karteikarten.
import { getItem, setItem } from './storage'
import type { KartenStand } from './leitner'
import { antworten, istFaellig, naechsteFaellige } from './leitner'
import type { Lernpaar } from '../types'

const KEY = 'kbm.v1.lernpaare'

export type LernpaarStaende = Record<string, KartenStand>

export function ladeLernpaarStaende(): LernpaarStaende {
  return getItem<LernpaarStaende>(KEY) ?? {}
}

export function merkeLernpaarAntwort(
  paarId: string,
  richtig: boolean,
  heute: string,
): LernpaarStaende {
  const staende = ladeLernpaarStaende()
  const neu = { ...staende, [paarId]: antworten(staende[paarId], richtig, heute) }
  setItem(KEY, neu)
  return neu
}

// Fällige Lernpaare eines Themas, sortiert wie bei den Karteikarten
// (neue zuerst, dann die am längsten überfälligen).
export function faelligeLernpaare(
  paare: Lernpaar[],
  staende: LernpaarStaende,
  heute: string,
): Lernpaar[] {
  const reihenfolge = naechsteFaellige(
    staende,
    paare.map((p) => p.id),
    heute,
  )
  const nachId = new Map(paare.map((p) => [p.id, p]))
  return reihenfolge.map((id) => nachId.get(id)!).filter(Boolean)
}

export interface ThemenQuizStand {
  gesamt: number
  faellig: number
  neu: number // noch nie beantwortet
  gemeistert: number // Fach 5
  fachSumme: number // Summe der Fächer, für Fortschrittsbalken
  proFach: [number, number, number, number, number] // Kartenzahl je Fach 1-5
}

export function themenQuizStand(
  paare: Lernpaar[],
  staende: LernpaarStaende,
  heute: string,
): ThemenQuizStand {
  let faellig = 0
  let neu = 0
  let gemeistert = 0
  let fachSumme = 0
  const proFach: ThemenQuizStand['proFach'] = [0, 0, 0, 0, 0]
  for (const p of paare) {
    const s = staende[p.id]
    if (istFaellig(s, heute)) faellig++
    if (!s) neu++
    else {
      fachSumme += s.fach
      proFach[s.fach - 1]++
      if (s.fach === 5) gemeistert++
    }
  }
  return { gesamt: paare.length, faellig, neu, gemeistert, fachSumme, proFach }
}

// Fortschritt 0..1: Anteil der maximal erreichbaren Fächer-Summe.
export function quizFortschritt(stand: ThemenQuizStand): number {
  if (stand.gesamt === 0) return 0
  return stand.fachSumme / (stand.gesamt * 5)
}

// Optionen wie „Keine der genannten Antworten" beziehen sich auf die übrigen
// Optionen und müssen an ihrem Platz (typisch: zuletzt) stehen bleiben.
const POSITIONSGEBUNDEN =
  /\b(keine[rs]?|alle)\s+(der\s+|die\s+)?(oben\s+genannten|genannten|übrigen|anderen|antworten|aussagen|optionen|antwortmöglichkeiten)\b/i

export function istPositionsgebunden(option: string): boolean {
  return POSITIONSGEBUNDEN.test(option)
}

// Fisher-Yates-Mischung mit neuer Index-Zuordnung; positionsgebundene
// Optionen bleiben stehen, nur die freien Plätze werden untereinander gemischt.
export function mischeOptionen(
  paar: Pick<Lernpaar, 'optionen' | 'korrekt'>,
): { optionen: string[]; korrekt: number[] } {
  const frei = paar.optionen
    .map((_, i) => i)
    .filter((i) => !istPositionsgebunden(paar.optionen[i]))
  const gemischt = [...frei]
  for (let i = gemischt.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[gemischt[i], gemischt[j]] = [gemischt[j], gemischt[i]]
  }
  const indizes = paar.optionen.map((_, i) => i)
  frei.forEach((platz, k) => {
    indizes[platz] = gemischt[k]
  })
  const optionen = indizes.map((alt) => paar.optionen[alt])
  const korrekt = paar.korrekt
    .map((alt) => indizes.indexOf(alt))
    .sort((a, b) => a - b)
  return { optionen, korrekt }
}
