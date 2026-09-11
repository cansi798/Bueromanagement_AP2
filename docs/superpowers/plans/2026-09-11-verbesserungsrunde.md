# Verbesserungsrunde 2026-09-11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neun Verbesserungen aus `verbesserung.txt` umsetzen: Glossar-Lücken, Fehler-Wiederholen im Quiz, Freitext-Selbstabgleich, vollständiger Lernstand mit Themen-Tabelle, Zuordnungs-Überarbeitung, ehrliche Simulations-Zwischenstände, ausgebaute Präsentationen und Darkmode.

**Architecture:** Rein additive Änderungen an der bestehenden Vite+React+TS-App. Neue localStorage-Keys (`kbm.v1.quizmodus`, `kbm.v1.theme`) laufen automatisch über den bestehenden Server-Sync mit (sync.ts sammelt alle `kbm.v1.*`-Keys). Leitner-Kern bleibt unangetastet; neue Felder sind optional und rückwärtskompatibel.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind v4 (CSS-Config in `src/index.css`), Vitest 3, react-router (Hash-Routing).

**Spec:** `docs/superpowers/specs/2026-09-11-verbesserungsrunde-design.md`

## Global Constraints

- Arbeitsverzeichnis: `/media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach` — Branch `feature/verbesserungsrunde` (von `main` abzweigen, Task 1).
- vboxsf-Eigenheiten: `npm install` nur mit `--no-bin-links`; Binaries via `npx` aufrufen (`npx vitest run`, `npx tsc`). Schlägt ein `git commit` mit Locking-Fehler fehl: exakt denselben Befehl einmal wiederholen.
- Tests laufen mit `npx vitest run` (alle) bzw. `npx vitest run tests/<datei>` (einzeln). Vor jedem Commit muss die betroffene Testdatei grün sein.
- UI-Texte auf Deutsch, Du-Form, Ton wie bestehende Texte.
- Erklärungs-/Lösungstexte NIEMALS positionsbezogen formulieren („Option 2", „die letzte Antwort") — Optionen werden zur Laufzeit gemischt.
- Keine neuen npm-Abhängigkeiten.
- Neue Storage-Keys immer voll qualifiziert `kbm.v1.<name>`; Zugriff nur über `getItem`/`setItem` aus `src/lib/storage.ts`.
- Commit-Messages enden mit `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Branch + Paket A — Glossar-Begriffe

**Files:**
- Modify: `public/data/glossar.json` (alphabetisch sortiertes Array von `{begriff, definition, bereiche}`)
- Create: `tests/glossar.test.ts`

**Interfaces:**
- Consumes: `GlossarEintrag` aus `src/types.ts` (`{begriff: string; definition: string; bereiche: BereichId[]}`)
- Produces: zwei neue Glossar-Einträge; keine Code-API.

- [ ] **Step 1: Branch anlegen**

```bash
cd /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach
git checkout main && git checkout -b feature/verbesserungsrunde
```

- [ ] **Step 2: Fehlenden Test schreiben**

```ts
// tests/glossar.test.ts
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { GlossarEintrag } from '../src/types'

const glossar: GlossarEintrag[] = JSON.parse(
  readFileSync(join(__dirname, '..', 'public', 'data', 'glossar.json'), 'utf8'),
)

describe('Glossar-Inhalte', () => {
  it.each(['Geschäftsklima', 'Stabsstelleninhaber'])('enthält "%s"', (begriff) => {
    expect(glossar.some((e) => e.begriff === begriff)).toBe(true)
  })

  it('ist alphabetisch nach Begriff sortiert', () => {
    const namen = glossar.map((e) => e.begriff)
    expect(namen).toEqual([...namen].sort((a, b) => a.localeCompare(b, 'de')))
  })
})
```

- [ ] **Step 3: Test laufen lassen — muss fehlschlagen**

Run: `npx vitest run tests/glossar.test.ts`
Expected: FAIL — „Geschäftsklima" und „Stabsstelleninhaber" nicht gefunden.

- [ ] **Step 4: Einträge alphabetisch korrekt einfügen**

In `public/data/glossar.json` an den alphabetisch passenden Stellen (Geschäftsklima nach „Gesamtkosten"-artigen G-Einträgen, Stabsstelleninhaber bei S):

```json
{
  "begriff": "Geschäftsklima",
  "definition": "Stimmungsindikator der Wirtschaft (ifo-Geschäftsklimaindex): monatliche Befragung von Unternehmen zu aktueller Lage und Erwartungen für die nächsten sechs Monate; gilt als Frühindikator für die Konjunkturentwicklung.",
  "bereiche": ["wiso"]
},
```

```json
{
  "begriff": "Stabsstelleninhaber",
  "definition": "Person auf einer Stabsstelle im Organigramm: berät und entlastet eine Leitungsstelle (z. B. Justiziariat, Controlling), hat aber keine Weisungsbefugnis gegenüber den Linienstellen.",
  "bereiche": ["kbz", "muendlich"]
},
```

Falls der Sortier-Test bestehende Unordnung aufdeckt: NUR die zwei neuen Einträge korrekt platzieren; schlägt der Sortier-Test wegen Altbestand fehl, den Sortier-Test auf die zwei neuen Begriffe reduzieren (`expect(index('Geschäftsklima')).toBeGreaterThan(-1)`) und den Befund im Commit-Text erwähnen — Altdaten nicht umsortieren.

- [ ] **Step 5: Tests laufen lassen**

Run: `npx vitest run tests/glossar.test.ts tests/schema.test.ts`
Expected: PASS (schema.test validiert glossar.json weiterhin).

- [ ] **Step 6: Commit**

```bash
git add public/data/glossar.json tests/glossar.test.ts
git commit -m "feat: Glossar-Einträge Geschäftsklima + Stabsstelleninhaber (Paket A)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Paket D1 — Themen-Training protokollieren

