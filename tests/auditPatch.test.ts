import { describe, expect, it } from 'vitest'
// @ts-expect-error — reines ESM-Skript ohne Typen
import { wendePatchesAn } from '../content-pipeline/audit-patch.mjs'

const basis = () => [
  { id: 'a', korrekt: [1], loesung: 'alt' },
  { id: 'b', themaId: 'x' },
]

describe('wendePatchesAn', () => {
  it('setzt Felder, wenn der Altwert passt', () => {
    const l = basis()
    const r = wendePatchesAn(l, [
      { datei: 'd', id: 'a', feld: 'korrekt', alt: [1], neu: [2], grund: 't' },
      { datei: 'd', id: 'b', feld: 'themaId', alt: 'x', neu: 'y', grund: 't' },
    ])
    expect(r).toEqual({ geaendert: 2, fehler: [] })
    expect(l[0].korrekt).toEqual([2])
    expect(l[1].themaId).toBe('y')
  })

  it('meldet abweichenden Altwert und unbekannte id ohne zu ändern', () => {
    const l = basis()
    const r = wendePatchesAn(l, [
      { datei: 'd', id: 'a', feld: 'loesung', alt: 'anders', neu: 'neu', grund: 't' },
      { datei: 'd', id: 'zz', feld: 'loesung', alt: undefined, neu: 'neu', grund: 't' },
    ])
    expect(r.geaendert).toBe(0)
    expect(r.fehler).toHaveLength(2)
    expect(l[0].loesung).toBe('alt')
  })

  it('löscht ein Feld bei neu: null und legt fehlende Felder an (alt: undefined)', () => {
    const l = basis()
    wendePatchesAn(l, [
      { datei: 'd', id: 'a', feld: 'loesung', alt: 'alt', neu: null, grund: 't' },
      { datei: 'd', id: 'b', feld: 'erklaerung', alt: undefined, neu: 'E', grund: 't' },
    ])
    expect('loesung' in l[0]).toBe(false)
    expect(l[1]).toMatchObject({ erklaerung: 'E' })
  })
})
