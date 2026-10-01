import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Eine Zeile "+ Materialgemeinkosten …" wird in Markdown zum Listenpunkt —
// das Pluszeichen verschwindet. In ```-Codeblöcken ist es unkritisch.
const ohneCode = (s: string) => s.replace(/```[\s\S]*?```/g, '')
const PLUS_ZEILE = /(^|\n)\s*\+\s/

describe('Rechenwege: keine "+ "-Zeilen außerhalb von Codeblöcken', () => {
  const dataDir = join(__dirname, '..', 'public', 'data')
  const quellen: [string, Record<string, unknown>[]][] = []
  for (const ordner of ['aufgaben', 'lernpaare', 'themen'])
    for (const d of readdirSync(join(dataDir, ordner)).filter((x) => x.endsWith('.json')))
      quellen.push([`${ordner}/${d}`, JSON.parse(readFileSync(join(dataDir, ordner, d), 'utf8'))])
  quellen.push(['rechnen.json', JSON.parse(readFileSync(join(dataDir, 'rechnen.json'), 'utf8'))])

  it.each(quellen)('%s', (_name, daten) => {
    const treffer: string[] = []
    const pruefe = (o: unknown, id: string): void => {
      if (typeof o === 'string') { if (PLUS_ZEILE.test(ohneCode(o))) treffer.push(id) }
      else if (Array.isArray(o)) o.forEach((x) => pruefe(x, id))
      else if (o && typeof o === 'object') {
        const r = o as Record<string, unknown>
        Object.values(r).forEach((v) => pruefe(v, (r.id as string) ?? id))
      }
    }
    pruefe(daten, '?')
    expect([...new Set(treffer)]).toEqual([])
  })
})
