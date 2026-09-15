import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { FOLIEN_DIAGRAMME } from '../src/components/diagramme'
import { folienAusThema, waehleQuizfolien } from '../src/lib/folien'
import type { Aufgabe, Lernpaar, Thema } from '../src/types'

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

function aufgabe(id: string, themaId = 't1'): Aufgabe {
  return { id, themaId, bereich: 'wiso', quelle: 'original', typ: 'mc', text: id, optionen: ['a', 'b'], korrekt: [0], loesung: '', erklaerung: '' } as Aufgabe
}

function lernpaar(id: string, themaId = 't1'): Lernpaar {
  return { id, themaId, bereich: 'wiso', frage: id, optionen: ['a', 'b'], korrekt: [0], erklaerung: '' } as Lernpaar
}

describe('waehleQuizfolien', () => {
  const aufgaben = ['a3', 'a1', 'a2'].map((id) => aufgabe(id))
  const lernpaare = ['p2', 'p1', 'p3', 'p4', 'p5', 'p6', 'p7'].map((id) => lernpaar(id))

  it('begrenzt auf max. 8 und stellt Original-Aufgaben nach vorn', () => {
    const f = waehleQuizfolien(aufgaben, lernpaare, 't1')
    expect(f).toHaveLength(8)
    expect(f.slice(0, 3).map((a) => a.id)).toEqual(['a1', 'a2', 'a3'])
    expect(f.slice(3).map((a) => a.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
  })

  it('sortiert stabil nach id (kein Zufall im Beamer-Einsatz)', () => {
    const a = waehleQuizfolien(aufgaben, lernpaare, 't1')
    const b = waehleQuizfolien(aufgaben, lernpaare, 't1')
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
  })

  it('filtert fremde Themen und Nicht-Quiz-Typen heraus', () => {
    const gemischt = [...aufgaben, aufgabe('x9', 'anderes'), { ...aufgabe('r1'), typ: 'rechnen' } as Aufgabe]
    const f = waehleQuizfolien(gemischt, [], 't1')
    expect(f.map((a) => a.id)).toEqual(['a1', 'a2', 'a3'])
  })

  it('kommt mit weniger als 8 Fragen aus', () => {
    expect(waehleQuizfolien(aufgaben, [], 't1')).toHaveLength(3)
  })
})
