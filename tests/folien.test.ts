import { describe, it, expect } from 'vitest'
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
