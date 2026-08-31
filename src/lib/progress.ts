import { getItem, setItem } from './storage'
import type { Aufgabe } from '../types'

export interface SimulationsErgebnis {
  termin: string
  bereich: string
  punkte: number
  max: number
  note?: number // IHK-Note, wenn per KI korrigiert
  mitKI: boolean
  datum: string // ISO YYYY-MM-DD
}

export interface Fortschritt {
  erledigteAufgaben: string[] // Aufgaben-IDs
  quizErgebnisse: Record<string, { richtig: number; gesamt: number }> // key: themaId
  aufgabenStatistik: Record<string, { richtig: number; falsch: number }> // key: aufgabeId
  simulationen: SimulationsErgebnis[]
  streak: { letzterTag: string; tage: number }
}

const KEY = 'kbm.v1.fortschritt'

const DEFAULT: Fortschritt = {
  erledigteAufgaben: [],
  quizErgebnisse: {},
  aufgabenStatistik: {},
  simulationen: [],
  streak: { letzterTag: '', tage: 0 },
}

export function ladeFortschritt(): Fortschritt {
  const roh = getItem<Partial<Fortschritt>>(KEY)
  // Ältere Speicherstände um neue Felder ergänzen (sanfte Migration).
  return { ...structuredClone(DEFAULT), ...roh } as Fortschritt
}

function speichern(f: Fortschritt): Fortschritt {
  setItem(KEY, f)
  return f
}

function gestern(heute: string): string {
  const d = new Date(`${heute}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function aktualisiereStreak(f: Fortschritt, heute: string): Fortschritt {
  if (f.streak.letzterTag === heute) return f
  const tage = f.streak.letzterTag === gestern(heute) ? f.streak.tage + 1 : 1
  return { ...f, streak: { letzterTag: heute, tage } }
}

export function merkeErledigt(aufgabeId: string, heute: string): Fortschritt {
  let f = ladeFortschritt()
  if (!f.erledigteAufgaben.includes(aufgabeId)) {
    f = { ...f, erledigteAufgaben: [...f.erledigteAufgaben, aufgabeId] }
  }
  return speichern(aktualisiereStreak(f, heute))
}

export function merkeQuiz(
  themaId: string,
  richtig: number,
  gesamt: number,
  heute: string,
): Fortschritt {
  let f = ladeFortschritt()
  const bisher = f.quizErgebnisse[themaId] ?? { richtig: 0, gesamt: 0 }
  f = {
    ...f,
    quizErgebnisse: {
      ...f.quizErgebnisse,
      [themaId]: { richtig: bisher.richtig + richtig, gesamt: bisher.gesamt + gesamt },
    },
  }
  return speichern(aktualisiereStreak(f, heute))
}

// Merkt sich pro Aufgabe, wie oft sie richtig/falsch beantwortet wurde —
// Grundlage für „Deine Problem-Aufgaben" auf der Lernstand-Seite.
export function merkeAufgabenErgebnis(
  aufgabeId: string,
  richtig: boolean,
  heute: string,
): Fortschritt {
  let f = ladeFortschritt()
  const bisher = f.aufgabenStatistik[aufgabeId] ?? { richtig: 0, falsch: 0 }
  f = {
    ...f,
    aufgabenStatistik: {
      ...f.aufgabenStatistik,
      [aufgabeId]: {
        richtig: bisher.richtig + (richtig ? 1 : 0),
        falsch: bisher.falsch + (richtig ? 0 : 1),
      },
    },
  }
  if (!f.erledigteAufgaben.includes(aufgabeId)) {
    f = { ...f, erledigteAufgaben: [...f.erledigteAufgaben, aufgabeId] }
  }
  return speichern(aktualisiereStreak(f, heute))
}

// Speichert ein Simulations-Ergebnis; gleicher Termin + gleicher Tag wird
// überschrieben (z. B. wenn die KI-Korrektur das Ergebnis präzisiert).
export function merkeSimulation(e: SimulationsErgebnis): Fortschritt {
  let f = ladeFortschritt()
  const rest = f.simulationen.filter(
    (s) => !(s.termin === e.termin && s.bereich === e.bereich && s.datum === e.datum),
  )
  f = { ...f, simulationen: [...rest, e] }
  return speichern(aktualisiereStreak(f, e.datum))
}

export function bereichsFortschritt(f: Fortschritt, aufgaben: Aufgabe[]): number {
  if (aufgaben.length === 0) return 0
  const erledigt = new Set(f.erledigteAufgaben)
  const anzahl = aufgaben.filter((a) => erledigt.has(a.id)).length
  return anzahl / aufgaben.length
}

export function heuteISO(): string {
  return new Date().toISOString().slice(0, 10)
}
