import { getItem, setItem } from './storage'
import type { Aufgabe } from '../types'

export interface Fortschritt {
  erledigteAufgaben: string[] // Aufgaben-IDs
  quizErgebnisse: Record<string, { richtig: number; gesamt: number }> // key: themaId
  streak: { letzterTag: string; tage: number }
}

const KEY = 'kbm.v1.fortschritt'

const DEFAULT: Fortschritt = {
  erledigteAufgaben: [],
  quizErgebnisse: {},
  streak: { letzterTag: '', tage: 0 },
}

export function ladeFortschritt(): Fortschritt {
  return getItem<Fortschritt>(KEY) ?? structuredClone(DEFAULT)
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

export function bereichsFortschritt(f: Fortschritt, aufgaben: Aufgabe[]): number {
  if (aufgaben.length === 0) return 0
  const erledigt = new Set(f.erledigteAufgaben)
  const anzahl = aufgaben.filter((a) => erledigt.has(a.id)).length
  return anzahl / aufgaben.length
}

export function heuteISO(): string {
  return new Date().toISOString().slice(0, 10)
}