**Files:**
- Modify: `src/lib/progress.ts`
- Modify: `src/pages/UnterrichtSession.tsx` („Session abschließen ✔"-Link, Zeile ~177)
- Modify: `src/pages/Lernstand.tsx` (neuer Block nach den Kopf-Kennzahlen)
- Test: `tests/progress.test.ts` (erweitern)

**Interfaces:**
- Consumes: `ladeFortschritt()`, `speichern()`, `aktualisiereStreak()` aus `progress.ts`; `heuteISO()`.
- Produces: `Fortschritt.unterricht: Record<string, { abgeschlossen: string }>` (Key = themaId, Wert-Datum ISO `YYYY-MM-DD`) und `merkeUnterricht(themaId: string, heute: string): Fortschritt`. Task 3 liest `fortschritt.unterricht`.

- [ ] **Step 1: Failing Test schreiben** (in `tests/progress.test.ts` anhängen; die Datei nutzt bereits localStorage-Mocks der bestehenden Tests — gleiches Muster übernehmen)

```ts
describe('merkeUnterricht', () => {
  it('speichert das Abschluss-Datum pro Thema und zählt den Streak', () => {
    localStorage.clear()
    const f = merkeUnterricht('wiso-01-sozialversicherung', '2026-09-11')
    expect(f.unterricht['wiso-01-sozialversicherung']).toEqual({ abgeschlossen: '2026-09-11' })
    expect(f.streak.tage).toBe(1)
  })

  it('alte Speicherstände ohne unterricht-Feld werden sanft migriert', () => {
    localStorage.clear()
    localStorage.setItem('kbm.v1.fortschritt', JSON.stringify({ erledigteAufgaben: [] }))
    expect(ladeFortschritt().unterricht).toEqual({})
  })
})
```

(Import oben ergänzen: `merkeUnterricht` zu den bestehenden progress-Imports.)

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/progress.test.ts` — Expected: FAIL (`merkeUnterricht` existiert nicht).

- [ ] **Step 3: Implementieren** in `src/lib/progress.ts`:

Interface + DEFAULT erweitern:

```ts
export interface Fortschritt {
  erledigteAufgaben: string[]
  quizErgebnisse: Record<string, { richtig: number; gesamt: number }>
  aufgabenStatistik: Record<string, { richtig: number; falsch: number }>
  simulationen: SimulationsErgebnis[]
  streak: { letzterTag: string; tage: number }
  unterricht: Record<string, { abgeschlossen: string }> // key: themaId
}
```

```ts
const DEFAULT: Fortschritt = {
  erledigteAufgaben: [],
  quizErgebnisse: {},
  aufgabenStatistik: {},
  simulationen: [],
  streak: { letzterTag: '', tage: 0 },
  unterricht: {},
}
```

Neue Funktion (nach `merkeSimulation`):

```ts
// Merkt sich den Abschluss einer Unterrichts-Session — Grundlage für den
// „Themen-Training"-Block und die Themen-Tabelle im Lernstand.
export function merkeUnterricht(themaId: string, heute: string): Fortschritt {
  let f = ladeFortschritt()
  f = { ...f, unterricht: { ...f.unterricht, [themaId]: { abgeschlossen: heute } } }
  return speichern(aktualisiereStreak(f, heute))
}
```

- [ ] **Step 4: Test laufen lassen** — Run: `npx vitest run tests/progress.test.ts` — Expected: PASS.

- [ ] **Step 5: Abschluss-Link verdrahten** in `src/pages/UnterrichtSession.tsx`:

Import ändern: `import { ladeFortschritt, heuteISO, merkeUnterricht } from '../lib/progress'` — und beim „Session abschließen ✔"-Link:

```tsx
<Link
  to={`/unterricht/${bereichId}`}
  onClick={() => merkeUnterricht(thema.id, heuteISO())}
  className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700"
>
  Session abschließen ✔
</Link>
```

- [ ] **Step 6: Lernstand-Block** in `src/pages/Lernstand.tsx` direkt NACH dem Kopf-Kennzahlen-`<div>` (nach Zeile ~79) einfügen:

```tsx
{/* Themen-Training: abgeschlossene Unterrichts-Sessions je Bereich */}
{Object.keys(f.unterricht).length > 0 && (
  <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 className="mb-3 font-bold text-slate-900">🎓 Themen-Training</h2>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {BEREICHE.map((b) => {
        const bereichsThemen = themen.filter((t) => t.bereich === b)
        if (bereichsThemen.length === 0) return null
        const fertig = bereichsThemen.filter((t) => f.unterricht[t.id]).length
        return (
          <Link
            key={b}
            to={`/unterricht/${b}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:border-sky-300"
          >
            <span className="font-medium text-slate-800">{bereichName(b)}</span>
            <span className="shrink-0 text-sm font-semibold text-slate-500">
              {fertig} / {bereichsThemen.length} Sessions
            </span>
          </Link>
        )
      })}
    </div>
  </div>
)}
```

Achtung: `bereichName` ist erst weiter unten definiert (Zeile ~61) — die `const bereichName`-Deklaration steht VOR dem `return`, das passt.

- [ ] **Step 7: Alle Tests + Typecheck** — Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/progress.ts src/pages/UnterrichtSession.tsx src/pages/Lernstand.tsx tests/progress.test.ts
git commit -m "feat: Themen-Training schreibt Fortschritt + Lernstand-Block (Paket D1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Paket D2 — Aggregations-Logik der Themen-Tabelle

**Files:**
- Create: `src/lib/themenUebersicht.ts`
- Test: `tests/themenUebersicht.test.ts`

**Interfaces:**
- Consumes: `Fortschritt` (inkl. `unterricht` aus Task 2), `LernpaarStaende` aus `lernquiz.ts`, `INTERVALLE` aus `leitner.ts`, Typen `Thema`, `Aufgabe`, `Lernpaar`.
- Produces (Task 4 nutzt beides):

```ts
export interface ThemaZeile {
  themaId: string
  bereich: string        // BereichId
  name: string
  geuebt: number         // Summe beantworteter Fragen/Aufgaben
  richtig: number        // kann durch Teilweise-Wertungen (Paket C) halbe Punkte enthalten
  falsch: number
  quote: number | null   // richtig/geuebt, null wenn geuebt === 0
  zuletzt: string | null // ISO-Datum der letzten Aktivität, null wenn unbekannt
  gekonnt: boolean       // quote >= 0.8 UND geuebt >= 5
}
export function baueThemenUebersicht(args: {
  themen: Thema[]
  aufgaben: Aufgabe[]
  lernpaare: Lernpaar[]
  fortschritt: Fortschritt
  staende: LernpaarStaende
}): ThemaZeile[]
```

`zuletzt` wird hergeleitet aus (a) Leitner-Ständen der Lernpaare des Themas: Antwortdatum = `faelligAm` minus `INTERVALLE[fach]` Tage, und (b) `fortschritt.unterricht[themaId].abgeschlossen`; Maximum beider Quellen.

- [ ] **Step 1: Failing Tests schreiben**

```ts
// tests/themenUebersicht.test.ts
import { describe, expect, it } from 'vitest'
import { baueThemenUebersicht } from '../src/lib/themenUebersicht'
import type { Fortschritt } from '../src/lib/progress'
import type { Aufgabe, Lernpaar, Thema } from '../src/types'

const thema = (id: string): Thema => ({
  id, bereich: 'wiso', name: `Thema ${id}`, beschreibung: '',
  haeufigkeit: [], lernzettel: '', eselsbruecken: [], selbstcheck: [],
})
const aufgabe = (id: string, themaId: string): Aufgabe => ({
  id, themaId, bereich: 'wiso', quelle: 'original', typ: 'mc', text: '', loesung: '',
})
const paar = (id: string, themaId: string): Lernpaar => ({
  id, themaId, bereich: 'wiso', frage: '', erklaerung: '',
})
const leererFortschritt: Fortschritt = {
  erledigteAufgaben: [], quizErgebnisse: {}, aufgabenStatistik: {},
  simulationen: [], streak: { letzterTag: '', tage: 0 }, unterricht: {},
}

describe('baueThemenUebersicht', () => {
  it('summiert Quiz- und Aufgaben-Statistik pro Thema', () => {
    const zeilen = baueThemenUebersicht({
      themen: [thema('t1')],
      aufgaben: [aufgabe('a1', 't1')],
      lernpaare: [],
      fortschritt: {
        ...leererFortschritt,
        quizErgebnisse: { t1: { richtig: 3, gesamt: 4 } },
        aufgabenStatistik: { a1: { richtig: 1, falsch: 1 } },
      },
      staende: {},
    })
    expect(zeilen).toHaveLength(1)
    expect(zeilen[0]).toMatchObject({ geuebt: 6, richtig: 4, falsch: 2, gekonnt: false })
    expect(zeilen[0].quote).toBeCloseTo(4 / 6)
  })

  it('markiert gekonnt erst ab Quote 80 % und 5 Übungen', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [],
      fortschritt: { ...leererFortschritt, quizErgebnisse: { t1: { richtig: 4, gesamt: 5 } } },
      staende: {},
    })
    expect(z.gekonnt).toBe(true)
  })

  it('leitet zuletzt aus Leitner-Stand und Unterricht her (Maximum)', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [paar('p1', 't1')],
      fortschritt: { ...leererFortschritt, unterricht: { t1: { abgeschlossen: '2026-09-01' } } },
      // Fach 3 fällig am 2026-09-13 → beantwortet am 2026-09-10 (Intervall 3 Tage)
      staende: { p1: { fach: 3, faelligAm: '2026-09-13' } },
    })
    expect(z.zuletzt).toBe('2026-09-10')
  })

  it('Themen ohne Aktivität: quote null, zuletzt null', () => {
    const [z] = baueThemenUebersicht({
      themen: [thema('t1')], aufgaben: [], lernpaare: [], fortschritt: leererFortschritt, staende: {},
    })
    expect(z).toMatchObject({ geuebt: 0, quote: null, zuletzt: null, gekonnt: false })
  })
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/themenUebersicht.test.ts` — Expected: FAIL (Modul fehlt).

- [ ] **Step 3: Implementieren**

```ts
// src/lib/themenUebersicht.ts
// Aggregiert alle Übungsquellen (Themen-Quiz, Aufgaben-Statistik, Unterricht)
// zu einer sortierbaren Themen-Tabelle für den Lernstand.
import type { Fortschritt } from './progress'
import type { LernpaarStaende } from './lernquiz'
import { INTERVALLE } from './leitner'
import type { Aufgabe, Lernpaar, Thema } from '../types'

export interface ThemaZeile {
  themaId: string
  bereich: string
  name: string
  geuebt: number
  richtig: number
  falsch: number
  quote: number | null
  zuletzt: string | null
  gekonnt: boolean
}

function minusTage(datum: string, tage: number): string {
  const d = new Date(`${datum}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() - tage)
  return d.toISOString().slice(0, 10)
}

export function baueThemenUebersicht(args: {
  themen: Thema[]
  aufgaben: Aufgabe[]
  lernpaare: Lernpaar[]
  fortschritt: Fortschritt
  staende: LernpaarStaende
}): ThemaZeile[] {
  const { themen, aufgaben, lernpaare, fortschritt, staende } = args
  const aufgabenProThema = new Map<string, Aufgabe[]>()
  for (const a of aufgaben) {
    if (!aufgabenProThema.has(a.themaId)) aufgabenProThema.set(a.themaId, [])
    aufgabenProThema.get(a.themaId)!.push(a)
  }
  const paareProThema = new Map<string, Lernpaar[]>()
  for (const p of lernpaare) {
    if (!paareProThema.has(p.themaId)) paareProThema.set(p.themaId, [])
    paareProThema.get(p.themaId)!.push(p)
  }

  return themen.map((t) => {
    const quiz = fortschritt.quizErgebnisse[t.id] ?? { richtig: 0, gesamt: 0 }
    let richtig = quiz.richtig
    let geuebt = quiz.gesamt
    for (const a of aufgabenProThema.get(t.id) ?? []) {
      const s = fortschritt.aufgabenStatistik[a.id]
      if (!s) continue
      richtig += s.richtig
      geuebt += s.richtig + s.falsch
    }
    // Letzte Aktivität: Leitner-Antwortdatum (faelligAm − Intervall) oder Unterricht.
    let zuletzt: string | null = fortschritt.unterricht[t.id]?.abgeschlossen ?? null
    for (const p of paareProThema.get(t.id) ?? []) {
      const s = staende[p.id]
      if (!s) continue
      const beantwortet = minusTage(s.faelligAm, INTERVALLE[s.fach])
      if (!zuletzt || beantwortet > zuletzt) zuletzt = beantwortet
    }
    const falsch = geuebt - richtig
    const quote = geuebt > 0 ? richtig / geuebt : null
    return {
      themaId: t.id,
      bereich: t.bereich,
      name: t.name,
      geuebt,
      richtig,
      falsch,
      quote,
      zuletzt,
      gekonnt: quote !== null && quote >= 0.8 && geuebt >= 5,
    }
  })
}
```

- [ ] **Step 4: Test laufen lassen** — Run: `npx vitest run tests/themenUebersicht.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/themenUebersicht.ts tests/themenUebersicht.test.ts
git commit -m "feat: Aggregations-Logik für Themen-Tabelle im Lernstand (Paket D2)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Paket D2 — Themen-Tabelle im Lernstand (UI)

**Files:**
- Create: `src/components/ThemenTabelle.tsx`
- Modify: `src/pages/Lernstand.tsx` (Tabelle als neuer Block VOR „Schwache Themen"; der bisherige Block „Themen mit Luft nach oben" bleibt)
- Test: `tests/themenTabelle.test.tsx`

**Interfaces:**
- Consumes: `ThemaZeile`, `baueThemenUebersicht` (Task 3); `ladeLernpaarStaende` aus `lernquiz.ts`.
- Produces: `<ThemenTabelle zeilen={ThemaZeile[]} bereichName={(id: string) => string} />` — hält Sortier-/Filter-State selbst.

- [ ] **Step 1: Failing Render-Test schreiben** (Muster wie `tests/zuordnungFelder.test.tsx`: `renderToString`)

```tsx
// tests/themenTabelle.test.tsx
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
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/themenTabelle.test.tsx` — Expected: FAIL.

- [ ] **Step 3: Komponente implementieren**

```tsx
// src/components/ThemenTabelle.tsx
import { useMemo, useState } from 'react'
import type { ThemaZeile } from '../lib/themenUebersicht'

type SortierNach = 'quote' | 'zuletzt' | 'bereich' | 'geuebt'

// Sortier- und filterbare Übersicht „Was habe ich wie gut geübt?" für den
// Lernstand. Sortier-/Filter-State lebt hier, die Daten kommen vom Aufrufer.
export default function ThemenTabelle({
  zeilen,
  bereichName,
}: {
  zeilen: ThemaZeile[]
  bereichName: (id: string) => string
}) {
  const [sortNach, setSortNach] = useState<SortierNach>('quote')
  const [richtung, setRichtung] = useState<1 | -1>(1)
  const [bereichFilter, setBereichFilter] = useState<string>('alle')
  const [ohneGekonnte, setOhneGekonnte] = useState(false)

  const bereiche = useMemo(() => [...new Set(zeilen.map((z) => z.bereich))], [zeilen])

  const sichtbar = useMemo(() => {
    let liste = zeilen
    if (bereichFilter !== 'alle') liste = liste.filter((z) => z.bereich === bereichFilter)
    if (ohneGekonnte) liste = liste.filter((z) => !z.gekonnt)
    const wert = (z: ThemaZeile): string | number => {
      if (sortNach === 'quote') return z.quote ?? 2 // ungeübte ans Ende
      if (sortNach === 'zuletzt') return z.zuletzt ?? ''
      if (sortNach === 'geuebt') return z.geuebt
      return z.bereich
    }
    return [...liste].sort((a, b) => {
      const wa = wert(a)
      const wb = wert(b)
      const cmp = typeof wa === 'number' && typeof wb === 'number'
        ? wa - wb
        : String(wa).localeCompare(String(wb), 'de')
      return cmp * richtung
    })
  }, [zeilen, sortNach, richtung, bereichFilter, ohneGekonnte])

  function sortiere(nach: SortierNach) {
    if (nach === sortNach) setRichtung((r) => (r === 1 ? -1 : 1))
    else {
      setSortNach(nach)
      setRichtung(nach === 'zuletzt' || nach === 'geuebt' ? -1 : 1)
    }
  }

  const pfeil = (nach: SortierNach) =>
    sortNach === nach ? (richtung === 1 ? ' ↑' : ' ↓') : ''

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={bereichFilter}
          onChange={(e) => setBereichFilter(e.target.value)}
          aria-label="Bereich filtern"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="alle">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b} value={b}>{bereichName(b)}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-slate-700">
          <input
            type="checkbox"
            checked={ohneGekonnte}
            onChange={(e) => setOhneGekonnte(e.target.checked)}
          />
          Gekonntes ausblenden
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">
                <button type="button" onClick={() => sortiere('bereich')}>Bereich{pfeil('bereich')}</button>
              </th>
              <th className="py-2 pr-2">Thema</th>
              <th className="py-2 pr-2 text-right">
                <button type="button" onClick={() => sortiere('geuebt')}>Geübt{pfeil('geuebt')}</button>
              </th>
              <th className="py-2 pr-2 text-right">Richtig</th>
              <th className="py-2 pr-2 text-right">Falsch</th>
              <th className="py-2 pr-2 text-right">
                <button type="button" onClick={() => sortiere('quote')}>Quote{pfeil('quote')}</button>
              </th>
              <th className="py-2 text-right">
                <button type="button" onClick={() => sortiere('zuletzt')}>Zuletzt{pfeil('zuletzt')}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((z) => (
              <tr key={z.themaId} className="border-b border-slate-100">
                <td className="py-2 pr-2 text-slate-500">{bereichName(z.bereich)}</td>
                <td className="py-2 pr-2 font-medium text-slate-800">
                  {z.name}
                  {z.gekonnt && ' 🏆'}
                </td>
                <td className="py-2 pr-2 text-right text-slate-700">{z.geuebt}</td>
                <td className="py-2 pr-2 text-right text-green-700">{Math.round(z.richtig * 10) / 10}</td>
                <td className="py-2 pr-2 text-right text-red-700">{Math.round(z.falsch * 10) / 10}</td>
                <td className="py-2 pr-2 text-right font-semibold text-slate-800">
                  {z.quote === null ? '—' : `${Math.round(z.quote * 100)} %`}
                </td>
                <td className="py-2 text-right text-xs text-slate-400">{z.zuletzt ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sichtbar.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">Keine Themen im Filter.</p>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Test laufen lassen** — Run: `npx vitest run tests/themenTabelle.test.tsx` — Expected: PASS.

- [ ] **Step 5: In Lernstand einbauen** (`src/pages/Lernstand.tsx`), VOR dem Block „Schwache Themen":

Imports ergänzen:

```tsx
import ThemenTabelle from '../components/ThemenTabelle'
import { baueThemenUebersicht } from '../lib/themenUebersicht'
```

Vor dem `return` (nach `bereichName`):

```tsx
const themenZeilen = baueThemenUebersicht({
  themen,
  aufgaben,
  lernpaare: Object.values(lernpaare).flat(),
  fortschritt: f,
  staende: ladeLernpaarStaende(),
})
```

Neuer Block vor `{/* Schwache Themen */}`:

```tsx
{/* Themen-Übersicht: alle Quellen, sortier- und filterbar */}
<div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
  <h2 className="mb-1 font-bold text-slate-900">🗂️ Alle Themen im Überblick</h2>
  <p className="mb-3 text-sm text-slate-500">
    Quiz, Übungsaufgaben und Themen-Training zusammengezählt — Spaltenkopf antippen zum Sortieren.
  </p>
  <ThemenTabelle zeilen={themenZeilen} bereichName={bereichName} />
</div>
```

- [ ] **Step 6: Alle Tests + Typecheck** — Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/ThemenTabelle.tsx src/pages/Lernstand.tsx tests/themenTabelle.test.tsx
git commit -m "feat: sortierbare Themen-Tabelle im Lernstand (Paket D2)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Paket B — Fehler-Flag in der Leitner-Verwaltung

**Files:**
- Modify: `src/lib/lernquiz.ts`
- Test: `tests/lernquiz.test.ts` (erweitern)

**Interfaces:**
- Consumes: `antworten()` aus `leitner.ts` (unverändert).
- Produces (Task 6 und 7 nutzen):

```ts
export type LernpaarStand = KartenStand & { letzteFalsch?: boolean }
export type LernpaarStaende = Record<string, LernpaarStand>
export function falscheLernpaare(paare: Lernpaar[], staende: LernpaarStaende): Lernpaar[]
```

`merkeLernpaarAntwort` setzt ab jetzt `letzteFalsch: !richtig` am Stand. Bestehende Speicherstände ohne das Feld gelten als „nicht falsch" (Filter greift nur bei `=== true`-artigem Wert).

- [ ] **Step 1: Failing Tests schreiben** (in `tests/lernquiz.test.ts` anhängen, bestehende Import-Zeile um `falscheLernpaare` erweitern)

```ts
describe('falscheLernpaare', () => {
  const paar = (id: string): Lernpaar => ({
    id, themaId: 't1', bereich: 'wiso', frage: 'f', erklaerung: 'e',
  })

  it('merkeLernpaarAntwort setzt und löscht das Fehler-Flag', () => {
    localStorage.clear()
    merkeLernpaarAntwort('p1', false, '2026-09-11')
    expect(ladeLernpaarStaende()['p1'].letzteFalsch).toBe(true)
    merkeLernpaarAntwort('p1', true, '2026-09-12')
    expect(ladeLernpaarStaende()['p1'].letzteFalsch).toBe(false)
  })

  it('liefert nur Karten mit letzteFalsch — Altbestand ohne Flag zählt nicht', () => {
    const staende = {
      p1: { fach: 1 as const, faelligAm: '2026-09-11', letzteFalsch: true },
      p2: { fach: 2 as const, faelligAm: '2026-09-11' }, // Altbestand
    }
    const treffer = falscheLernpaare([paar('p1'), paar('p2'), paar('p3')], staende)
    expect(treffer.map((p) => p.id)).toEqual(['p1'])
  })
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/lernquiz.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementieren** in `src/lib/lernquiz.ts`:

Typ ändern:

```ts
// Leitner-Stand plus Fehler-Flag: true = letzte Antwort war falsch.
export type LernpaarStand = KartenStand & { letzteFalsch?: boolean }
export type LernpaarStaende = Record<string, LernpaarStand>
```

`merkeLernpaarAntwort` anpassen:

```ts
export function merkeLernpaarAntwort(
  paarId: string,
  richtig: boolean,
  heute: string,
): LernpaarStaende {
  const staende = ladeLernpaarStaende()
  const neu = {
    ...staende,
    [paarId]: { ...antworten(staende[paarId], richtig, heute), letzteFalsch: !richtig },
  }
  setItem(KEY, neu)
  return neu
}
```

Neue Funktion (nach `faelligeLernpaare`):

```ts
// Karten, deren letzte Antwort falsch war — für den „Falsche wiederholen"-Modus.
export function falscheLernpaare(paare: Lernpaar[], staende: LernpaarStaende): Lernpaar[] {
  return paare.filter((p) => staende[p.id]?.letzteFalsch)
}
```

- [ ] **Step 4: Tests laufen lassen** — Run: `npx vitest run tests/lernquiz.test.ts tests/leitner.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/lernquiz.ts tests/lernquiz.test.ts
git commit -m "feat: Fehler-Flag letzteFalsch im Lernpaar-Stand (Paket B)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Paket B — „Falsche wiederholen" im Quiz-UI

**Files:**
- Modify: `src/pages/Quiz.tsx`

**Interfaces:**
- Consumes: `falscheLernpaare` (Task 5).
- Produces: Routen-Konvention im bestehenden Pfad `/:bereichId/quiz/:themaId` — `themaId`-Werte `fehler` (alle Themen) und `fehler:<themaId>` (ein Thema). Kein neuer Router-Eintrag nötig.

- [ ] **Step 1: Übersicht erweitern** (`Uebersicht`-Komponente in `Quiz.tsx`):

Import ergänzen: `falscheLernpaare` zu den lernquiz-Imports. In `Uebersicht` nach `const gesamtStand = …`:

```tsx
const falsche = falscheLernpaare(paare, staende)
```

Direkt NACH dem „Heute fällig"-/„Alle Wiederholungen erledigt"-Link (nach Zeile ~121) einfügen:

```tsx
{falsche.length > 0 && (
  <Link
    to={`/${bereichId}/quiz/fehler`}
    className="mb-5 flex items-center gap-4 rounded-2xl border-2 border-red-200 bg-red-50 p-4 shadow-sm transition hover:border-red-400"
  >
    <span className="text-3xl">🔁</span>
    <div className="min-w-0 flex-1">
      <h2 className="font-bold text-red-900">Falsche wiederholen: {falsche.length} Fragen</h2>
      <p className="text-sm text-red-800">Alles, was du zuletzt falsch hattest — bereichsweit.</p>
    </div>
    <span className="text-red-400">→</span>
  </Link>
)}
```

Im Themen-Kacheln-Loop (`proThema.map`) die Falsch-Zahl anzeigen — in der `<div className="mt-2 flex flex-wrap …">`-Zeile nach dem `fällig`-Span:

```tsx
{(() => {
  const anzahlFalsch = falscheLernpaare(tp, staende).length
  return anzahlFalsch > 0 ? (
    <Link
      to={`/${bereichId}/quiz/fehler:${tid}`}
      onClick={(e) => e.stopPropagation()}
      className="font-semibold text-red-700 underline decoration-dotted"
    >
      🔁 {anzahlFalsch} falsch
    </Link>
  ) : null
})()}
```

Achtung: Die Themen-Kachel ist selbst ein `<Link>` — verschachtelte Links sind invalides HTML. Deshalb die Kachel von `<Link …>` auf `<div className="relative …">` mit einem separaten Stretched-Link umbauen:

```tsx
<div key={tid} className={`relative block rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}>
  <Link to={`/${bereichId}/quiz/${tid}`} className="absolute inset-0" aria-label={themenNamen.get(tid) ?? tid} />
  {/* bisheriger Kachel-Inhalt unverändert; der Falsch-Link bekommt className="relative z-10 …" damit er über dem Stretched-Link klickbar ist */}
</div>
```

(Der Falsch-Link erhält zusätzlich `relative z-10`; `stopPropagation` entfällt dann.)

- [ ] **Step 2: Session um Fehler-Modus erweitern** (`Session`-Komponente):

```tsx
const fehlerModus = themaId === 'fehler' || themaId.startsWith('fehler:')
const filterThema = fehlerModus
  ? (themaId.includes(':') ? themaId.split(':')[1] : null)
  : themaId
const themenPaare = useMemo(() => {
  const basis =
    filterThema === null || filterThema === 'alle'
      ? paare
      : paare.filter((p) => p.themaId === filterThema)
  return fehlerModus ? falscheLernpaare(basis, ladeLernpaarStaende()) : basis
}, [paare, filterThema, fehlerModus])
```

`baueRunde` bekommt den Modus als Parameter:

```tsx
const [runde, setRunde] = useState(() => baueRunde(themenPaare, heute, fehlerModus))
```

und in `nochEineRunde()` entsprechend `baueRunde(themenPaare, heute, fehlerModus)`. Funktion anpassen:

```tsx
// Fällige Fragen zuerst; im Fehler-Modus alle falschen; sonst Extra-Runde.
function baueRunde(themenPaare: Lernpaar[], heute: string, fehlerModus = false): Lernpaar[] {
  if (fehlerModus) return themenPaare.slice(0, SESSION_GROESSE)
  const staende = ladeLernpaarStaende()
  const faellig = faelligeLernpaare(themenPaare, staende, heute)
  if (faellig.length > 0) return faellig.slice(0, SESSION_GROESSE)
  const alle = [...themenPaare]
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[alle[i], alle[j]] = [alle[j], alle[i]]
  }
  return alle.slice(0, SESSION_GROESSE)
}
```

Leerer Fehler-Modus (in `Session`, VOR dem bestehenden `themenPaare.length === 0`-Block):

```tsx
if (fehlerModus && themenPaare.length === 0) {
  return (
    <Layout titel="Themen-Quiz">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-2 text-xl font-bold text-slate-900">Keine falschen Karten mehr!</h2>
        <p className="mt-1 text-slate-600">Alles, was zuletzt falsch war, hast du inzwischen richtig beantwortet.</p>
        <Link
          to={`/${bereichId}/quiz`}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:border-slate-400"
        >
          Zur Themenübersicht
        </Link>
      </div>
    </Layout>
  )
}
```

Die Antwort-Wertung bleibt unverändert (`merkeLernpaarAntwort` setzt/löscht das Flag und wertet normal über Leitner).

- [ ] **Step 3: Typecheck + alle Tests** — Run: `npx tsc --noEmit && npx vitest run` — Expected: PASS.

- [ ] **Step 4: Manuell prüfen** — Run: `npx vite --open` (oder laufenden Dev-Server nutzen): im Quiz eine Frage absichtlich falsch beantworten → Übersicht zeigt roten „Falsche wiederholen"-Block und `🔁 1 falsch` am Thema; Fehler-Runde starten, richtig beantworten → Block verschwindet. Dev-Server danach stoppen (vboxsf hält sonst Dateien offen).

- [ ] **Step 5: Commit**

```bash
git add src/pages/Quiz.tsx
git commit -m "feat: Quiz-Modus 'Falsche wiederholen' bereichsweit und je Thema (Paket B)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Paket C — Freitext-Selbstabgleich: Logik

**Files:**
- Create: `src/lib/quizmodus.ts`
- Modify: `src/lib/leitner.ts` (neue Funktion `halten`)
- Modify: `src/lib/lernquiz.ts` (neue Funktion `merkeLernpaarSelbst`)
- Test: `tests/quizmodus.test.ts` (neu), `tests/leitner.test.ts` + `tests/lernquiz.test.ts` (erweitern)

**Interfaces:**
- Produces (Task 8 nutzt alles):

```ts
// quizmodus.ts
export type QuizModus = 'auswahl' | 'freitext'
export function ladeQuizModus(): QuizModus            // Default 'auswahl'
export function speichereQuizModus(m: QuizModus): void // Key kbm.v1.quizmodus

// leitner.ts
export function halten(stand: KartenStand | undefined, heute: string): KartenStand
// Fach bleibt, Fälligkeit wird ab heute neu gesetzt (Intervall des Fachs)

// lernquiz.ts
export type SelbstWertung = 'gewusst' | 'teilweise' | 'nicht'
export function merkeLernpaarSelbst(paarId: string, wertung: SelbstWertung, heute: string): LernpaarStaende
// gewusst → wie richtig; teilweise → halten(), letzteFalsch false;
// nicht → wie falsch (Fach 1, letzteFalsch true)
```

- [ ] **Step 1: Failing Tests schreiben**

`tests/quizmodus.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { ladeQuizModus, speichereQuizModus } from '../src/lib/quizmodus'

describe('quizmodus', () => {
  it('Default ist auswahl', () => {
    localStorage.clear()
    expect(ladeQuizModus()).toBe('auswahl')
  })
  it('speichert und lädt freitext', () => {
    speichereQuizModus('freitext')
    expect(ladeQuizModus()).toBe('freitext')
  })
  it('kaputte Werte fallen auf auswahl zurück', () => {
    localStorage.setItem('kbm.v1.quizmodus', JSON.stringify('quatsch'))
    expect(ladeQuizModus()).toBe('auswahl')
  })
})
```

In `tests/leitner.test.ts` anhängen (Import um `halten` erweitern):

```ts
describe('halten', () => {
  it('behält das Fach und setzt die Fälligkeit ab heute neu', () => {
    expect(halten({ fach: 3, faelligAm: '2026-09-01' }, '2026-09-11')).toEqual({
      fach: 3,
      faelligAm: '2026-09-14', // Intervall Fach 3 = 3 Tage
    })
  })
  it('neue Karte ohne Stand bleibt in Fach 1 (heute wieder fällig)', () => {
    expect(halten(undefined, '2026-09-11')).toEqual({ fach: 1, faelligAm: '2026-09-11' })
  })
})
```

In `tests/lernquiz.test.ts` anhängen (Import um `merkeLernpaarSelbst` erweitern):

```ts
describe('merkeLernpaarSelbst', () => {
  it('gewusst rückt vor wie eine richtige Antwort', () => {
    localStorage.clear()
    merkeLernpaarSelbst('p1', 'gewusst', '2026-09-11')
    const s = ladeLernpaarStaende()['p1']
    expect(s.fach).toBe(2)
    expect(s.letzteFalsch).toBe(false)
  })
  it('teilweise hält das Fach', () => {
    localStorage.clear()
    merkeLernpaarSelbst('p1', 'gewusst', '2026-09-01') // → Fach 2
    merkeLernpaarSelbst('p1', 'teilweise', '2026-09-11')
    const s = ladeLernpaarStaende()['p1']
    expect(s.fach).toBe(2)
    expect(s.faelligAm).toBe('2026-09-12') // Intervall Fach 2 = 1 Tag
    expect(s.letzteFalsch).toBe(false)
  })
  it('nicht gewusst fällt auf Fach 1 und setzt das Fehler-Flag', () => {
    localStorage.clear()
    merkeLernpaarSelbst('p1', 'gewusst', '2026-09-01')
    merkeLernpaarSelbst('p1', 'nicht', '2026-09-11')
    const s = ladeLernpaarStaende()['p1']
    expect(s.fach).toBe(1)
    expect(s.letzteFalsch).toBe(true)
  })
})
```

- [ ] **Step 2: Tests laufen lassen** — Run: `npx vitest run tests/quizmodus.test.ts tests/leitner.test.ts tests/lernquiz.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementieren**

```ts
// src/lib/quizmodus.ts
// Merkt sich, ob im Themen-Quiz Auswahl- oder Freitext-Modus aktiv ist.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.quizmodus'

export type QuizModus = 'auswahl' | 'freitext'

export function ladeQuizModus(): QuizModus {
  return getItem<QuizModus>(KEY) === 'freitext' ? 'freitext' : 'auswahl'
}

export function speichereQuizModus(m: QuizModus): void {
  setItem(KEY, m)
}
```

In `src/lib/leitner.ts` nach `antworten`:

```ts
// „Teilweise gewusst": Fach bleibt, aber die Fälligkeit startet neu ab heute.
export function halten(stand: KartenStand | undefined, heute: string): KartenStand {
  const fach = stand?.fach ?? 1
  return { fach, faelligAm: plusTage(heute, INTERVALLE[fach]) }
}
```

In `src/lib/lernquiz.ts` (`halten` zum leitner-Import ergänzen), nach `merkeLernpaarAntwort`:

```ts
export type SelbstWertung = 'gewusst' | 'teilweise' | 'nicht'

// Selbstbewertung im Freitext-Modus: gewusst = richtig, teilweise = Fach
// halten, nicht gewusst = falsch (Fach 1 + Fehler-Flag).
export function merkeLernpaarSelbst(
  paarId: string,
  wertung: SelbstWertung,
  heute: string,
): LernpaarStaende {
  const staende = ladeLernpaarStaende()
  const alt = staende[paarId]
  const stand: LernpaarStand =
    wertung === 'teilweise'
      ? { ...halten(alt, heute), letzteFalsch: false }
      : { ...antworten(alt, wertung === 'gewusst', heute), letzteFalsch: wertung === 'nicht' }
  const neu = { ...staende, [paarId]: stand }
  setItem(KEY, neu)
  return neu
}
```

- [ ] **Step 4: Tests laufen lassen** — Run: `npx vitest run tests/quizmodus.test.ts tests/leitner.test.ts tests/lernquiz.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/quizmodus.ts src/lib/leitner.ts src/lib/lernquiz.ts tests/quizmodus.test.ts tests/leitner.test.ts tests/lernquiz.test.ts
git commit -m "feat: Freitext-Selbstbewertung — halten() und merkeLernpaarSelbst (Paket C)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Paket C — Freitext-Modus im Karten-UI

**Files:**
- Modify: `src/components/LernpaarKarte.tsx`
- Modify: `src/pages/Quiz.tsx` (`Session`)
- Test: `tests/lernpaarKarte.test.tsx` (erweitern)

**Interfaces:**
- Consumes: `QuizModus`, `ladeQuizModus`, `speichereQuizModus`, `SelbstWertung`, `merkeLernpaarSelbst` (Task 7).
- Produces: `LernpaarKarte` bekommt zwei neue optionale Props: `modus?: 'auswahl' | 'freitext'` (Default `'auswahl'`) und `onSelbst?: (wertung: SelbstWertung) => void`. Im Freitext-Modus wird `onSelbst` statt `onErgebnis` gerufen. Zuordnungs-Paare ignorieren den Freitext-Modus (Ziffern-Eingabe bleibt).

- [ ] **Step 1: Failing Render-Tests schreiben** (in `tests/lernpaarKarte.test.tsx` anhängen; bestehende Fixtures/Muster der Datei wiederverwenden — dort existiert bereits ein MC-Lernpaar-Fixture):

```tsx
describe('Freitext-Modus', () => {
  it('zeigt ein Textfeld statt Optionen', () => {
    const html = renderToString(
      <LernpaarKarte paar={paarMC} optionen={['A', 'B']} korrekt={[0]} fach={null}
        modus="freitext" onErgebnis={() => {}} onSelbst={() => {}} onWeiter={() => {}} />,
    )
    expect(html).toContain('<textarea')
    expect(html).not.toContain('>A<')
  })
})
```

(`paarMC` = das vorhandene MC-Fixture der Testdatei; Namen beim Einbau an den tatsächlichen Fixture-Namen der Datei angleichen.)

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/lernpaarKarte.test.tsx` — Expected: FAIL.

- [ ] **Step 3: LernpaarKarte erweitern**

Props ergänzen (`modus = 'auswahl'`, `onSelbst`), Import `import type { SelbstWertung } from '../lib/lernquiz'`. Neuer State:

```tsx
const [text, setText] = useState('')
const [selbstGewertet, setSelbstGewertet] = useState<SelbstWertung | null>(null)
const freitext = modus === 'freitext' && !zuordnung
```

`pruefenGesperrt` erweitern: `freitext ? text.trim().length === 0 : …bisherige Logik`.

`abgeben()` anpassen:

```tsx
function abgeben() {
  setAbgegeben(true)
  if (!freitext) onErgebnis(richtig)
}
```

Options-Bereich: bei `freitext && !abgegeben` statt der Options-Buttons:

```tsx
<textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  rows={4}
  placeholder="✍️ Formuliere die Antwort in eigenen Worten …"
  className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-[15px] focus:border-sky-500 focus:outline-none"
/>
```

Auflösung: bei `freitext && abgegeben` statt Options-Buttons + bisheriger Ergebnis-Zeile:

```tsx
<div className="mt-3 grid gap-2 sm:grid-cols-2">
  <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
    <p className="mb-1 text-xs font-semibold uppercase text-sky-700">✍️ Deine Antwort</p>
    <p className="whitespace-pre-wrap text-[15px] text-slate-800">{text}</p>
  </div>
  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
    <p className="mb-1 text-xs font-semibold uppercase text-green-700">Musterlösung</p>
    <ul className="list-disc pl-4 text-[15px] text-slate-800">
      {korrekt.map((i) => (
        <li key={i}><OptionText text={optionen[i]} /></li>
      ))}
    </ul>
  </div>
</div>
<div className="mt-2 rounded-lg bg-slate-50 p-3">
  <Markdown text={paar.erklaerung} />
</div>
{selbstGewertet === null ? (
  <div className="mt-3 grid grid-cols-3 gap-2">
    {([
      ['gewusst', '✔ Gewusst', 'bg-green-600 hover:bg-green-700'],
      ['teilweise', '≈ Teilweise', 'bg-amber-500 hover:bg-amber-600'],
      ['nicht', '✘ Nicht gewusst', 'bg-red-500 hover:bg-red-600'],
    ] as const).map(([wertung, label, stil]) => (
      <button key={wertung} type="button"
        onClick={() => { setSelbstGewertet(wertung); onSelbst?.(wertung) }}
        className={`min-h-12 rounded-xl px-2 text-sm font-semibold text-white ${stil}`}>
        {label}
      </button>
    ))}
  </div>
) : (
  <button type="button" onClick={onWeiter}
    className="mt-4 min-h-12 w-full rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800 sm:w-auto sm:px-8">
    Weiter →
  </button>
)}
```

Der bisherige `abgegeben`-Block (Ergebnis-Zeile + Erklärung + Weiter) läuft nur noch im Auswahl-Modus (`!freitext`).

- [ ] **Step 4: Session verdrahten** (`src/pages/Quiz.tsx`):

Imports: `ladeQuizModus, speichereQuizModus` aus `../lib/quizmodus`; `merkeLernpaarSelbst, type SelbstWertung` aus `../lib/lernquiz`. In `Session`:

```tsx
const [modus, setModus] = useState(ladeQuizModus)

function wechsleModus(m: QuizModus) {
  setModus(m)
  speichereQuizModus(m)
}

function ergebnisSelbst(wertung: SelbstWertung) {
  if (!aktuell) return
  merkeLernpaarSelbst(aktuell.id, wertung, heute)
  // teilweise zählt als halber Treffer in der Themen-Quote.
  merkeQuiz(aktuell.themaId, wertung === 'gewusst' ? 1 : wertung === 'teilweise' ? 0.5 : 0, 1, heute)
  if (wertung === 'gewusst') setRichtige((n) => n + 1)
}
```

Umschalter über der Karte (zwischen Fortschrittsbalken und `<LernpaarKarte>`):

```tsx
<div className="mb-3 flex gap-1 text-sm">
  {([['auswahl', 'Antworten wählen'], ['freitext', 'Selbst formulieren']] as const).map(([m, label]) => (
    <button key={m} type="button" onClick={() => wechsleModus(m)}
      className={`rounded-lg px-3 py-1.5 font-medium ${
        modus === m ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
      }`}>
      {label}
    </button>
  ))}
</div>
```

Karte: `modus={modus}` und `onSelbst={ergebnisSelbst}` als Props ergänzen.

- [ ] **Step 5: Alle Tests + Typecheck** — Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 6: Manuell prüfen** — Dev-Server: Freitext-Modus umschalten, Antwort tippen, alle drei Bewertungen durchspielen; Zuordnungs-Frage muss trotz Freitext-Modus die Ziffern-Eingabe zeigen. Server stoppen.

- [ ] **Step 7: Commit**

```bash
git add src/components/LernpaarKarte.tsx src/pages/Quiz.tsx tests/lernpaarKarte.test.tsx
git commit -m "feat: Freitext-Selbstabgleich im Themen-Quiz (Paket C)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Paket E2+E3 — Zuordnung: Auswahl statt Ziffern-Tippen

**Files:**
- Modify: `src/components/ZuordnungFelder.tsx`
- Test: `tests/zuordnungFelder.test.tsx` (anpassen)

**Interfaces:**
- Consumes/Produces: Props von `ZuordnungFelder` bleiben EXAKT gleich (`zuordnung`, `antworten: Record<string,string>`, `onAntwort(label, wert)`, `abgegeben`) — der Wert bleibt die Ziffer als String, dadurch bleiben `wertungZuordnung`, `alleAusgefuellt`, `LernpaarKarte`, `ZuordnungQuiz` und `Simulation` unverändert.

- [ ] **Step 1: Tests anpassen (zuerst — sie definieren das neue Verhalten)**

In `tests/zuordnungFelder.test.tsx`:
- Test 1 („zeigt Legende, Zeilen und Eingabefelder"): `expect(html).toContain('<input')` ersetzen durch `expect(html).toContain('<select')` und zusätzlich `expect(html).toContain('Konkurrierende Ziele')` (Options-Text erscheint im Dropdown).
- Test 3 („sperrt die Eingabefelder nach der Abgabe"): Assertion von `<input`-`disabled` auf `<select`-`disabled` umstellen (`expect(html).toMatch(/<select[^>]*disabled/)`).
- Test 2 (richtige Ziffer an falschen Zeilen) bleibt unverändert.

- [ ] **Step 2: Tests laufen lassen** — Run: `npx vitest run tests/zuordnungFelder.test.tsx` — Expected: FAIL (noch `<input>`).

- [ ] **Step 3: Implementieren** — in `ZuordnungFelder.tsx` das `<input>`-Element ersetzen:

```tsx
<select
  value={antworten[item.label] ?? ''}
  onChange={(e) => onAntwort(item.label, e.target.value)}
  disabled={abgegeben}
  aria-label={`Ziffer für ${item.label})`}
  className="h-11 max-w-44 shrink-0 rounded-lg border-2 border-slate-300 bg-white px-2 text-[15px] font-semibold focus:border-sky-500 focus:outline-none disabled:opacity-70"
>
  <option value="">Ziffer …</option>
  {zuordnung.ziffern.map((z) => (
    <option key={z.nr} value={String(z.nr)}>
      {z.nr} — {z.text.length > 34 ? `${z.text.slice(0, 34)}…` : z.text}
    </option>
  ))}
</select>
```

Zusätzlich (E3) den Legenden-Block oben um einen erklärenden Halbsatz ergänzen:

```tsx
<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
  Ziffern-Legende — pro Zeile unten die passende Ziffer wählen
</p>
```

Kommentar am Komponenten-Kopf aktualisieren („pro Teilaufgabe eine Auswahl aus der Legende" statt „ein Ziffernfeld").

- [ ] **Step 4: Tests laufen lassen** — Run: `npx vitest run tests/zuordnungFelder.test.tsx tests/zuordnungQuiz.test.tsx tests/lernpaarKarte.test.tsx` — Expected: PASS (ZuordnungQuiz/LernpaarKarte nutzen die Komponente nur durchgereicht).

- [ ] **Step 5: Manuell prüfen** — Dev-Server: eine Zuordnungs-Frage im Quiz und eine in der Simulation bedienen; Auswahl ändern, abgeben, Korrekturhinweis prüfen. Server stoppen.

- [ ] **Step 6: Commit**

```bash
git add src/components/ZuordnungFelder.tsx tests/zuordnungFelder.test.tsx
git commit -m "feat: Zuordnung per Dropdown-Auswahl aus der Legende (Paket E2+E3)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: Paket E1 — Zuordnungs-Inhaltsaudit

**Files:**
- Create: `tests/zuordnungDaten.test.ts` (struktureller Daten-Audit, dauerhaft)
- Modify: `public/data/aufgaben/*.json`, `public/data/lernpaare/*.json` (nur bei Befunden)
- Modify: `content-pipeline/audit-report.md` (Befunde dokumentieren)

**Interfaces:**
- Consumes: JSON-Daten; Typ `Zuordnung` (`ziffern: {nr, text}[]`, `items: {label, text, korrekt}[]`).
- Produces: bereinigter Datenbestand + dauerhafter Audit-Test. Keine Code-API.

- [ ] **Step 1: Strukturellen Audit-Test schreiben**

```ts
// tests/zuordnungDaten.test.ts
import { describe, expect, it } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import type { Zuordnung } from '../src/types'

// Sammelt alle Zuordnungs-Objekte aus aufgaben/*.json und lernpaare/*.json.
function alleZuordnungen(): { quelle: string; id: string; z: Zuordnung }[] {
  const dataDir = join(__dirname, '..', 'public', 'data')
  const ergebnis: { quelle: string; id: string; z: Zuordnung }[] = []
  for (const ordner of ['aufgaben', 'lernpaare']) {
    const dir = join(dataDir, ordner)
    if (!existsSync(dir)) continue
    for (const datei of readdirSync(dir).filter((d) => d.endsWith('.json'))) {
      const liste = JSON.parse(readFileSync(join(dir, datei), 'utf8')) as {
        id: string
        zuordnung?: Zuordnung
      }[]
      for (const eintrag of liste) {
        if (eintrag.zuordnung)
          ergebnis.push({ quelle: `${ordner}/${datei}`, id: eintrag.id, z: eintrag.zuordnung })
      }
    }
  }
  return ergebnis
}

describe('Zuordnungs-Datenqualität', () => {
  const alle = alleZuordnungen()

  it('es gibt Zuordnungs-Einträge', () => expect(alle.length).toBeGreaterThan(0))

  it.each(alle.map((e) => [`${e.quelle} → ${e.id}`, e] as const))(
    '%s: Ziffern eindeutig, korrekt-Verweise gültig, Labels eindeutig',
    (_, e) => {
      const nrs = e.z.ziffern.map((z) => z.nr)
      expect(new Set(nrs).size).toBe(nrs.length) // keine doppelten Ziffern
      const labels = e.z.items.map((i) => i.label)
      expect(new Set(labels).size).toBe(labels.length) // keine doppelten Labels
      for (const item of e.z.items) {
        expect(nrs).toContain(item.korrekt) // jede Lösung zeigt auf eine echte Ziffer
      }
      // Mehr Ziffern als Items ODER gleich viele: eine Legende, die kleiner ist
      // als die Item-Zahl, erzwingt Doppelverwendung — erlaubt, aber prüfen,
      // dass mindestens 2 Ziffern zur Wahl stehen.
      expect(nrs.length).toBeGreaterThanOrEqual(2)
    },
  )
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/zuordnungDaten.test.ts` — Expected: vermutlich PASS; jeder FAIL ist ein echter Datenfehler → in Step 3 fixen.

- [ ] **Step 3: Inhaltliches Audit durchführen**

Für JEDEN Zuordnungs-Eintrag (Task-Ausführender arbeitet die Liste aus Step 1 ab, Bereiche wiso → kbz → Lernpaare):
1. `loesung`-/`erklaerung`-Text des Eintrags lesen und prüfen, ob die `item.korrekt`-Ziffern dem Text widersprechen.
2. Bei Einträgen mit `termin`/`quellTermin`: die Original-Lösung im PDF-Ordner des Termins gegenprüfen (`/media/sf_Prfungsvorbereitung_KBM/<Jahr> <Sommer|Winter>/`; interne Zuordnung Termin↔Sammlung in `content-pipeline/termine-intern.md`).
3. Fachlich prüfen: Ist jede Zeile eindeutig lösbar? (Bekanntes Altproblem: 19 Einträge waren als Reihenfolge kodiert und teils unlösbar — auf Reste dieses Musters achten.)
4. Korrekturen DIREKT in `public/data/aufgaben/*.json` bzw. `public/data/lernpaare/*.json` vornehmen (kleine Fixes brauchen kein Staging); jede Korrektur als Zeile in `content-pipeline/audit-report.md` unter einer neuen Überschrift `## Zuordnungs-Audit 2026-09-11` dokumentieren (Format: `- <id>: <was war falsch> → <was wurde geändert>`). Auch „geprüft, kein Befund" als Sammelzeile je Datei festhalten.
5. Erklärungen, die durch Korrekturen positionsbezogen würden, inhaltlich umformulieren (Global Constraint).

- [ ] **Step 4: Alle Daten-Tests laufen lassen** — Run: `npx vitest run tests/zuordnungDaten.test.ts tests/schema.test.ts tests/zuordnung.test.ts` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/zuordnungDaten.test.ts public/data content-pipeline/audit-report.md
git commit -m "fix: Zuordnungs-Inhaltsaudit + dauerhafter Daten-Qualitätstest (Paket E1)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: Paket F — Simulation: ehrlicher Zwischenstand

**Files:**
- Create: `src/lib/simulationErgebnis.ts`
- Modify: `src/pages/Simulation.tsx` (Ergebnis-Box nach Abgabe, Zeilen ~220–228)
- Test: `tests/simulationErgebnis.test.ts`

**Interfaces:**
- Consumes: nichts Projektspezifisches (pure Funktion).
- Produces:

```ts
export interface Zwischenstand {
  fertig: boolean          // alle offenen Aufgaben bewertet (oder keine offenen)
  autoPunkte: number       // erreichte Punkte MC+Zuordnung
  autoMax: number          // maximale Punkte MC+Zuordnung
  offenErreicht: number    // Punkte aus bereits bewerteten offenen Aufgaben
  offenMax: number         // maximale Punkte aller offenen Aufgaben
  unbewertet: number       // Anzahl noch unbewerteter offener Aufgaben
  unbewertetMax: number    // maximale Punkte der noch unbewerteten
  gesamt: number           // autoPunkte + offenErreicht
  gesamtMax: number        // autoMax + offenMax
}
export function berechneZwischenstand(
  autoPunkte: number,
  autoMax: number,
  offene: { max: number; erreicht: number | null }[], // null = noch unbewertet
): Zwischenstand
```

- [ ] **Step 1: Failing Tests schreiben**

```ts
// tests/simulationErgebnis.test.ts
import { describe, expect, it } from 'vitest'
import { berechneZwischenstand } from '../src/lib/simulationErgebnis'

describe('berechneZwischenstand', () => {
  it('ohne offene Aufgaben sofort fertig', () => {
    const z = berechneZwischenstand(40, 50, [])
    expect(z).toMatchObject({ fertig: true, gesamt: 40, gesamtMax: 50, unbewertet: 0 })
  })

  it('unbewertete offene Aufgaben → nicht fertig, Zähler stimmen', () => {
    const z = berechneZwischenstand(40, 50, [
      { max: 10, erreicht: null },
      { max: 20, erreicht: 15 },
    ])
    expect(z).toMatchObject({
      fertig: false, autoPunkte: 40, autoMax: 50,
      offenErreicht: 15, offenMax: 30, unbewertet: 1, unbewertetMax: 10,
      gesamt: 55, gesamtMax: 80,
    })
  })

  it('alle offenen bewertet → fertig', () => {
    const z = berechneZwischenstand(40, 50, [{ max: 10, erreicht: 5 }])
    expect(z).toMatchObject({ fertig: true, gesamt: 45, gesamtMax: 60 })
  })
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/simulationErgebnis.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implementieren**

```ts
// src/lib/simulationErgebnis.ts
// Ehrlicher Zwischenstand nach der Abgabe: Note gibt es erst, wenn alle
// offenen Aufgaben bewertet sind (Selbsteinschätzung oder KI).

export interface Zwischenstand {
  fertig: boolean
  autoPunkte: number
  autoMax: number
  offenErreicht: number
  offenMax: number
  unbewertet: number
  unbewertetMax: number
  gesamt: number
  gesamtMax: number
}

export function berechneZwischenstand(
  autoPunkte: number,
  autoMax: number,
  offene: { max: number; erreicht: number | null }[],
): Zwischenstand {
  const offenMax = offene.reduce((s, o) => s + o.max, 0)
  const bewertete = offene.filter((o) => o.erreicht !== null)
  const offenErreicht = bewertete.reduce((s, o) => s + (o.erreicht ?? 0), 0)
  const unbewertete = offene.filter((o) => o.erreicht === null)
  return {
    fertig: unbewertete.length === 0,
    autoPunkte,
    autoMax,
    offenErreicht,
    offenMax,
    unbewertet: unbewertete.length,
    unbewertetMax: unbewertete.reduce((s, o) => s + o.max, 0),
    gesamt: Math.round((autoPunkte + offenErreicht) * 10) / 10,
    gesamtMax: autoMax + offenMax,
  }
}
```

- [ ] **Step 4: Test laufen lassen** — Run: `npx vitest run tests/simulationErgebnis.test.ts` — Expected: PASS.

- [ ] **Step 5: Simulation.tsx umbauen**

Imports: `berechneZwischenstand` aus `../lib/simulationErgebnis`. Nach den bestehenden Auswertungs-`const`s (nach `maxPunkteGesamt`, Zeile ~126):

```tsx
// erreicht: KI-Ergebnis > Selbsteinschätzung > unbewertet (null).
const stand = berechneZwischenstand(
  mcPunkte,
  autoErgebnisse.reduce((s, e) => s + (e.a.punkte ?? 1), 0),
  offene.map((a) => ({
    max: a.punkte ?? 1,
    erreicht:
      kiErgebnisse[a.id] !== undefined
        ? kiErgebnisse[a.id].punkte
        : selbst[a.id] !== undefined
          ? selbst[a.id] ? (a.punkte ?? 1) : 0
          : null,
  })),
)
```

Die Ergebnis-Box (bisher `Ergebnis: {mcPunkte + selbstPunkte} von {pruefung.punkteGesamt} Punkten` + Untertitel) ersetzen:

```tsx
{stand.fertig ? (
  <>
    <p className="font-bold text-slate-900">
      Ergebnis: {stand.gesamt} von {stand.gesamtMax} erfassten Punkten (
      {Math.round((stand.gesamt / Math.max(stand.gesamtMax, 1)) * 100)} %) — Note{' '}
      {ihkNote((stand.gesamt / Math.max(stand.gesamtMax, 1)) * 100).note}
    </p>
    <p className="text-sm text-slate-600">
      Auswahlaufgaben: {stand.autoPunkte}/{stand.autoMax} P. · offene Aufgaben:{' '}
      {stand.offenErreicht}/{stand.offenMax} P.
      {kiStatus !== 'fertig' && ' (Selbsteinschätzung)'}
    </p>
  </>
) : (
  <>
    <p className="font-bold text-slate-900">
      Zwischenstand: {stand.autoPunkte} von {stand.autoMax} Punkten aus den Auswahlaufgaben
    </p>
    <p className="text-sm text-slate-600">
      Noch unbewertet: {stand.unbewertet} offene Aufgabe{stand.unbewertet === 1 ? '' : 'n'} (
      {stand.unbewertetMax} P.) — bewerte sie unten selbst oder lass die KI korrigieren,
      dann gibt es Gesamtergebnis und Note.
    </p>
  </>
)}
```

Die Variable `selbstPunkte` wird danach nicht mehr gebraucht — entfernen (sonst meckert der Linter). Der KI-Berichts-Block darunter bleibt unverändert.

- [ ] **Step 6: Alle Tests + Typecheck** — Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 7: Manuell prüfen** — Dev-Server: Simulation mit offenen Aufgaben abgeben → Zwischenstand-Text ohne Note; alle offenen selbst bewerten → Ergebnis + Note erscheinen. Server stoppen.

- [ ] **Step 8: Commit**

```bash
git add src/lib/simulationErgebnis.ts src/pages/Simulation.tsx tests/simulationErgebnis.test.ts
git commit -m "feat: Simulation zeigt ehrlichen Zwischenstand, Note erst nach Bewertung (Paket F)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: Paket H — Präsentationen: alle Fragen als Folien + Bestandsprüfung

**Files:**
- Modify: `src/pages/Praesentation.tsx` (Folien-Aufbau, Zeilen ~52–75; Quiz-Folien-Renderer ~156)
- Test: `tests/folien.test.ts` (erweitern um Registry-Prüfung)

**Interfaces:**
- Consumes: `ZuordnungQuiz` (bestehend), `FOLIEN_DIAGRAMME` aus `src/components/diagramme.tsx`, `folienAusThema` (unverändert).
- Produces: Quiz-Folien für ALLE MC- und Zuordnungs-Fragen eines Themas, stabile Reihenfolge (Original-Aufgaben zuerst, dann Lernpaare; innerhalb je nach `id` sortiert).

- [ ] **Step 1: Registry-Prüfung als Test schreiben** (in `tests/folien.test.ts` anhängen)

```ts
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { FOLIEN_DIAGRAMME } from '../src/components/diagramme'
import type { Thema } from '../src/types'

describe('FOLIEN_DIAGRAMME-Registry', () => {
  it('jeder Registry-Schlüssel existiert als ##-Abschnitt in einem Lernzettel', () => {
    const dataDir = join(__dirname, '..', 'public', 'data', 'themen')
    const titel = new Set<string>()
    for (const bereich of ['wiso', 'kbz', 'buchfuehrung', 'muendlich']) {
      const pfad = join(dataDir, `${bereich}.json`)
      if (!existsSync(pfad)) continue
      const themen = JSON.parse(readFileSync(pfad, 'utf8')) as Thema[]
      for (const t of themen) {
        for (const m of t.lernzettel.matchAll(/^##\s+(.+)$/gm)) titel.add(m[1].trim())
      }
    }
    for (const key of Object.keys(FOLIEN_DIAGRAMME)) {
      expect(titel, `Registry-Schlüssel ohne passenden ##-Abschnitt: "${key}"`).toContain(key)
    }
  })
})
```

Hinweis: Liegen die Themen-Dateien unter einem anderen Pfad (z. B. `public/data/wiso.json` statt `public/data/themen/wiso.json`), zuerst mit `ls public/data` prüfen und den Pfad im Test anpassen — `src/lib/data.ts` zeigt die echten Dateinamen. Ist `FOLIEN_DIAGRAMME` in `src/components/diagramme.tsx` bisher nicht exportiert (nur intern genutzt), dort `export` vor die `const`-Deklaration setzen — sonst kann der Test es nicht importieren.

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/folien.test.ts` — Expected: PASS wenn Registry sauber; jeder FAIL ist ein echter verwaister Schlüssel → Schlüssel in `diagramme.tsx` an den aktuellen `##`-Titel angleichen (NICHT den Lernzettel ändern, außer der Abschnitt fehlt ganz — dann fehlenden Abschnitt ergänzen).

- [ ] **Step 3: Folien-Aufbau umstellen** (`Praesentation.tsx`, im `folien`-useMemo):

Den Block „Bis zu 3 anklickbare MC-Quizfragen …" ersetzen durch:

```tsx
// ALLE Quizfragen des Themas als Folien: erst Original-/abgeleitete Aufgaben
// (MC + Zuordnung), dann Lernpaare aus dem Themen-Quiz; Reihenfolge stabil
// (kein Zufall im Beamer-Einsatz).
const fragen: Aufgabe[] = [
  ...(aufgaben ?? [])
    .filter((a) => a.themaId === t.id && (a.typ === 'mc' || a.typ === 'zuordnung'))
    .sort((a, b) => a.id.localeCompare(b.id)),
  ...(lernpaare ?? [])
    .filter((p) => p.themaId === t.id)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(alsAufgabe),
]
fragen.forEach((a, i) =>
  basis.push({
    art: 'quiz',
    titel: `Quizfrage ${i + 1} von ${fragen.length}`,
    themaId: t.id,
    aufgabeId: a.id,
  }),
)
```

`alsAufgabe` erweitern, damit Zuordnungs-Lernpaare mitkommen:

```tsx
function alsAufgabe(p: Lernpaar): Aufgabe {
  return {
    id: p.id,
    themaId: p.themaId,
    bereich: p.bereich,
    quelle: 'generiert',
    typ: p.typ ?? 'mc',
    text: p.frage,
    optionen: p.optionen,
    korrekt: p.korrekt,
    zuordnung: p.zuordnung,
    loesung: p.erklaerung,
    erklaerung: p.erklaerung,
  }
}
```

- [ ] **Step 4: Quiz-Folie um Zuordnung erweitern** — im Quiz-Folien-Renderer (`f.art === 'quiz'`):

Import `ZuordnungQuiz` ergänzen und den `<QuizMC …>`-Aufruf ersetzen:

```tsx
{(() => {
  const a = aufgabeZu(f.aufgabeId)
  if (!a) return <p className="text-slate-500">Frage wird geladen …</p>
  return a.typ === 'zuordnung' ? (
    <ZuordnungQuiz key={`${f.aufgabeId}-${aktiv}`} aufgabe={a} onErgebnis={() => {}} />
  ) : (
    <QuizMC key={`${f.aufgabeId}-${aktiv}`} aufgabe={a} onErgebnis={() => {}} />
  )
})()}
```

- [ ] **Step 5: Alle Tests + Typecheck** — Run: `npx vitest run && npx tsc --noEmit` — Expected: PASS.

- [ ] **Step 6: Manuell prüfen** — Dev-Server: `#/praesentation/wiso/<themaId>` eines fragenreichen Themas öffnen; Foliennummerierung „Quizfrage i von n", Zuordnungsfolie bedienbar, Pfeiltasten/Swipe ok. Druckansicht (Strg+P-Vorschau): Quiz-Folien bleiben `print:hidden`. Server stoppen.

- [ ] **Step 7: Commit** (PDF-Regenerierung folgt gesammelt in Task 14)

```bash
git add src/pages/Praesentation.tsx tests/folien.test.ts src/components/diagramme.tsx
git commit -m "feat: Präsentation zeigt alle MC-/Zuordnungsfragen des Themas (Paket H)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Paket G — Darkmode

**Files:**
- Create: `src/lib/theme.ts`
- Modify: `src/index.css`, `src/main.tsx`, `src/components/Layout.tsx`
- Modify (Klassen-Sweep): alle Seiten/Komponenten unter `src/pages/` und `src/components/` mit hartcodierten Hell-Klassen — AUSSER `Skript.tsx`, `Nachschlagewerk.tsx`, `Handout.tsx` (Druckrouten bleiben hell) und `Praesentation.tsx` (hat eigenes dunkles Design)
- Test: `tests/theme.test.ts`

**Interfaces:**
- Produces:

```ts
export type Theme = 'hell' | 'dunkel' | 'system'
export function ladeTheme(): Theme                  // Default 'system', Key kbm.v1.theme
export function speichereTheme(t: Theme): void      // speichert UND wendet an
export function wendeThemeAn(t: Theme): void        // .dark-Klasse auf <html> togglen
export function themeInitialisieren(): void         // beim App-Start + matchMedia-Listener
```

- [ ] **Step 1: Failing Tests schreiben**

```ts
// tests/theme.test.ts
import { beforeEach, describe, expect, it } from 'vitest'
import { ladeTheme, speichereTheme, wendeThemeAn } from '../src/lib/theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('theme', () => {
  it('Default ist system', () => expect(ladeTheme()).toBe('system'))

  it('speichereTheme persistiert und wendet an', () => {
    speichereTheme('dunkel')
    expect(ladeTheme()).toBe('dunkel')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    speichereTheme('hell')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('wendeThemeAn("system") folgt prefers-color-scheme', () => {
    // jsdom: matchMedia liefert matches=false → hell.
    wendeThemeAn('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
```

Hinweis: Läuft die Testumgebung ohne `matchMedia` (nackt jsdom), im Test ein Minimal-Mock setzen:

```ts
window.matchMedia ??= ((q: string) =>
  ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }) as MediaQueryList) as typeof window.matchMedia
```

- [ ] **Step 2: Test laufen lassen** — Run: `npx vitest run tests/theme.test.ts` — Expected: FAIL.

- [ ] **Step 3: Theme-Infrastruktur implementieren**

```ts
// src/lib/theme.ts
// Hell/Dunkel/System-Theme: .dark-Klasse auf <html>, Persistenz in kbm.v1.theme.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.theme'

export type Theme = 'hell' | 'dunkel' | 'system'

export function ladeTheme(): Theme {
  const t = getItem<Theme>(KEY)
  return t === 'hell' || t === 'dunkel' ? t : 'system'
}

function systemDunkel(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches
}

export function wendeThemeAn(t: Theme): void {
  const dunkel = t === 'dunkel' || (t === 'system' && systemDunkel())
  document.documentElement.classList.toggle('dark', dunkel)
}

export function speichereTheme(t: Theme): void {
  setItem(KEY, t)
  wendeThemeAn(t)
}

export function themeInitialisieren(): void {
  wendeThemeAn(ladeTheme())
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (ladeTheme() === 'system') wendeThemeAn('system')
  })
}
```

`src/index.css` — Tailwind v4 nutzt CSS-Konfiguration; die Dark-Variante auf Klassen-Strategie umstellen:

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

html {
  -webkit-tap-highlight-color: transparent;
}

html.dark {
  color-scheme: dark;
}
```

`src/main.tsx`: `import { themeInitialisieren } from './lib/theme'` und VOR dem React-Render `themeInitialisieren()` aufrufen.

- [ ] **Step 4: Test laufen lassen** — Run: `npx vitest run tests/theme.test.ts` — Expected: PASS.

- [ ] **Step 5: Theme-Umschalter im Layout**

In `Layout.tsx` (Imports: `ladeTheme, speichereTheme, type Theme` aus `../lib/theme`), im Header neben dem Anmelden-Button:

```tsx
const [theme, setTheme] = useState<Theme>(ladeTheme)
const REIHE: Theme[] = ['system', 'hell', 'dunkel']
const THEME_ICON = { system: '🖥️', hell: '☀️', dunkel: '🌙' } as const

function naechstesTheme() {
  const neu = REIHE[(REIHE.indexOf(theme) + 1) % REIHE.length]
  setTheme(neu)
  speichereTheme(neu)
}
```

```tsx
<button
  type="button"
  onClick={naechstesTheme}
  title={`Theme: ${theme} — klicken zum Wechseln`}
  aria-label={`Theme wechseln, aktuell ${theme}`}
  className="min-h-11 min-w-11 rounded-lg px-2 text-lg hover:bg-slate-100 dark:hover:bg-slate-800"
>
  {THEME_ICON[theme]}
</button>
```

- [ ] **Step 6: Klassen-Sweep**

Feste Ersetzungs-Tabelle — überall dort, wo die Hell-Klasse steht, die `dark:`-Variante DANEBEN ergänzen (nie ersetzen):

| Hell | ergänzen |
|---|---|
| `bg-slate-100` (Seitenhintergrund) | `dark:bg-slate-950` |
| `bg-white` | `dark:bg-slate-900` |
| `bg-slate-50` | `dark:bg-slate-800/60` |
| `bg-white/90` (Header) | `dark:bg-slate-900/90` |
| `border-slate-200` / `border-slate-100` | `dark:border-slate-800` |
| `border-slate-300` | `dark:border-slate-700` |
| `text-slate-900` | `dark:text-slate-100` |
| `text-slate-800` | `dark:text-slate-200` |
| `text-slate-700` / `text-slate-600` | `dark:text-slate-300` |
| `text-slate-500` | `dark:text-slate-400` |
| `hover:bg-slate-100` / `hover:bg-slate-200` | `dark:hover:bg-slate-800` |
| `bg-<farbe>-50` (amber/green/red/sky/violet/rose…) | `dark:bg-<farbe>-950/40` |
| `border-<farbe>-200` | `dark:border-<farbe>-900` |
| `text-<farbe>-700` / `-800` / `-900` | `dark:text-<farbe>-300` / `-300` / `-200` |
| `bg-slate-900 text-white` (Primär-Buttons) | unverändert lassen (funktioniert dunkel) — nur `dark:bg-slate-700 dark:hover:bg-slate-600` wo `hover:bg-slate-800`-Kontrast verloren geht |

Reihenfolge des Sweeps (jede Datei einzeln, danach Sichtprüfung im Dev-Server): `Layout.tsx` → `Home.tsx`/`BereichKachel.tsx` → `Lernstand.tsx`/`ThemenTabelle.tsx` → `Quiz.tsx`/`LernpaarKarte.tsx`/`ZuordnungFelder.tsx`/`OptionText.tsx` → `Simulation.tsx`/`Timer.tsx`/`KIBewertung.tsx`/`Anlage.tsx` → `Glossar.tsx`/`Suche.tsx` → `Stufe1-3.tsx`/`AufgabenKarte.tsx`/`QuizMC.tsx`/`QuizOffen.tsx`/`ZuordnungQuiz.tsx`/`NotizFeld.tsx` → `Rechnen.tsx`/`RechnenKapitel.tsx`/`RechnenAufgabe.tsx` → `Unterricht.tsx`/`UnterrichtSession.tsx`/`MedienSlot.tsx` → `Muendlich.tsx`/`Karteikarten.tsx`/`Bereich.tsx`/`Landkarte.tsx`/`Anmelden.tsx`/`Gate.tsx`.

NICHT anfassen: `Skript.tsx`, `Nachschlagewerk.tsx`, `Handout.tsx`, `Praesentation.tsx`. Rough.js-Diagramme (`AnlagenDiagramm.tsx`, `diagramme.tsx`) zeichnen auf weißem Karten-Hintergrund — deren Container-Karte bekommt KEIN `dark:bg-*`, sondern bleibt `bg-white` (lesbare Diagramme sind wichtiger als durchgängiges Dunkel; Hinweis-Kommentar an den Container schreiben).

- [ ] **Step 7: Alle Tests + Typecheck + Build** — Run: `npx vitest run && npx tsc --noEmit && npx vite build` — Expected: PASS, Build ohne Fehler. (Leere `dist/` nach Build = vboxsf-Paketkorruption → `rm -rf node_modules && npm install --no-bin-links`, vorher Preview/Dev-Server stoppen.)

- [ ] **Step 8: Manuell prüfen** — Dev-Server: Theme-Button durchschalten (System/Hell/Dunkel), ALLE Hauptseiten im Dunkel-Modus durchklicken (Home, Bereich, Quiz, Simulation inkl. Abgabe, Lernstand, Glossar, Rechnen, Unterricht, Suche, Anmelden); auf unlesbare Stellen achten und nachbessern. `#/skript/...` muss hell bleiben. Server stoppen.

- [ ] **Step 9: Commit**

```bash
git add src/index.css src/main.tsx src/lib/theme.ts tests/theme.test.ts src/components src/pages
git commit -m "feat: Darkmode mit Hell/Dunkel/System-Umschalter (Paket G)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 14: Abschluss — PDFs, Gesamtlauf, Dist-ZIP

**Files:**
- Modify: `public/downloads/*.pdf` (regeneriert)
- Modify: `/media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach-dist.zip` (neu)

**Interfaces:**
- Consumes: `scripts/pdfs.sh` (braucht laufenden Preview-Server + Zugangscode als Argument).
- Produces: fertiger Feature-Branch, bereit zum Merge.

- [ ] **Step 1: Gesamtlauf** — Run: `npx vitest run && npx tsc --noEmit` — Expected: alle Tests PASS (Bestand ~140 + neue).

- [ ] **Step 2: Build + Preview + PDFs regenerieren** (Paket H hat Folien geändert; `pdfs.sh` druckt aus den Skript-Routen):

```bash
npx vite build
npx vite preview &   # Preview starten
bash scripts/pdfs.sh KBMap2
# danach Preview-Prozess stoppen (kill %1) — vboxsf hält sonst Dateien offen
```

Erwartet: PDFs in `public/downloads/` mit frischem Datum. Danach NOCHMAL bauen (`npx vite build`), damit die neuen PDFs in `dist/` landen.

- [ ] **Step 3: Dist-ZIP neu packen**

```bash
cd /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach
rm -f ../kbm-pruefungscoach-dist.zip
(cd dist && zip -r ../../kbm-pruefungscoach-dist.zip .)
```

- [ ] **Step 4: Commit**

```bash
git add public/downloads
git commit -m "chore: Download-PDFs regeneriert, Dist-ZIP neu gepackt

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

- [ ] **Step 5: Abschluss-Entscheidung** — superpowers:finishing-a-development-branch verwenden (Merge auf `main` + Push nach Nutzer-Freigabe).
