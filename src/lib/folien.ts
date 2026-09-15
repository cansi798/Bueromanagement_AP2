import type { Aufgabe, Lernpaar, Thema } from '../types'

// Zerlegt den Lernzettel eines Themas in Präsentationsfolien:
// Titelfolie → je „## Überschrift" eine Inhaltsfolie → Eselsbrücken → Selbstcheck.
export interface Folie {
  art: 'titel' | 'inhalt' | 'esel' | 'check' | 'diagramm' | 'quiz'
  titel: string
  markdown?: string
  punkte?: string[]
  themaId: string
  aufgabeId?: string // nur art 'quiz'
}

export function folienAusThema(t: Thema): Folie[] {
  const folien: Folie[] = [{ art: 'titel', titel: t.name, markdown: t.beschreibung, themaId: t.id }]

  const teile = t.lernzettel
    .split(/\n(?=##\s)/)
    .map((s) => s.trim())
    .filter(Boolean)

  for (const teil of teile) {
    const m = teil.match(/^##\s+(.+)\n?/)
    if (m) {
      folien.push({
        art: 'inhalt',
        titel: m[1].trim(),
        markdown: teil.slice(m[0].length).trim(),
        themaId: t.id,
      })
    } else {
      folien.push({ art: 'inhalt', titel: t.name, markdown: teil, themaId: t.id })
    }
  }

  if (t.eselsbruecken.length > 0) {
    folien.push({ art: 'esel', titel: 'Eselsbrücken 💡', punkte: t.eselsbruecken, themaId: t.id })
  }
  if (t.selbstcheck.length > 0) {
    folien.push({ art: 'check', titel: 'Selbstcheck ✅', punkte: t.selbstcheck, themaId: t.id })
  }
  return folien
}

// Lernpaar als Aufgaben-Folie — unterstützt MC und Zuordnung.
// (Aus Praesentation.tsx hierher gezogen, damit die Auswahl testbar ist.)
export function alsAufgabe(p: Lernpaar): Aufgabe {
  return {
    id: p.id,
    themaId: p.themaId,
    bereich: p.bereich,
    quelle: 'generiert',
    typ: p.typ ?? 'mc',
    text: p.frage,
    optionen: p.optionen,
    korrekt: p.korrekt,
    zuordnung: p.zuordnung,
    loesung: p.erklaerung,
    erklaerung: p.erklaerung,
  }
}

// Quizfolien eines Themas: Original-/abgeleitete Aufgaben zuerst, mit
// Lernpaaren aufgefüllt, hart gedeckelt — sonst ertrinken die Inhaltsfolien
// (WiSo hätte sonst ~70 Quizfolien pro Thema). Stabil sortiert, kein Zufall.
export function waehleQuizfolien(
  aufgaben: Aufgabe[],
  lernpaare: Lernpaar[],
  themaId: string,
  max = 8,
): Aufgabe[] {
  const originale = aufgaben
    .filter((a) => a.themaId === themaId && (a.typ === 'mc' || a.typ === 'zuordnung'))
    .sort((a, b) => a.id.localeCompare(b.id))
  const ergaenzung = lernpaare
    .filter((p) => p.themaId === themaId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(alsAufgabe)
  return [...originale, ...ergaenzung].slice(0, max)
}
