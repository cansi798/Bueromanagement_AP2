import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Optionen werden zur Laufzeit gemischt (mischeOptionen) — Lösungs-/Erklärungs-
// texte dürfen deshalb nie auf Positionen verweisen. Vorerst nur KBZ;
// WiSo hat noch 153 Altfälle (audit-report, eigene Runde).
const MUSTER =
  /\b(Antwort|Option)\s*\d|\b(erste|zweite|dritte|vierte|fünfte|letzte)n?\s+(Option|Antwort)|\bAussage\s*\d|\bKennziffern?\s*\[/i

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

// MC-Aufgaben ohne `erklaerung` zeigen ihre `loesung` als Begründung an
// (begruendungMC) — dort sind Positionsbezüge in allen Bereichen tabu.
describe('Angezeigte MC-Begründungen ohne Positionsbezug (alle Bereiche)', () => {
  for (const bereich of ['wiso', 'kbz', 'buchfuehrung']) {
    it(`aufgaben/${bereich}.json`, () => {
      const treffer = eintraege(`aufgaben/${bereich}.json`)
        .filter((e) => e.optionen?.length && !e.erklaerung?.trim())
        .filter((e) => MUSTER.test(e.loesung ?? ''))
        .map((e) => e.id)
      expect(treffer).toEqual([])
    })
  }
})

describe('Jede MC-Aufgabe hat eine anzeigbare Begründung', () => {
  for (const bereich of ['wiso', 'kbz', 'buchfuehrung']) {
    it(`aufgaben/${bereich}.json`, () => {
      const ohne = eintraege(`aufgaben/${bereich}.json`)
        .filter((e) => e.optionen?.length)
        .filter((e) => !(e.erklaerung?.trim() || e.loesung?.trim()))
        .map((e) => e.id)
      expect(ohne).toEqual([])
    })
  }
})

it('wiso-2024w-a13: Wertung laut IHK-Lösungshinweis (2) und Originalwortlaut', () => {
  const e = eintraege('aufgaben/wiso.json').find((x) => x.id === 'wiso-2024w-a13') as unknown as {
    optionen: string[]
    korrekt: number[]
  }
  expect(e.korrekt).toEqual([1])
  expect(e.optionen[2]).toContain('auf den Markt kommen')
})
