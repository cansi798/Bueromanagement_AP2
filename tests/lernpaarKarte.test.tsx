import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import LernpaarKarte from '../src/components/LernpaarKarte'
import type { Lernpaar } from '../src/types'

const mcPaar: Lernpaar = {
  id: 'wiso-lp-test-01',
  themaId: 'test',
  bereich: 'wiso',
  frage: 'Was ist richtig?',
  optionen: ['Antwort A', 'Antwort B'],
  korrekt: [0],
  erklaerung: 'Darum.',
}

const zuordnungPaar: Lernpaar = {
  id: 'wiso-lp-test-02',
  themaId: 'test',
  bereich: 'wiso',
  typ: 'zuordnung',
  frage: 'Ordnen Sie zu!',
  zuordnung: {
    ziffern: [
      { nr: 1, text: 'Komplementär' },
      { nr: 2, text: 'Konkurrierend' },
    ],
    items: [
      { label: 'a', text: 'Gewinn – Klimaabgabe', korrekt: 2 },
      { label: 'b', text: 'Fortbildung – Verkauf', korrekt: 1 },
    ],
  },
  erklaerung: 'Darum.',
}

describe('LernpaarKarte', () => {
  it('rendert MC-Paare weiterhin als Antwortoptionen', () => {
    const html = renderToString(
      <LernpaarKarte
        paar={mcPaar}
        optionen={mcPaar.optionen!}
        korrekt={mcPaar.korrekt!}
        fach={null}
        onErgebnis={() => {}}
        onWeiter={() => {}}
      />,
    )
    expect(html).toContain('Antwort A')
    expect(html).not.toContain('<input')
  })

  it('rendert Zuordnungs-Paare mit Ziffernfeldern statt Optionen', () => {
    const html = renderToString(
      <LernpaarKarte
        paar={zuordnungPaar}
        optionen={[]}
        korrekt={[]}
        fach={null}
        onErgebnis={() => {}}
        onWeiter={() => {}}
      />,
    )
    expect(html).toContain('<input')
    expect(html).toContain('Konkurrierend')
    expect(html).toContain('Gewinn – Klimaabgabe')
  })
})
