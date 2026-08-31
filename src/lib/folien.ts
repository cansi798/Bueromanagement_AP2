import type { Thema } from '../types'

// Zerlegt den Lernzettel eines Themas in Präsentationsfolien:
// Titelfolie → je „## Überschrift" eine Inhaltsfolie → Eselsbrücken → Selbstcheck.
export interface Folie {
  art: 'titel' | 'inhalt' | 'esel' | 'check'
  titel: string
  markdown?: string
  punkte?: string[]
  themaId: string
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
