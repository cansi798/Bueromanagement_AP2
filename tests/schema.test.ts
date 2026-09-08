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
  if (existsSync(join(dataDir, 'rechnen.json'))) {
    it('rechnen.json ist gültig', () => validate('rechnenDatei', join(dataDir, 'rechnen.json')))
  }
})

describe('Zuordnungs-Typ im Schema', () => {
  const zuordnung = {
    ziffern: [
      { nr: 1, text: 'Komplementäre Ziele' },
      { nr: 2, text: 'Konkurrierende Ziele' },
    ],
    items: [
      { label: 'a', text: 'Gewinn – Klimaabgabe', korrekt: 2 },
      { label: 'b', text: 'Fortbildung – Verkaufskompetenz', korrekt: 1 },
    ],
  }

  function pruefe(defName: string, data: unknown): boolean {
    const v = ajv.getSchema(`content.schema.json#/$defs/${defName}`)
    if (!v) throw new Error(`Schema-Def fehlt: ${defName}`)
    return Boolean(v(data))
  }

  const aufgabeBasis = {
    id: 'wiso-test-a1',
    themaId: 'test-thema',
    bereich: 'wiso',
    quelle: 'original',
    termin: '2024-sommer',
    text: 'Ordnen Sie zu!',
    loesung: 'a) 2, b) 1',
  }

  it('akzeptiert eine Aufgabe mit typ zuordnung', () => {
    expect(pruefe('aufgabe', { ...aufgabeBasis, typ: 'zuordnung', zuordnung })).toBe(true)
  })

  it('verlangt bei typ zuordnung das zuordnung-Feld', () => {
    expect(pruefe('aufgabe', { ...aufgabeBasis, typ: 'zuordnung' })).toBe(false)
  })

  it('verlangt bei typ mc weiterhin optionen und korrekt', () => {
    expect(pruefe('aufgabe', { ...aufgabeBasis, typ: 'mc' })).toBe(false)
  })

  const lernpaarBasis = {
    id: 'wiso-lp-test-01',
    themaId: 'test-thema',
    bereich: 'wiso',
    frage: 'Ordnen Sie zu!',
    erklaerung: 'Darum.',
  }

  it('akzeptiert ein Lernpaar mit typ zuordnung ohne optionen', () => {
    expect(pruefe('lernpaar', { ...lernpaarBasis, typ: 'zuordnung', zuordnung })).toBe(true)
  })

  it('verlangt bei Lernpaaren ohne typ weiterhin optionen und korrekt', () => {
    expect(pruefe('lernpaar', lernpaarBasis)).toBe(false)
  })

  it('lehnt zuordnung mit korrekt-Ziffer außerhalb der Legende NICHT im Schema ab (Kreuz-Check übernimmt)', () => {
    // Ziffern-Konsistenz ist bewusst Sache des Referenz-Audits, nicht des Schemas.
    expect(
      pruefe('aufgabe', {
        ...aufgabeBasis,
        typ: 'zuordnung',
        zuordnung: { ...zuordnung, items: [{ label: 'a', text: 'X', korrekt: 9 }, { label: 'b', text: 'Y', korrekt: 1 }] },
      }),
    ).toBe(true)
  })
})

