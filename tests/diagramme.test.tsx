import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIAGRAMME } from '../src/components/diagramme'

// Jedes Übersichtsdiagramm muss serverseitig fehlerfrei rendern und echte
// SVG-Ausgabe erzeugen (fängt Laufzeitfehler in den Zeichenfunktionen).
describe('DIAGRAMME rendern', () => {
  for (const [themaId, D] of Object.entries(DIAGRAMME)) {
    it(`${themaId} rendert SVG`, () => {
      const html = renderToString(<>{D()}</>)
      expect(html).toContain('<svg')
      expect(html.length).toBeGreaterThan(300)
    })
  }
})

describe('WiSo-Abdeckung', () => {
  for (const id of [
    'produktionsfaktoren-unternehmensziele', 'rechtsformen-vollmachten',
    'finanzierung-kreditsicherung', 'arbeitsschutz-umwelt',
    'datenschutz-digitales-arbeiten', 'prozesse-epk',
    'unternehmensorganisation', 'projektmanagement',
  ]) {
    it(`${id} hat ein Diagramm`, () => expect(DIAGRAMME[id]).toBeDefined())
  }
})

describe('KBZ/BuFü-Abdeckung', () => {
  for (const id of [
    'kundenkommunikation', 'personalwirtschaft',
    'stueckkosten-kostenrechnung', 'normalkosten-kostenabweichung',
  ]) {
    it(`${id} hat ein Diagramm`, () => expect(DIAGRAMME[id]).toBeDefined())
  }
})

describe('Mündlich-Abdeckung', () => {
  for (const id of [
    'report-schreiben', 'gespraechstechnik',
    'wq-auftragssteuerung', 'wq-kmu',
    'wq-einkauf-logistik', 'wq-marketing-vertrieb',
    'wq-personalwirtschaft', 'wq-assistenz-sekretariat',
  ]) {
    it(`${id} hat ein Diagramm`, () => expect(DIAGRAMME[id]).toBeDefined())
  }
})

describe('Vollständigkeit', () => {
  it('JEDES Thema hat ein Übersichtsdiagramm', () => {
    const fehlend: string[] = []
    for (const b of ['wiso', 'kbz', 'buchfuehrung', 'muendlich']) {
      const themen = JSON.parse(
        readFileSync(join(__dirname, '..', 'public', 'data', 'themen', `${b}.json`), 'utf8'),
      )
      for (const t of themen) if (!DIAGRAMME[t.id]) fehlend.push(`${b}/${t.id}`)
    }
    expect(fehlend, `Themen ohne Diagramm: ${fehlend.join(', ')}`).toEqual([])
  })
})
