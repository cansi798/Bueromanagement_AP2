import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Aufgabe } from '../src/types'

// Verhindert „Verweis ins Leere": Nennt ein Aufgabentext eine Anlage/Abbildung,
// muss anlagenText oder anlagenDiagramm gesetzt sein (Befund 2026-09-16: 15 Lücken).
const VERWEIS =
  /siehe anlage|in der anlage|abgebildete|laut anlage|dem schaubild|im schaubild|abbildung|im organigramm|nachfolgende grafik|folgende grafik|dargestellten (nachfrage|angebots)/i

// Begriffe, die das Muster fälschlich trifft (Maschinen-„Anlagen" u. Ä.) — hier
// dokumentiert statt das Muster zu verwässern. Nur nach Einzelprüfung ergänzen!
const AUSNAHMEN = new Set<string>([
  // 'wiso-2024s-a5', // Beispiel: „Sortieranlage" = Maschine, keine Anlage i. S. v. Beilage
])

function ladeAlle(): Aufgabe[] {
  const alle: Aufgabe[] = []
  for (const b of ['wiso', 'kbz', 'buchfuehrung', 'muendlich']) {
    const roh = JSON.parse(
      readFileSync(join(__dirname, '..', 'public', 'data', 'aufgaben', `${b}.json`), 'utf8'),
    )
    alle.push(...(Array.isArray(roh) ? roh : roh.aufgaben))
  }
  return alle
}

describe('Anlagen-Verweise', () => {
  it('erkennt einen Verweis ohne Anlage (Detektor-Selbsttest)', () => {
    const kaputt = { id: 'x', text: 'Siehe Anlage 1.', anlagenText: undefined } as unknown as Aufgabe
    expect(VERWEIS.test(kaputt.text)).toBe(true)
  })

  it('kein Aufgabentext verweist auf eine fehlende Anlage', () => {
    const luecken = ladeAlle()
      .filter((a) => VERWEIS.test(a.text ?? ''))
      .filter((a) => !a.anlagenText && !a.anlagenDiagramm)
      .filter((a) => !AUSNAHMEN.has(a.id))
      .map((a) => a.id)
    expect(luecken, `Verweis ins Leere bei: ${luecken.join(', ')}`).toEqual([])
  })
})
