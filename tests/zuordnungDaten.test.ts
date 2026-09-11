// tests/zuordnungDaten.test.ts
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Zuordnung } from '../src/types'

// Sammelt alle Zuordnungs-Objekte aus aufgaben/*.json und lernpaare/*.json.
function alleZuordnungen(): { quelle: string; id: string; z: Zuordnung }[] {
  const dataDir = join(__dirname, '..', 'public', 'data')
  const ergebnis: { quelle: string; id: string; z: Zuordnung }[] = []
  for (const ordner of ['aufgaben', 'lernpaare']) {
    const dir = join(dataDir, ordner)
    if (!existsSync(dir)) continue
    for (const datei of readdirSync(dir).filter((d) => d.endsWith('.json'))) {
      const liste = JSON.parse(readFileSync(join(dir, datei), 'utf8')) as {
        id: string
        zuordnung?: Zuordnung
      }[]
      for (const eintrag of liste) {
        if (eintrag.zuordnung)
          ergebnis.push({ quelle: `${ordner}/${datei}`, id: eintrag.id, z: eintrag.zuordnung })
      }
    }
  }
  return ergebnis
}

describe('Zuordnungs-Datenqualität', () => {
  const alle = alleZuordnungen()

  it('es gibt Zuordnungs-Einträge', () => expect(alle.length).toBeGreaterThan(0))

  it.each(alle.map((e) => [`${e.quelle} → ${e.id}`, e] as const))(
    '%s: Ziffern eindeutig, korrekt-Verweise gültig, Labels eindeutig',
    (_, e) => {
      const nrs = e.z.ziffern.map((z) => z.nr)
      expect(new Set(nrs).size).toBe(nrs.length) // keine doppelten Ziffern
      const labels = e.z.items.map((i) => i.label)
      expect(new Set(labels).size).toBe(labels.length) // keine doppelten Labels
      for (const item of e.z.items) {
        expect(nrs).toContain(item.korrekt) // jede Lösung zeigt auf eine echte Ziffer
      }
      // Mehr Ziffern als Items ODER gleich viele: eine Legende, die kleiner ist
      // als die Item-Zahl, erzwingt Doppelverwendung — erlaubt, aber prüfen,
      // dass mindestens 2 Ziffern zur Wahl stehen.
      expect(nrs.length).toBeGreaterThanOrEqual(2)
    },
  )
})
