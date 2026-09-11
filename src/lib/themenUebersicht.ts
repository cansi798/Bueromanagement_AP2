// Aggregiert alle Übungsquellen (Themen-Quiz, Aufgaben-Statistik, Unterricht)
// zu einer sortierbaren Themen-Tabelle für den Lernstand.
import type { Fortschritt } from './progress'
import type { LernpaarStaende } from './lernquiz'
import { INTERVALLE } from './leitner'
import type { Aufgabe, Lernpaar, Thema } from '../types'

export interface ThemaZeile {
  themaId: string
  bereich: string
  name: string
  geuebt: number
  richtig: number
  falsch: number
  quote: number | null
  zuletzt: string | null
  gekonnt: boolean
}

function minusTage(datum: string, tage: number): string {
  const d = new Date(`${datum}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - tage)
  return d.toISOString().slice(0, 10)
}

export function baueThemenUebersicht(args: {
  themen: Thema[]
  aufgaben: Aufgabe[]
  lernpaare: Lernpaar[]
  fortschritt: Fortschritt
  staende: LernpaarStaende
}): ThemaZeile[] {
  const { themen, aufgaben, lernpaare, fortschritt, staende } = args
  const aufgabenProThema = new Map<string, Aufgabe[]>()
  for (const a of aufgaben) {
    if (!aufgabenProThema.has(a.themaId)) aufgabenProThema.set(a.themaId, [])
    aufgabenProThema.get(a.themaId)!.push(a)
  }
  const paareProThema = new Map<string, Lernpaar[]>()
  for (const p of lernpaare) {
    if (!paareProThema.has(p.themaId)) paareProThema.set(p.themaId, [])
    paareProThema.get(p.themaId)!.push(p)
  }

  return themen.map((t) => {
    const quiz = fortschritt.quizErgebnisse[t.id] ?? { richtig: 0, gesamt: 0 }
    let richtig = quiz.richtig
    let geuebt = quiz.gesamt
    for (const a of aufgabenProThema.get(t.id) ?? []) {
      const s = fortschritt.aufgabenStatistik[a.id]
      if (!s) continue
      richtig += s.richtig
      geuebt += s.richtig + s.falsch
    }
    // Letzte Aktivität: Leitner-Antwortdatum (faelligAm − Intervall) oder Unterricht.
    let zuletzt: string | null = fortschritt.unterricht[t.id]?.abgeschlossen ?? null
    for (const p of paareProThema.get(t.id) ?? []) {
      const s = staende[p.id]
      if (!s) continue
      const beantwortet = minusTage(s.faelligAm, INTERVALLE[s.fach])
      if (!zuletzt || beantwortet > zuletzt) zuletzt = beantwortet
    }
    const falsch = geuebt - richtig
    const quote = geuebt > 0 ? richtig / geuebt : null
    return {
      themaId: t.id,
      bereich: t.bereich,
      name: t.name,
      geuebt,
      richtig,
      falsch,
      quote,
      zuletzt,
      gekonnt: quote !== null && quote >= 0.8 && geuebt >= 5,
    }
  })
}