describe('Rechnen-Kapitel', () => {
  const datei = JSON.parse(readFileSync(join(dataDir, 'rechnen.json'), 'utf8'))

  it('enthält genau die 10 Kapitel der Spec in Gruppen', () => {
    const ids = datei.kapitel.map((k: { id: string }) => k.id)
    expect(ids).toEqual([
      'dreisatz', 'prozentrechnung', 'zinsrechnung',
      'kg-gewinnverteilung', 'gleichgewichtspreis-umsatz', 'darlehen', 'leasing',
      'wirtschaftlichkeit-produktivitaet', 'konjunktur-indikatoren', 'energie-betriebskosten',
    ])
    for (const k of datei.kapitel.slice(0, 3)) expect(k.gruppe).toBe('grundlagen')
    for (const k of datei.kapitel.slice(3)) expect(k.gruppe).toBe('pruefung')
  })

  it('Aufgaben-IDs sind eindeutig, Toleranzen nicht negativ', () => {
    const ids = new Set<string>()
    for (const k of datei.kapitel) {
      for (const a of k.aufgaben) {
        expect(ids.has(a.id), `Rechnen-Aufgabe doppelt: ${a.id}`).toBe(false)
        ids.add(a.id)
        expect(a.toleranz).toBeGreaterThanOrEqual(0)
      }
    }
  })
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
        for (const k of p.korrekt ?? []) {
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

  // Ziffern-Zuordnungen müssen als typ "zuordnung" modelliert sein — als MC
  // sind sie entweder unrealistisch (fertige Ketten) oder unlösbar (korrekt
  // als Reihenfolge statt Menge).
  function alleFragen(): { datei: string; eintrag: Record<string, unknown> }[] {
    const out: { datei: string; eintrag: Record<string, unknown> }[] = []
    for (const sub of ['aufgaben', 'lernpaare']) {
      const dir = join(dataDir, sub)
      if (!existsSync(dir)) continue
      for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        for (const e of JSON.parse(readFileSync(join(dir, f), 'utf8'))) {
          out.push({ datei: `${sub}/${f}`, eintrag: e })
        }
      }
    }
    return out
  }

  it('keine MC-Frage kodiert eine Ziffern-Zuordnung in den Optionen', () => {
    // Ketten: "a) 2, b) 1 …", "2;2;3;1;1", "Definition = 4, Planung = 3 …" —
    // aber NICHT einzelne Rechenwerte wie "Wirtschaftlichkeit = 1,25 – …".
    const kette = [
      /^\s*a\s*[)=]\s*\d/i,
      /^\s*\d+\s*[;–]\s*\d+/,
      /^[^,=]+=\s*\d+\s*,[^,=]+=\s*\d+/,
    ]
    for (const { datei, eintrag } of alleFragen()) {
      if (eintrag.typ === 'zuordnung') continue
      for (const opt of (eintrag.optionen as string[]) ?? []) {
        expect(
          kette.some((re) => re.test(opt)),
          `${datei} ${eintrag.id}: Option sieht nach Ziffern-Zuordnungskette aus: "${opt.slice(0, 60)}"`,
        ).toBe(false)
      }
    }
  })

  it('MC-korrekt ist eine echte Menge (keine Duplikate, nicht alle Optionen)', () => {
    for (const { datei, eintrag } of alleFragen()) {
      const korrekt = (eintrag.korrekt as number[]) ?? []
      if (korrekt.length === 0) continue
      const optionen = (eintrag.optionen as string[]) ?? []
      expect(
        new Set(korrekt).size,
        `${datei} ${eintrag.id}: korrekt enthält Duplikate — Reihenfolge statt Menge?`,
      ).toBe(korrekt.length)
      expect(
        korrekt.length < optionen.length,
        `${datei} ${eintrag.id}: alle Optionen als korrekt markiert — Zuordnung statt MC?`,
      ).toBe(true)
    }
  })

  it('Zuordnungsfelder sind in sich konsistent', () => {
    for (const { datei, eintrag } of alleFragen()) {
      const z = eintrag.zuordnung as
        | { ziffern: { nr: number }[]; items: { label: string; korrekt: number }[] }
        | undefined
      if (!z) continue
      const nrs = new Set(z.ziffern.map((x) => x.nr))
      expect(nrs.size, `${datei} ${eintrag.id}: Ziffern doppelt`).toBe(z.ziffern.length)
      const labels = new Set(z.items.map((x) => x.label))
      expect(labels.size, `${datei} ${eintrag.id}: Labels doppelt`).toBe(z.items.length)
      for (const item of z.items) {
        expect(
          nrs.has(item.korrekt),
          `${datei} ${eintrag.id}: Item ${item.label} verweist auf unbekannte Ziffer ${item.korrekt}`,
        ).toBe(true)
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
