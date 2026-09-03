import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import AnlagenDiagramm from '../src/components/AnlagenDiagramm'
import type { AnlagenDiagramm as Spec } from '../src/types'

// Rendert jeden Diagrammtyp serverseitig: fängt Laufzeitfehler in den
// Builder-Funktionen ab und prüft, dass Rough-Pfade entstehen.
function render(diagramm: Spec): string {
  return renderToString(<AnlagenDiagramm diagramm={diagramm} />)
}

describe('AnlagenDiagramm', () => {
  it('rendert Linien-Diagramme', () => {
    const html = render({
      typ: 'linie',
      titel: 'Test',
      serien: [{ name: 'A', punkte: [{ x: '1', y: 1 }, { x: '2', y: 2 }] }],
    })
    expect(html).toContain('<path')
  })

  it('rendert Organigramme mit Stabstelle', () => {
    const html = render({
      typ: 'organigramm',
      titel: 'Orga',
      knoten: [
        { id: 'gf', text: 'Geschäftsführung\nChef' },
        { id: 'stab', text: 'Stab', unter: 'gf', stab: true },
        { id: 'a', text: 'Abteilung A', unter: 'gf' },
        { id: 'b', text: 'Abteilung B', unter: 'gf' },
        { id: 'a1', text: 'Team A1', unter: 'a' },
      ],
    })
    expect(html).toContain('<path')
    expect(html).toContain('Abteilung A')
    expect(html).toContain('Stab')
  })

  it('rendert Schilder-Raster mit allen Formen', () => {
    const html = render({
      typ: 'schilder',
      titel: 'Zeichen',
      zeichen: [
        { nr: '1', form: 'kreis', farbe: 'rot', innen: 'X' },
        { nr: '2', form: 'dreieck', farbe: 'gelb' },
        { nr: '3', form: 'quadrat', farbe: 'gruen', text: 'unten\nzweizeilig' },
        { nr: '4', form: 'raute', farbe: 'weiss' },
        { nr: '5', form: 'sechseck', farbe: 'grau' },
        { nr: '6', form: 'rechteck' },
      ],
    })
    expect(html).toContain('<path')
    expect(html).toContain('zweizeilig')
  })

  it('rendert Kreislauf-Varianten mit Pfeilen in beide Richtungen', () => {
    const html = render({
      typ: 'kreislauf',
      titel: 'Wirtschaftskreislauf',
      varianten: [
        {
          name: 'Skizze 1',
          stroeme: [
            { text: 'Konsumausgaben', richtung: 'links' },
            { text: 'Konsumgüter', richtung: 'rechts' },
          ],
        },
      ],
    })
    expect(html).toContain('Skizze 1')
    expect(html).toContain('Unternehmen')
    expect(html).toContain('Haushalte')
    expect(html).toContain('<path')
  })
})
