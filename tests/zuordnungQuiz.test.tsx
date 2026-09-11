import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import ZuordnungQuiz from '../src/components/ZuordnungQuiz'
import type { Aufgabe } from '../src/types'

const aufgabe: Aufgabe = {
  id: 'wiso-test-z1',
  themaId: 'test',
  bereich: 'wiso',
  quelle: 'original',
  termin: '2024-sommer',
  typ: 'zuordnung',
  text: 'Ordnen Sie die Zielpaare zu!',
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
  loesung: 'a) 2, b) 1',
}

describe('ZuordnungQuiz', () => {
  it('rendert Aufgabentext, Ziffernfelder und Prüfen-Knopf', () => {
    const html = renderToString(<ZuordnungQuiz aufgabe={aufgabe} onErgebnis={() => {}} />)
    expect(html).toContain('Ordnen Sie die Zielpaare zu!')
    expect(html).toContain('<select')
    expect(html).toContain('Prüfen')
  })

  it('rendert nichts ohne zuordnung-Daten', () => {
    const html = renderToString(
      <ZuordnungQuiz aufgabe={{ ...aufgabe, zuordnung: undefined }} onErgebnis={() => {}} />,
    )
    expect(html).toBe('')
  })
})
