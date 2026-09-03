import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv'

const schema = JSON.parse(readFileSync('schema/content.schema.json', 'utf8'))
const ajv = new Ajv({ allErrors: true })
ajv.addSchema(schema, 'content.schema.json')
const dataDir = 'public/data'

function validate(defName: string, file: string) {
  const v = ajv.getSchema(`content.schema.json#/$defs/${defName}`)
  if (!v) throw new Error(`Schema-Def fehlt: ${defName}`)
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const ok = v(data)
  expect(ok, JSON.stringify(v.errors, null, 2)).toBe(true)
}

describe('Content-Schema-Audit', () => {
  it('bereiche.json ist gültig', () => validate('bereichListe', join(dataDir, 'bereiche.json')))

  const unterordner = {
    themen: 'themaListe',
    aufgaben: 'aufgabeListe',
    karteikarten: 'karteikarteListe',
    lernpaare: 'lernpaarListe',
  } as const

  for (const [sub, def] of Object.entries(unterordner)) {
    const dir = join(dataDir, sub)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      it(`${sub}/${f} ist gültig`, () => validate(def, join(dir, f)))
    }
  }

  if (existsSync(join(dataDir, 'pruefungen/index.json'))) {
    it('pruefungen/index.json ist gültig', () =>
      validate('pruefungListe', join(dataDir, 'pruefungen/index.json')))
  }
  if (existsSync(join(dataDir, 'glossar.json'))) {
    it('glossar.json ist gültig', () => validate('glossarListe', join(dataDir, 'glossar.json')))
  }
  if (existsSync(join(dataDir, 'formeln.json'))) {
    it('formeln.json ist gültig', () => validate('formelListe', join(dataDir, 'formeln.json')))
  }
})

describe('Referenz-Audit (Kreuz-Checks)', () => {
  it('jede Aufgabe verweist auf ein existierendes Thema', () => {
    const themenIds = new Set<string>()
    const themenDir = join(dataDir, 'themen')
    if (existsSync(themenDir)) {
      for (const f of readdirSync(themenDir).filter((f) => f.endsWith('.json'))) {
        for (const t of JSON.parse(readFileSync(join(themenDir, f), 'utf8'))) themenIds.add(t.id)
      }
    }
    const aufgabenDir = join(dataDir, 'aufgaben')
    if (!existsSync(aufgabenDir)) return
    for (const f of readdirSync(aufgabenDir).filter((f) => f.endsWith('.json'))) {
      for (const a of JSON.parse(readFileSync(join(aufgabenDir, f), 'utf8'))) {
        expect(themenIds.has(a.themaId), `Aufgabe ${a.id}: unbekanntes Thema ${a.themaId}`).toBe(true)
      }
    }
  })

  it('jede Prüfung verweist nur auf existierende Aufgaben', () => {
    const idx = join(dataDir, 'pruefungen/index.json')
    if (!existsSync(idx)) return
    const aufgabenIds = new Set<string>()
    const aufgabenDir = join(dataDir, 'aufgaben')
    if (existsSync(aufgabenDir)) {
      for (const f of readdirSync(aufgabenDir).filter((f) => f.endsWith('.json'))) {
        for (const a of JSON.parse(readFileSync(join(aufgabenDir, f), 'utf8'))) aufgabenIds.add(a.id)
      }
    }
    for (const p of JSON.parse(readFileSync(idx, 'utf8'))) {
      for (const id of p.aufgabenIds) {
        expect(aufgabenIds.has(id), `Prüfung ${p.termin}/${p.bereich}: unbekannte Aufgabe ${id}`).toBe(true)
      }
    }
  })

  it('jedes Lernpaar verweist auf ein existierendes Thema und gültige korrekt-Indizes', () => {
    const themenIds = new Set<string>()
    const themenDir = join(dataDir, 'themen')
    if (existsSync(themenDir)) {
      for (const f of readdirSync(themenDir).filter((f) => f.endsWith('.json'))) {
        for (const t of JSON.parse(readFileSync(join(themenDir, f), 'utf8'))) themenIds.add(t.id)
      }
    }
    const dir = join(dataDir, 'lernpaare')
    if (!existsSync(dir)) return
    const ids = new Set<string>()
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      for (const p of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
        expect(themenIds.has(p.themaId), `Lernpaar ${p.id}: unbekanntes Thema ${p.themaId}`).toBe(true)
        expect(ids.has(p.id), `Lernpaar-ID doppelt: ${p.id}`).toBe(false)
        ids.add(p.id)
        for (const k of p.korrekt) {
          expect(k < p.optionen.length, `Lernpaar ${p.id}: korrekt-Index ${k} außerhalb`).toBe(true)
        }
      }
    }
  })

  it('anlagenDiagramm-Serien sind beim Kreisdiagramm einreihig', () => {
    const aufgabenDir = join(dataDir, 'aufgaben')
    if (!existsSync(aufgabenDir)) return
    for (const f of readdirSync(aufgabenDir).filter((f) => f.endsWith('.json'))) {
      for (const a of JSON.parse(readFileSync(join(aufgabenDir, f), 'utf8'))) {
        if (a.anlagenDiagramm?.typ === 'kreis') {
          expect(a.anlagenDiagramm.serien.length, `Aufgabe ${a.id}: Kreisdiagramm braucht genau 1 Serie`).toBe(1)
        }
      }
    }
  })

  it('Originalaufgaben tragen einen Termin', () => {
    const aufgabenDir = join(dataDir, 'aufgaben')
    if (!existsSync(aufgabenDir)) return
    for (const f of readdirSync(aufgabenDir).filter((f) => f.endsWith('.json'))) {
      for (const a of JSON.parse(readFileSync(join(aufgabenDir, f), 'utf8'))) {
        if (a.quelle === 'original') {
          expect(a.termin, `Original-Aufgabe ${a.id} ohne termin`).toBeTruthy()
        }
      }
    }
  })
})
