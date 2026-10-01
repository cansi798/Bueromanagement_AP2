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

// Betrag 5.000 € ohne führende Ziffer (nicht 15.000 / 25.000).
const FUENFTAUSEND = /(?<![\d.])5\.000(,00)?\s*€/

describe('Rechtsstand 2026', () => {
  it('Amtsgericht-Streitwertgrenze ist 10.000 € (§ 23 GVG, seit 01.01.2026)', () => {
    const veraltet = alleTexte().filter(
      (t) =>
        !t.istOption &&
        /(Amts|Land)gericht|Streitwert/i.test(t.text) &&
        FUENFTAUSEND.test(t.text) &&
        !/Zum Prüfungszeitpunkt/.test(t.text),
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
})
