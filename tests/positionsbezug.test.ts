import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Optionen werden zur Laufzeit gemischt (mischeOptionen) — Lösungs-/Erklärungs-
// texte dürfen deshalb nie auf Positionen verweisen. Vorerst nur KBZ;
// WiSo hat noch 153 Altfälle (audit-report, eigene Runde).
const MUSTER = /\b(Antwort|Option)\s*\d|\b(erste|zweite|dritte|vierte|fünfte|letzte)n?\s+(Option|Antwort)/i

function eintraege(datei: string) {
  return JSON.parse(readFileSync(join(__dirname, '..', 'public', 'data', datei), 'utf8')) as {
    id: string
    optionen?: string[]
    loesung?: string
    erklaerung?: string
  }[]
}

describe('Keine Positionsbezüge in KBZ-Lösungen', () => {
  for (const datei of ['aufgaben/kbz.json', 'lernpaare/kbz.json']) {
    it(datei, () => {
      const treffer = eintraege(datei)
        .filter((e) => e.optionen?.length)
        .filter((e) => MUSTER.test(`${e.loesung ?? ''}\n${e.erklaerung ?? ''}`))
        .map((e) => e.id)
      expect(treffer).toEqual([])
    })
  }
})
