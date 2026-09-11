import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import ZuordnungFelder from '../src/components/ZuordnungFelder'
import type { Zuordnung } from '../src/types'

const zuordnung: Zuordnung = {
  ziffern: [
    { nr: 1, text: 'Komplementäre Ziele' },
    { nr: 2, text: 'Konkurrierende Ziele' },
  ],
  items: [
    { label: 'a', text: 'Gewinn – Klimaabgabe', korrekt: 2 },
    { label: 'b', text: 'Fortbildung – Verkauf', korrekt: 1 },
  ],
}

describe('ZuordnungFelder', () => {
  it('zeigt Legende, Zeilen und Eingabefelder vor der Abgabe', () => {
    const html = renderToString(
      <ZuordnungFelder zuordnung={zuordnung} antworten={{}} onAntwort={() => {}} abgegeben={false} />,
    )
    expect(html).toContain('Komplementäre Ziele')
    expect(html).toContain('Gewinn – Klimaabgabe')
    expect(html).toContain('<select')
    expect(html).toContain('Konkurrierende Ziele')
  })

  it('zeigt nach der Abgabe die korrekte Ziffer an falschen Zeilen', () => {
    const html = renderToString(
      <ZuordnungFelder
        zuordnung={zuordnung}
        antworten={{ a: '2', b: '2' }}
        onAntwort={() => {}}
        abgegeben={true}
      />,
    )
    // Zeile b ist falsch beantwortet → die richtige Ziffer 1 wird gezeigt.
    // (SSR fügt zwischen Text und Interpolation einen <!-- -->-Kommentar ein.)
    expect(html).toMatch(/richtig: (<!-- -->)?1/)
    // Zeile a stimmt → kein Korrekturhinweis für Ziffer 2.
    expect(html).not.toMatch(/richtig: (<!-- -->)?2/)
  })

  it('sperrt die Eingabefelder nach der Abgabe', () => {
    const html = renderToString(
      <ZuordnungFelder
        zuordnung={zuordnung}
        antworten={{ a: '2', b: '1' }}
        onAntwort={() => {}}
        abgegeben={true}
      />,
    )
    expect(html).toMatch(/<select[^>]*disabled/)
  })
})
