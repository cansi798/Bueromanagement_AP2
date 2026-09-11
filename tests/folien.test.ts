import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { FOLIEN_DIAGRAMME } from '../src/components/diagramme'
import { folienAusThema } from '../src/lib/folien'
import type { Thema } from '../src/types'

const thema: Thema = {
  id: 'test-thema',
  bereich: 'wiso',
  name: 'Testthema',
  beschreibung: 'Kurzbeschreibung.',
  haeufigkeit: [],
  lernzettel: 'Einleitung ohne Überschrift.\n## Teil A\nInhalt A.\n## Teil B\nInhalt B.',
  eselsbruecken: ['Merke dir X.'],
  selbstcheck: ['Frage 1?', 'Frage 2?'],
}

describe('folienAusThema', () => {
  it('erzeugt Titel-, Inhalts-, Eselsbrücken- und Selbstcheck-Folien', () => {
    const f = folienAusThema(thema)
    expect(f.map((x) => x.art)).toEqual(['titel', 'inhalt', 'inhalt', 'inhalt', 'esel', 'check'])
    expect(f[0].titel).toBe('Testthema')
    expect(f[2].titel).toBe('Teil A')
    expect(f[2].markdown).toBe('Inhalt A.')
    expect(f[4].punkte).toEqual(['Merke dir X.'])
  })

  it('kommt mit leeren Eselsbrücken/Selbstchecks klar', () => {
    const f = folienAusThema({ ...thema, eselsbruecken: [], selbstcheck: [], lernzettel: 'Nur Text.' })
    expect(f.map((x) => x.art)).toEqual(['titel', 'inhalt'])
  })
})

describe('FOLIEN_DIAGRAMME-Registry', () => {
  it('jeder Registry-Schlüssel existiert als ##-Abschnitt in einem Lernzettel', () => {
    const dataDir = join(__dirname, '..', 'public', 'data', 'themen')
    const titel = new Set<string>()
    for (const bereich of ['wiso', 'kbz', 'buchfuehrung', 'muendlich']) {
      const pfad = join(dataDir, `${bereich}.json`)
      if (!existsSync(pfad)) continue
      const themen = JSON.parse(readFileSync(pfad, 'utf8')) as Thema[]
      for (const t of themen) {
        for (const m of t.lernzettel.matchAll(/^##\s+(.+)$/gm)) titel.add(m[1].trim())
      }
    }
    for (const key of Object.keys(FOLIEN_DIAGRAMME)) {
      for (const abschnitt of Object.keys(FOLIEN_DIAGRAMME[key])) {
        expect(titel, `Registry-Schlüssel ohne passenden ##-Abschnitt: "${abschnitt}"`).toContain(abschnitt)
      }
    }
  })
})
