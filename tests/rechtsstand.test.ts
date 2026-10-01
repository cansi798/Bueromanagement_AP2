import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

type Text = { quelle: string; id: string; text: string; istOption: boolean }

// Alle Strings (rekursiv) aus aufgaben/, lernpaare/, themen/ mit Eintrags-id.
// istOption markiert Strings aus `optionen` (Distraktoren dürfen Altwerte nennen).
function alleTexte(): Text[] {
  const raus: Text[] = []
  const dataDir = join(__dirname, '..', 'public', 'data')
  for (const ordner of ['aufgaben', 'lernpaare', 'themen']) {
    for (const datei of readdirSync(join(dataDir, ordner)).filter((d) => d.endsWith('.json'))) {
      const liste = JSON.parse(readFileSync(join(dataDir, ordner, datei), 'utf8')) as { id: string }[]
      for (const e of liste) {
        const sammle = (o: unknown, istOption = false): void => {
          if (typeof o === 'string') raus.push({ quelle: `${ordner}/${datei}`, id: e.id, text: o, istOption })
          else if (Array.isArray(o)) o.forEach((x) => sammle(x, istOption))
          else if (o && typeof o === 'object')
            Object.entries(o).forEach(([k, v]) => sammle(v, istOption || k === 'optionen'))
        }
        sammle(e)
      }
    }
  }
  return raus
}

// KBZ-Texte (ohne Optionen) — für Regeln, deren Altfälle nur im KBZ-Audit geprüft sind.
const KBZ = /^(aufgaben|lernpaare|themen)\/kbz\.json$/
const kbzTexte = () => alleTexte().filter((t) => KBZ.test(t.quelle) && !t.istOption)

// Satzweise Zerlegung (Satzende oder Zeilenumbruch).
const saetze = (text: string) => text.split(/(?<=[.!?])\s+|\n+/)

// Betrag 5.000 € ohne führende Ziffer (nicht 15.000 / 25.000).
const FUENFTAUSEND = /(?<![\d.])5\.000(,00)?\s*€/

describe('Rechtsstand 2026', () => {
  it('Amtsgericht-Streitwertgrenze ist 10.000 € (§ 23 GVG, seit 01.01.2026)', () => {
    const veraltet = alleTexte().filter(
      (t) =>
        !t.istOption &&
        /(Amts|Land)gericht|Streitwert/i.test(t.text) &&
        FUENFTAUSEND.test(t.text) &&
        !/Zum Prüfungszeitpunkt|Bis 31\.12\.2025/.test(t.text),
    )
    expect(veraltet.map((t) => `${t.quelle}:${t.id}`)).toEqual([])
  })

  it('richtige Optionen nennen keine veraltete Streitwertgrenze', () => {
    const dataDir = join(__dirname, '..', 'public', 'data')
    const falsch: string[] = []
    for (const datei of ['aufgaben/kbz.json', 'lernpaare/kbz.json']) {
      const liste = JSON.parse(readFileSync(join(dataDir, datei), 'utf8')) as {
        id: string; optionen?: string[]; korrekt?: number[]
      }[]
      for (const e of liste)
        for (const i of e.korrekt ?? []) {
          const o = e.optionen?.[i] ?? ''
          if (FUENFTAUSEND.test(o) && /gericht/i.test(o)) falsch.push(e.id)
        }
    }
    expect(falsch).toEqual([])
  })

  it('Buchungsbelege/Rechnungen: 8 Jahre Aufbewahrung (BEG IV, seit 01.01.2025)', () => {
    // Satzweise: Beleg/Rechnung + „10 Jahre" im selben Satz ist veraltet —
    // außer der Satz nennt zugleich die 8 Jahre bzw. ist ein Prüfungszeitpunkt-Vermerk.
    // (10 Jahre bleiben richtig für Handelsbücher, Inventare, Jahresabschlüsse.)
    const veraltet: string[] = []
    for (const t of kbzTexte())
      for (const s of saetze(t.text))
        if (
          /Beleg|Rechnung|(Eingangs|Ausgangs)rechnung/.test(s) &&
          /\b(10|zehn)\s*Jahre/i.test(s) &&
          !/\b(8|acht)\s*(Jahre|Belege)/i.test(s) &&
          !/Zum Prüfungszeitpunkt/.test(s)
        )
          veraltet.push(`${t.quelle}:${t.id}`)
    expect(veraltet).toEqual([])
  })

  it('Betroffenenrechte: DSGVO statt BDSG a. F. (seit 25.05.2018)', () => {
    const veraltet = kbzTexte().filter(
      (t) =>
        /BDSG|Bundesdatenschutzgesetz/.test(t.text) &&
        /Auskunft|Berichtigung|Löschung|Sperrung|Rechte/.test(t.text) &&
        !/DSGVO|Datenschutz-Grundverordnung/.test(t.text),
    )
    expect(veraltet.map((t) => `${t.quelle}:${t.id}`)).toEqual([])
  })
})
