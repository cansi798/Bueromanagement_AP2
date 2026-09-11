import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import ThemenTabelle from '../src/components/ThemenTabelle'
import type { ThemaZeile } from '../src/lib/themenUebersicht'

const zeilen: ThemaZeile[] = [
  { themaId: 't1', bereich: 'wiso', name: 'Sozialversicherung', geuebt: 10, richtig: 9,
    falsch: 1, quote: 0.9, zuletzt: '2026-09-10', gekonnt: true },
  { themaId: 't2', bereich: 'kbz', name: 'Organigramm', geuebt: 4, richtig: 1,
    falsch: 3, quote: 0.25, zuletzt: null, gekonnt: false },
  { themaId: 't3', bereich: 'wiso', name: 'Tarifvertrag', geuebt: 0, richtig: 0,
    falsch: 0, quote: null, zuletzt: null, gekonnt: false },
]

describe('ThemenTabelle', () => {
  it('zeigt alle Zeilen mit Name, Zählern und Quote', () => {
    const html = renderToString(<ThemenTabelle zeilen={zeilen} bereichName={(b) => b} />)
    expect(html).toContain('Sozialversicherung')
    expect(html).toContain('Organigramm')
    expect(html).toContain('90')
    expect(html).toContain('25')
  })

  it('nicht geübte Themen zeigen einen Strich statt Quote', () => {
    const html = renderToString(<ThemenTabelle zeilen={zeilen} bereichName={(b) => b} />)
    expect(html).toContain('Tarifvertrag')
    expect(html).toContain('—')
  })
})
