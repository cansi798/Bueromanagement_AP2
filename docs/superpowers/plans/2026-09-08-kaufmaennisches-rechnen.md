# Kaufmännisches Rechnen — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neue Kachel „Kaufmännisches Rechnen" mit 10 Kapiteln: Kurzerklärung, unbegrenzt generierte Übungsaufgaben mit Zahleneingabe + Lösungsweg, plus die Original-Rechenaufgaben aus den WiSo-Prüfungen.

**Architecture:** Eigenständige Seite nach dem Glossar-Muster (kein 5. Bereich). Feste Inhalte in `public/data/rechnen.json` (schema-bewacht), Generatoren als Code in `src/lib/rechnen.ts`, Fortschritt unter `kbm.v1.rechnen` (läuft automatisch über den bestehenden sync mit).

**Tech Stack:** Vite 6 + React 18 + TS + Tailwind v4, Vitest (SSR-Smoke-Tests via `renderToString`, KEIN jsdom/testing-library), AJV-Schema-Audit, Markdown-Pipeline mit remark-math/rehype-katex/remark-gfm.

**Spec:** `docs/superpowers/specs/2026-09-08-kaufmaennisches-rechnen-design.md`

## Global Constraints

- Tests laufen mit `node node_modules/vitest/vitest.mjs run <datei>` — `npx vitest`/npm-bin-Links funktionieren auf dem vboxsf-Share NICHT.
- TypeScript-Check: `node node_modules/typescript/bin/tsc -b` (Exit 0 Pflicht).
- Arbeit auf Branch `feature/rechnen-kachel` (von `main` NACH Merge von `feature/zuordnung-eingabe` abzweigen).
- Alle UI-Texte, Bezeichner und Commits auf Deutsch; Code-Kommentare im Stil des Projekts (sparsam, nur Nicht-Offensichtliches).
- Kein `bereiche.json`-Eintrag, keine Änderungen an Stufen/Simulation/Karteikarten.
- Quellenangaben nur anonymisiert („Aufgabensammlung N" via `SAMMLUNGEN` in `src/lib/termine.ts`) — niemals Prüfungstermine nach außen.
- Zahlformat de-DE: Anzeige mit `toLocaleString('de-DE')`, Eingabe akzeptiert `1.234,56`, `1234,56`, `1234.56`.
- Zinsrechnung nach kaufmännischer Methode 30/360.
- TDD: jeder Test zuerst RED (beobachtet!), dann GREEN. Commits nach jedem Task.

---

### Task 1: Typen, Schema, Datengerüst, Loader

**Files:**
- Modify: `src/types.ts` (ans Dateiende anhängen)
- Modify: `schema/content.schema.json` (neue $defs)
- Modify: `tests/schema.test.ts` (Audit erweitern)
- Create: `public/data/rechnen.json`
- Modify: `src/lib/data.ts` (Loader `ladeRechnen`)

**Interfaces:**
- Produces: Typen `RechnenAufgabeFest`, `RechnenKapitel`, `GenerierteAufgabe`; Loader `ladeRechnen(): Promise<{ kapitel: RechnenKapitel[] }>`; Schema-Defs `rechnenKapitel`, `rechnenDatei`.

- [ ] **Step 1: Failing Test — Schema-Def + Datei-Audit**

In `tests/schema.test.ts`, im describe `Content-Schema-Audit` nach dem formeln-Block ergänzen:

```ts
  if (existsSync(join(dataDir, 'rechnen.json'))) {
    it('rechnen.json ist gültig', () => validate('rechnenDatei', join(dataDir, 'rechnen.json')))
  }
```

Und ein neues describe (auf oberster Ebene, vor dem Referenz-Audit):

```ts
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
```

- [ ] **Step 2: Test laufen lassen — muss scheitern** (rechnen.json fehlt / Schema-Def fehlt): `node node_modules/vitest/vitest.mjs run tests/schema.test.ts`

- [ ] **Step 3: Typen anhängen** (`src/types.ts`, ans Ende):

```ts
// Kachel „Kaufmännisches Rechnen": feste Übungsaufgabe mit Zahleneingabe.
export interface RechnenAufgabeFest {
  id: string
  text: string // Markdown (GFM-Tabellen für Markttabellen erlaubt)
  loesungswert: number
  einheit: string // "€" | "%" | "Stück" | "kWh" | "" …
  toleranz: number // absoluter Betrag; 0 = nur exakt
  loesungsweg: string // Markdown, Schritt für Schritt
  quelle?: { sammlung: number; aufgabe: string } // nur Original-Prüfungsaufgaben
}

export interface RechnenKapitel {
  id: string
  gruppe: 'grundlagen' | 'pruefung'
  titel: string
  kurz: string
  erklaerung: string // Markdown mit KaTeX
  aufgaben: RechnenAufgabeFest[]
}

// Vom Generator gelieferte Übungsaufgabe (gleiche Wertung wie feste Aufgaben).
export interface GenerierteAufgabe {
  text: string
  loesungswert: number
  einheit: string
  toleranz: number
  loesungsweg: string
}
```

- [ ] **Step 4: Schema-Defs ergänzen** (`schema/content.schema.json`, in `$defs`):

```json
"rechnenAufgabe": {
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "text", "loesungswert", "einheit", "toleranz", "loesungsweg"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "text": { "type": "string", "minLength": 1 },
    "loesungswert": { "type": "number" },
    "einheit": { "type": "string" },
    "toleranz": { "type": "number", "minimum": 0 },
    "loesungsweg": { "type": "string", "minLength": 1 },
    "quelle": {
      "type": "object",
      "additionalProperties": false,
      "required": ["sammlung", "aufgabe"],
      "properties": {
        "sammlung": { "type": "integer", "minimum": 1 },
        "aufgabe": { "type": "string", "minLength": 1 }
      }
    }
  }
},
"rechnenKapitel": {
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "gruppe", "titel", "kurz", "erklaerung", "aufgaben"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
    "gruppe": { "enum": ["grundlagen", "pruefung"] },
    "titel": { "type": "string", "minLength": 1 },
    "kurz": { "type": "string", "minLength": 1 },
    "erklaerung": { "type": "string", "minLength": 1 },
    "aufgaben": { "type": "array", "items": { "$ref": "#/$defs/rechnenAufgabe" } }
  }
},
"rechnenDatei": {
  "type": "object",
  "additionalProperties": false,
  "required": ["kapitel"],
  "properties": {
    "kapitel": { "type": "array", "items": { "$ref": "#/$defs/rechnenKapitel" }, "minItems": 10, "maxItems": 10 }
  }
}
```

- [ ] **Step 5: `public/data/rechnen.json` anlegen** — 10 Kapitel, `aufgaben: []`, `erklaerung` vorerst nur die Kernformel (wird in Task 10 ausgebaut). Exakter Inhalt:

```json
{
  "kapitel": [
    { "id": "dreisatz", "gruppe": "grundlagen", "titel": "Dreisatz",
      "kurz": "Gerader und ungerader Dreisatz — das Werkzeug hinter fast jeder Prüfungsrechnung.",
      "erklaerung": "## Dreisatz\n\nGerade Zuordnung (je mehr, desto mehr):\n\n$$x = \\frac{\\text{Wert} \\cdot \\text{gesuchte Menge}}{\\text{gegebene Menge}}$$", "aufgaben": [] },
    { "id": "prozentrechnung", "gruppe": "grundlagen", "titel": "Prozentrechnung",
      "kurz": "Grundwert, Prozentwert, Prozentsatz — inklusive vermehrtem und vermindertem Grundwert.",
      "erklaerung": "## Prozentrechnung\n\n$$P = \\frac{G \\cdot p}{100} \\qquad p = \\frac{P \\cdot 100}{G} \\qquad G = \\frac{P \\cdot 100}{p}$$", "aufgaben": [] },
    { "id": "zinsrechnung", "gruppe": "grundlagen", "titel": "Zinsrechnung",
      "kurz": "Jahres-, Monats- und Tageszinsen nach der kaufmännischen 30/360-Methode.",
      "erklaerung": "## Zinsrechnung\n\n$$Z = \\frac{K \\cdot p \\cdot t}{100 \\cdot 360}$$", "aufgaben": [] },
    { "id": "kg-gewinnverteilung", "gruppe": "pruefung", "titel": "KG-Gewinnverteilung",
      "kurz": "4 % Kapitalverzinsung, Restgewinn nach Vertrag oder Köpfen — der häufigste WiSo-Rechentyp.",
      "erklaerung": "## KG-Gewinnverteilung\n\n$$\\text{Verzinsung je Gesellschafter} = \\text{Einlage} \\cdot 0{,}04$$\n\n$$\\text{Restgewinn} = \\text{Gewinn} - \\text{Summe der Verzinsungen}$$", "aufgaben": [] },
    { "id": "gleichgewichtspreis-umsatz", "gruppe": "pruefung", "titel": "Gleichgewichtspreis & Umsatz",
      "kurz": "Markttabellen lesen: Gleichgewichtspreis finden und den Umsatz berechnen.",
      "erklaerung": "## Gleichgewichtspreis & Umsatz\n\nGleichgewicht: Angebot = Nachfrage.\n\n$$U = p \\cdot m$$", "aufgaben": [] },
    { "id": "darlehen", "gruppe": "pruefung", "titel": "Darlehen",
      "kurz": "Fälligkeits-, Tilgungs- und Annuitätendarlehen: Zinsen, Restschuld, Gesamtaufwand.",
      "erklaerung": "## Darlehen\n\n$$Z_{\\text{Jahr}} = \\text{Restschuld} \\cdot \\frac{p}{100}$$", "aufgaben": [] },
    { "id": "leasing", "gruppe": "pruefung", "titel": "Leasing",
      "kurz": "Gesamtkosten über die Laufzeit: Sonderzahlung + Raten + Restwert.",
      "erklaerung": "## Leasing\n\n$$K_{\\text{gesamt}} = \\text{Sonderzahlung} + \\text{Rate} \\cdot \\text{Monate} \\;(+\\; \\text{Restwert})$$", "aufgaben": [] },
    { "id": "wirtschaftlichkeit-produktivitaet", "gruppe": "pruefung", "titel": "Wirtschaftlichkeit & Produktivität",
      "kurz": "Ertrag durch Aufwand, Output durch Input — Kennzahlen beurteilen.",
      "erklaerung": "## Wirtschaftlichkeit & Produktivität\n\n$$\\text{Wirtschaftlichkeit} = \\frac{\\text{Ertrag}}{\\text{Aufwand}} \\qquad \\text{Produktivität} = \\frac{\\text{Output}}{\\text{Input}}$$", "aufgaben": [] },
    { "id": "konjunktur-indikatoren", "gruppe": "pruefung", "titel": "Konjunktur-Indikatoren",
      "kurz": "Inflationsrate, Arbeitslosenquote und prozentuale Veränderungen berechnen.",
      "erklaerung": "## Konjunktur-Indikatoren\n\n$$\\text{Inflationsrate} = \\frac{\\text{VPI}_{\\text{neu}} - \\text{VPI}_{\\text{alt}}}{\\text{VPI}_{\\text{alt}}} \\cdot 100$$", "aufgaben": [] },
    { "id": "energie-betriebskosten", "gruppe": "pruefung", "titel": "Energie- & Betriebskosten",
      "kurz": "Verbrauch mal Preis — Kosten und Einsparungen in Euro und Prozent.",
      "erklaerung": "## Energie- & Betriebskosten\n\n$$K = \\text{Leistung (kW)} \\cdot \\text{Stunden} \\cdot \\text{Preis je kWh}$$", "aufgaben": [] }
  ]
}
```

- [ ] **Step 6: Loader ergänzen** (`src/lib/data.ts`): Import `RechnenKapitel` zum Type-Import-Block hinzufügen, dann unter `ladeFormeln`:

```ts
export const ladeRechnen = () => lade<{ kapitel: RechnenKapitel[] }>('rechnen.json')
```

- [ ] **Step 7: Tests + tsc grün**: `node node_modules/vitest/vitest.mjs run tests/schema.test.ts` und `node node_modules/typescript/bin/tsc -b`

- [ ] **Step 8: Commit** — `git add -A && git commit -m "Rechnen-Kachel: Typen, Schema und Datengerüst"`

---

### Task 2: Zahlen-Parser und Eingabe-Bewertung (`src/lib/zahl.ts`)

**Files:**
- Create: `src/lib/zahl.ts`
- Test: `tests/zahl.test.ts`

**Interfaces:**
- Produces:
  - `parseDeutscheZahl(eingabe: string): number | null`
  - `formatiereZahl(wert: number, nachkomma?: number): string` (de-DE, default 2 Nachkommastellen)
  - `bewerteEingabe(eingabe: string, loesungswert: number, toleranz: number): 'leer' | 'ungueltig' | 'richtig' | 'knapp' | 'falsch'`

- [ ] **Step 1: Failing Tests schreiben** (`tests/zahl.test.ts`):

```ts
import { describe, expect, it } from 'vitest'
import { bewerteEingabe, formatiereZahl, parseDeutscheZahl } from '../src/lib/zahl'

describe('parseDeutscheZahl', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['1234,56', 1234.56],
    ['1234.56', 1234.56], // Fallback: Punkt als Dezimaltrenner (1-2 Nachkommastellen)
    ['1.234.500', 1234500], // reine Tausenderpunkte
    [' 420000 ', 420000],
    ['420.000,00 €', 420000], // Einheit wird ignoriert
    ['12,5 %', 12.5],
    ['-3,5', -3.5],
  ])('liest "%s" als %d', (eingabe, erwartet) => {
    expect(parseDeutscheZahl(eingabe)).toBe(erwartet)
  })

  it.each([[''], ['   '], ['abc'], ['1,2,3'], ['1..2']])('lehnt "%s" ab', (eingabe) => {
    expect(parseDeutscheZahl(eingabe)).toBeNull()
  })
})

describe('formatiereZahl', () => {
  it('formatiert de-DE mit 2 Nachkommastellen', () => {
    expect(formatiereZahl(1234.5)).toBe('1.234,50')
  })
  it('formatiert ohne Nachkommastellen auf Wunsch', () => {
    expect(formatiereZahl(420000, 0)).toBe('420.000')
  })
})

describe('bewerteEingabe', () => {
  it('leer → leer, Buchstaben → ungueltig', () => {
    expect(bewerteEingabe('', 100, 0)).toBe('leer')
    expect(bewerteEingabe('abc', 100, 0)).toBe('ungueltig')
  })
  it('innerhalb der Toleranz → richtig', () => {
    expect(bewerteEingabe('420.000,00', 420000, 0.01)).toBe('richtig')
    expect(bewerteEingabe('1,26', 1.25, 0.01)).toBe('richtig')
  })
  it('knapp daneben (≤ 10×Toleranz) → knapp', () => {
    expect(bewerteEingabe('1,30', 1.25, 0.01)).toBe('knapp')
  })
  it('Toleranz 0: knapp = innerhalb 1 % des Lösungswerts', () => {
    expect(bewerteEingabe('101', 100, 0)).toBe('knapp')
    expect(bewerteEingabe('100', 100, 0)).toBe('richtig')
  })
  it('weit daneben → falsch', () => {
    expect(bewerteEingabe('999', 100, 0.01)).toBe('falsch')
  })
})
```

- [ ] **Step 2: RED beobachten**: `node node_modules/vitest/vitest.mjs run tests/zahl.test.ts` → Fehler „Modul fehlt"

- [ ] **Step 3: Implementieren** (`src/lib/zahl.ts`):

```ts
// Deutsches Zahlenformat für die Rechnen-Kachel: Eingaben wie auf dem
// Prüfungsbogen ("1.234,56"), tolerant gegenüber Einheiten und Rohformat.

export function parseDeutscheZahl(eingabe: string): number | null {
  let t = eingabe.trim().replace(/[€%]|stück|kwh/gi, '').trim()
  if (t === '') return eingabe.trim() === '' ? null : null
  if (eingabe.trim() === '') return null
  const negativ = t.startsWith('-')
  if (negativ) t = t.slice(1)
  if (!/^[\d.,]+$/.test(t)) return null
  const punkte = (t.match(/\./g) ?? []).length
  const kommas = (t.match(/,/g) ?? []).length
  if (kommas > 1 || (punkte > 1 && kommas === 0 && !/^\d{1,3}(\.\d{3})+$/.test(t))) return null
  let normalisiert: string
  if (kommas === 1) {
    normalisiert = t.replace(/\./g, '').replace(',', '.') // 1.234,56 / 1234,56
  } else if (punkte === 1 && /\.\d{1,2}$/.test(t)) {
    normalisiert = t // Fallback: 1234.56
  } else {
    normalisiert = t.replace(/\./g, '') // reine Tausenderpunkte
  }
  const wert = Number(normalisiert)
  if (!Number.isFinite(wert)) return null
  return negativ ? -wert : wert
}

export function formatiereZahl(wert: number, nachkomma = 2): string {
  return wert.toLocaleString('de-DE', {
    minimumFractionDigits: nachkomma,
    maximumFractionDigits: nachkomma,
  })
}

export type EingabeWertung = 'leer' | 'ungueltig' | 'richtig' | 'knapp' | 'falsch'

export function bewerteEingabe(
  eingabe: string,
  loesungswert: number,
  toleranz: number,
): EingabeWertung {
  if (eingabe.trim() === '') return 'leer'
  const wert = parseDeutscheZahl(eingabe)
  if (wert === null) return 'ungueltig'
  const abstand = Math.abs(wert - loesungswert)
  if (abstand <= toleranz) return 'richtig'
  // "Knapp daneben": typischer Rundungsfehler in der letzten Stelle.
  const knappGrenze = toleranz > 0 ? toleranz * 10 : Math.abs(loesungswert) * 0.01
  if (abstand <= knappGrenze) return 'knapp'
  return 'falsch'
}
```

- [ ] **Step 4: GREEN**: `node node_modules/vitest/vitest.mjs run tests/zahl.test.ts` — alle Tests bestehen. Danach die doppelte Leer-Prüfung in `parseDeutscheZahl` auf EINE Zeile refaktorieren (`if (eingabe.trim() === '') return null` an den Anfang), Tests erneut laufen lassen.

- [ ] **Step 5: Commit** — `git commit -am "Rechnen-Kachel: Zahlen-Parser und Eingabe-Bewertung"`

---

### Task 3: Komponente `RechnenAufgabe.tsx`

**Files:**
- Create: `src/components/RechnenAufgabe.tsx`
- Test: `tests/rechnenAufgabe.test.tsx`

**Interfaces:**
- Consumes: `bewerteEingabe`, `formatiereZahl` aus `src/lib/zahl.ts`; Typ `GenerierteAufgabe`/`RechnenAufgabeFest` aus `src/types.ts`.
- Produces: `<RechnenAufgabe aufgabe={GenerierteAufgabe | RechnenAufgabeFest} onErgebnis={(richtig: boolean) => void} onWeiter={() => void} weiterText={string} quelleHinweis={string | undefined} />` — self-contained: Eingabe, Prüfen, Lösungsweg-Aufklappen. `onErgebnis` feuert genau einmal (beim ersten Prüfen mit gültiger Zahl), `onWeiter` beim Weiter-Knopf.

- [ ] **Step 1: Failing SSR-Tests** (`tests/rechnenAufgabe.test.tsx`) — Muster wie `tests/zuordnungFelder.test.tsx` (renderToString, `<!-- -->`-robuste Regexe):

```tsx
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import RechnenAufgabe from '../src/components/RechnenAufgabe'

const aufgabe = {
  text: 'Berechnen Sie den Umsatz bei 2.000,00 € und 3.500 Stück!',
  loesungswert: 7000000,
  einheit: '€',
  toleranz: 0.01,
  loesungsweg: 'Umsatz = Preis × Menge = 2.000,00 € × 3.500 = **7.000.000,00 €**',
}

describe('RechnenAufgabe', () => {
  it('zeigt Aufgabentext, Eingabefeld mit Einheit und Prüfen-Knopf', () => {
    const html = renderToString(
      <RechnenAufgabe aufgabe={aufgabe} onErgebnis={() => {}} onWeiter={() => {}} weiterText="Neue Aufgabe" />,
    )
    expect(html).toContain('Berechnen Sie den Umsatz')
    expect(html).toContain('<input')
    expect(html).toContain('Prüfen')
    expect(html).toContain('€')
    expect(html).not.toContain('7.000.000') // Lösung vor der Abgabe unsichtbar
  })

  it('zeigt den Quellen-Hinweis, wenn vorhanden', () => {
    const html = renderToString(
      <RechnenAufgabe aufgabe={aufgabe} onErgebnis={() => {}} onWeiter={() => {}} weiterText="Weiter" quelleHinweis="Aufgabensammlung 12, Aufgabe 13" />,
    )
    expect(html).toContain('Aufgabensammlung 12')
  })
})
```

- [ ] **Step 2: RED beobachten** (Modul fehlt), dann implementieren:

```tsx
import { useState } from 'react'
import { bewerteEingabe, type EingabeWertung } from '../lib/zahl'
import Markdown from './Markdown'

// Eine Rechenaufgabe mit Zahleneingabe: prüft mit Toleranz, klappt danach
// den Lösungsweg auf. onErgebnis feuert nur bei der ersten echten Abgabe —
// leere/unlesbare Eingaben erzeugen nur einen Hinweis.
export default function RechnenAufgabe({
  aufgabe,
  onErgebnis,
  onWeiter,
  weiterText,
  quelleHinweis,
}: {
  aufgabe: { text: string; loesungswert: number; einheit: string; toleranz: number; loesungsweg: string }
  onErgebnis: (richtig: boolean) => void
  onWeiter: () => void
  weiterText: string
  quelleHinweis?: string
}) {
  const [eingabe, setEingabe] = useState('')
  const [wertung, setWertung] = useState<EingabeWertung | null>(null)
  const abgegeben = wertung === 'richtig' || wertung === 'knapp' || wertung === 'falsch'

  function pruefen() {
    if (abgegeben) return
    const w = bewerteEingabe(eingabe, aufgabe.loesungswert, aufgabe.toleranz)
    setWertung(w)
    if (w === 'richtig' || w === 'knapp' || w === 'falsch') onErgebnis(w === 'richtig')
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      {quelleHinweis && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {quelleHinweis}
        </p>
      )}
      <Markdown text={aufgabe.text} />
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && pruefen()}
          disabled={abgegeben}
          placeholder="Ergebnis"
          aria-label="Ergebnis"
          className="h-12 w-40 rounded-lg border-2 border-slate-300 bg-white px-3 text-right text-lg font-bold focus:border-sky-500 focus:outline-none disabled:opacity-70"
        />
        <span className="font-semibold text-slate-600">{aufgabe.einheit}</span>
        {!abgegeben && (
          <button
            type="button"
            onClick={pruefen}
            className="ml-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white"
          >
            Prüfen
          </button>
        )}
      </div>
      {wertung === 'leer' && <p className="mt-2 text-sm text-amber-700">Bitte eine Zahl eingeben.</p>}
      {wertung === 'ungueltig' && (
        <p className="mt-2 text-sm text-amber-700">
          Das ist keine lesbare Zahl — Format z. B. „1.234,56".
        </p>
      )}
      {abgegeben && (
        <div className="mt-3">
          <p className={`font-semibold ${wertung === 'richtig' ? 'text-green-700' : 'text-red-700'}`}>
            {wertung === 'richtig' && '✔ Richtig!'}
            {wertung === 'knapp' && '✘ Knapp daneben — prüfe deine Rundung.'}
            {wertung === 'falsch' && '✘ Leider falsch.'}
          </p>
          <div className="mt-2 rounded-lg bg-slate-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Lösungsweg</p>
            <Markdown text={aufgabe.loesungsweg} />
          </div>
          <button
            type="button"
            onClick={onWeiter}
            className="mt-3 min-h-11 rounded-xl bg-slate-900 px-6 font-semibold text-white hover:bg-slate-800"
          >
            {weiterText} →
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: GREEN + tsc**: `node node_modules/vitest/vitest.mjs run tests/rechnenAufgabe.test.tsx && node node_modules/typescript/bin/tsc -b`

- [ ] **Step 4: Commit** — `git commit -am "Rechnen-Kachel: Eingabe-Komponente RechnenAufgabe"`

---

### Task 4: Grundlagen-Generatoren (Dreisatz, Prozent, Zinsen)

**Files:**
- Create: `src/lib/rechnen.ts`
- Test: `tests/rechnen.test.ts`

**Interfaces:**
- Consumes: `formatiereZahl` aus `src/lib/zahl.ts`, Typ `GenerierteAufgabe`.
- Produces: `export const GENERATOREN: Record<string, () => GenerierteAufgabe>` — Schlüssel = Kapitel-IDs. Nach diesem Task: `dreisatz`, `prozentrechnung`, `zinsrechnung`. Hilfsfunktionen `zufall`, `euro` (nur intern).

- [ ] **Step 1: Failing Property-Tests** (`tests/rechnen.test.ts`):

```ts
import { describe, expect, it } from 'vitest'
import { GENERATOREN } from '../src/lib/rechnen'
import { formatiereZahl } from '../src/lib/zahl'

// Jeder Generator wird oft gewürfelt: Werte müssen endlich, plausibel und
// mit dem eigenen Lösungsweg konsistent sein (Endwert steht im Text).
export function pruefeGenerator(id: string, minWert: number, maxWert: number) {
  describe(`Generator ${id}`, () => {
    it('liefert 200× plausible, konsistente Aufgaben', () => {
      const gen = GENERATOREN[id]
      expect(gen, `Generator fehlt: ${id}`).toBeDefined()
      for (let i = 0; i < 200; i++) {
        const a = gen()
        expect(Number.isFinite(a.loesungswert)).toBe(true)
        expect(a.loesungswert).toBeGreaterThanOrEqual(minWert)
        expect(a.loesungswert).toBeLessThanOrEqual(maxWert)
        expect(a.text.length).toBeGreaterThan(20)
        expect(a.toleranz).toBeGreaterThanOrEqual(0)
        expect(a.einheit.length).toBeGreaterThan(0)
        // Lösungsweg endet nachvollziehbar mit dem formatierten Endwert.
        expect(
          a.loesungsweg.includes(formatiereZahl(a.loesungswert)) ||
            a.loesungsweg.includes(formatiereZahl(a.loesungswert, 0)) ||
            a.loesungsweg.includes(formatiereZahl(a.loesungswert, 1)),
          `${id}: Endwert fehlt im Lösungsweg`,
        ).toBe(true)
      }
    })
  })
}

pruefeGenerator('dreisatz', 0.01, 1_000_000)
pruefeGenerator('prozentrechnung', 0.01, 1_000_000)
pruefeGenerator('zinsrechnung', 1, 1_000_000)
```

- [ ] **Step 2: RED beobachten** (Modul fehlt), dann implementieren (`src/lib/rechnen.ts`):

```ts
// Aufgaben-Generatoren der Rechnen-Kachel: jede Funktion würfelt "glatte",
// prüfungstypische Werte und baut den Lösungsweg aus denselben Zwischen-
// werten auf, mit denen auch das Ergebnis berechnet wird.
import type { GenerierteAufgabe } from '../types'
import { formatiereZahl } from './zahl'

function zufall(min: number, max: number, schritt = 1): number {
  const stufen = Math.floor((max - min) / schritt)
  return min + Math.floor(Math.random() * (stufen + 1)) * schritt
}

function wahl<T>(liste: T[]): T {
  return liste[Math.floor(Math.random() * liste.length)]
}

const euro = (n: number) => `${formatiereZahl(n)} €`

function dreisatz(): GenerierteAufgabe {
  const artikel = wahl(['Ordner', 'Druckerpatronen', 'Kopierpapier-Pakete', 'USB-Sticks'])
  const menge1 = zufall(4, 12)
  const stueckpreis = zufall(2, 15) / 2 // 1,00–7,50 in 50-Cent-Schritten
  const preis1 = Math.round(menge1 * stueckpreis * 100) / 100
  const menge2 = zufall(15, 60, 5)
  const loesung = Math.round(menge2 * stueckpreis * 100) / 100
  return {
    text: `${menge1} ${artikel} kosten zusammen ${euro(preis1)}. Berechnen Sie den Preis für ${menge2} ${artikel} (gleicher Stückpreis)!`,
    loesungswert: loesung,
    einheit: '€',
    toleranz: 0.01,
    loesungsweg: [
      `1 Stück: ${euro(preis1)} ÷ ${menge1} = ${euro(stueckpreis)}`,
      `${menge2} Stück: ${euro(stueckpreis)} × ${menge2} = **${euro(loesung)}**`,
    ].join('\n\n'),
  }
}

function prozentrechnung(): GenerierteAufgabe {
  const variante = wahl(['prozentwert', 'prozentsatz', 'vermehrt'] as const)
  if (variante === 'prozentwert') {
    const grundwert = zufall(20_000, 300_000, 10_000)
    const satz = zufall(2, 15)
    const loesung = (grundwert * satz) / 100
    return {
      text: `Das Budget beträgt ${euro(grundwert)}. Berechnen Sie ${satz} % davon in Euro!`,
      loesungswert: loesung, einheit: '€', toleranz: 0.01,
      loesungsweg: `${euro(grundwert)} × ${satz} ÷ 100 = **${euro(loesung)}**`,
    }
  }
  if (variante === 'prozentsatz') {
    const alt = zufall(100_000, 200_000, 10_000)
    const erhoehung = zufall(10_000, 50_000, 10_000)
    const loesung = Math.round((erhoehung / alt) * 10_000) / 100
    return {
      text: `Das Budget wird von ${euro(alt)} um ${euro(erhoehung)} erhöht. Um wie viel Prozent steigt es?`,
      loesungswert: loesung, einheit: '%', toleranz: 0.01,
      loesungsweg: `${euro(erhoehung)} ÷ ${euro(alt)} × 100 = **${formatiereZahl(loesung)} %**`,
    }
  }
  const netto = zufall(200, 2_000, 50)
  const brutto = Math.round(netto * 1.19 * 100) / 100
  return {
    text: `Ein Bürostuhl kostet netto ${euro(netto)}. Berechnen Sie den Bruttopreis (19 % USt)!`,
    loesungswert: brutto, einheit: '€', toleranz: 0.01,
    loesungsweg: `${euro(netto)} × 1,19 = **${euro(brutto)}**`,
  }
}

function zinsrechnung(): GenerierteAufgabe {
  const kapital = zufall(10_000, 200_000, 10_000)
  const satz = zufall(4, 24, 1) / 4 // 1,00–6,00 % in 0,25er-Schritten
  const variante = wahl(['jahr', 'monate', 'tage'] as const)
  const tage = variante === 'jahr' ? 360 : variante === 'monate' ? zufall(3, 9) * 30 : zufall(30, 330, 30)
  const zeitText =
    variante === 'jahr' ? 'für 1 Jahr' : variante === 'monate' ? `für ${tage / 30} Monate` : `für ${tage} Tage`
  const loesung = Math.round(((kapital * satz * tage) / (100 * 360)) * 100) / 100
  return {
    text: `Ein Betrag von ${euro(kapital)} wird ${zeitText} zu ${formatiereZahl(satz)} % p. a. angelegt. Berechnen Sie die Zinsen (kaufmännisch, 30/360)!`,
    loesungswert: loesung, einheit: '€', toleranz: 0.01,
    loesungsweg: `Z = K × p × t ÷ (100 × 360) = ${euro(kapital)} × ${formatiereZahl(satz)} × ${tage} ÷ 36.000 = **${euro(loesung)}**`,
  }
}

export const GENERATOREN: Record<string, () => GenerierteAufgabe> = {
  dreisatz,
  prozentrechnung,
  zinsrechnung,
}
```

- [ ] **Step 3: GREEN**: `node node_modules/vitest/vitest.mjs run tests/rechnen.test.ts`

- [ ] **Step 4: Commit** — `git commit -am "Rechnen-Kachel: Grundlagen-Generatoren"`

---

### Task 5: Prüfungs-Generatoren I (KG, Gleichgewichtspreis, Darlehen)

**Files:**
- Modify: `src/lib/rechnen.ts`
- Modify: `tests/rechnen.test.ts`

**Interfaces:**
- Produces: `GENERATOREN`-Einträge `kg-gewinnverteilung`, `gleichgewichtspreis-umsatz`, `darlehen`.

- [ ] **Step 1: Failing Tests** — in `tests/rechnen.test.ts` ergänzen:

```ts
pruefeGenerator('kg-gewinnverteilung', 1_000, 2_000_000)
pruefeGenerator('gleichgewichtspreis-umsatz', 1_000, 50_000_000)
pruefeGenerator('darlehen', 100, 5_000_000)
```

- [ ] **Step 2: RED beobachten**, dann in `src/lib/rechnen.ts` ergänzen (vor dem `GENERATOREN`-Export):

```ts
function kgGewinnverteilung(): GenerierteAufgabe {
  const komplementaerin = zufall(400_000, 900_000, 10_000)
  const kommanditist1 = zufall(200_000, 500_000, 10_000)
  const kommanditist2 = zufall(100_000, 400_000, 10_000)
  const summe = komplementaerin + kommanditist1 + kommanditist2
  const verzinsung = summe * 0.04
  const gewinn = zufall(Math.ceil((verzinsung + 100_000) / 10_000), 200, 1) * 10_000
  const rest = gewinn - verzinsung
  const frage = wahl(['rest', 'verzinsungK1'] as const)
  const tabelle = [
    `| Gesellschafter | Einlage |`, `| --- | --- |`,
    `| Komplementärin | ${euro(komplementaerin)} |`,
    `| Kommanditist 1 | ${euro(kommanditist1)} |`,
    `| Kommanditist 2 | ${euro(kommanditist2)} |`,
  ].join('\n')
  if (frage === 'verzinsungK1') {
    const loesung = kommanditist1 * 0.04
    return {
      text: `Eine KG erwirtschaftet ${euro(gewinn)} Gewinn. Laut Vertrag erhält jeder Gesellschafter zunächst 4 % auf seine Einlage.\n\n${tabelle}\n\nBerechnen Sie die Kapitalverzinsung für Kommanditist 1 in Euro!`,
      loesungswert: loesung, einheit: '€', toleranz: 0.01,
      loesungsweg: `${euro(kommanditist1)} × 4 ÷ 100 = **${euro(loesung)}**`,
    }
  }
  return {
    text: `Eine KG erwirtschaftet ${euro(gewinn)} Gewinn. Laut Vertrag erhält jeder Gesellschafter zunächst 4 % auf seine Einlage; der Rest wird nach Vertrag verteilt.\n\n${tabelle}\n\nBerechnen Sie den verbleibenden Restgewinn in Euro!`,
    loesungswert: rest, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Einlagen gesamt: ${euro(summe)}`,
      `4 % Verzinsung: ${euro(summe)} × 0,04 = ${euro(verzinsung)}`,
      `Restgewinn: ${euro(gewinn)} − ${euro(verzinsung)} = **${euro(rest)}**`,
    ].join('\n\n'),
  }
}

function gleichgewichtspreisUmsatz(): GenerierteAufgabe {
  const preise = [1_200, 1_400, 1_600, 1_800, 2_000]
  const ggIndex = zufall(1, 3)
  const menge = zufall(2_000, 5_000, 500)
  // Nachfrage fällt, Angebot steigt — am GG-Index sind beide gleich.
  const nachfrage = preise.map((_, i) => menge + (ggIndex - i) * zufall(400, 800, 100))
  const angebot = preise.map((_, i) => menge - (ggIndex - i) * zufall(400, 800, 100))
  nachfrage[ggIndex] = menge
  angebot[ggIndex] = menge
  const ggPreis = preise[ggIndex]
  const umsatz = ggPreis * menge
  const zeilen = preise.map((p, i) => `| ${euro(p)} | ${formatiereZahl(nachfrage[i], 0)} | ${formatiereZahl(angebot[i], 0)} |`)
  return {
    text: `Für einen Bürostuhl liegen Marktforschungszahlen vor:\n\n| Preis | Nachfrage (Stück) | Angebot (Stück) |\n| --- | --- | --- |\n${zeilen.join('\n')}\n\nBerechnen Sie den Umsatz in Euro, der beim Gleichgewichtspreis erzielt wird!`,
    loesungswert: umsatz, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Gleichgewichtspreis: Nachfrage = Angebot bei ${euro(ggPreis)} (${formatiereZahl(menge, 0)} Stück).`,
      `Umsatz = Preis × Menge = ${euro(ggPreis)} × ${formatiereZahl(menge, 0)} = **${euro(umsatz)}**`,
    ].join('\n\n'),
  }
}

function darlehen(): GenerierteAufgabe {
  const betrag = zufall(200_000, 2_000_000, 100_000)
  const satz = zufall(8, 24, 1) / 4 // 2,00–6,00 %
  const jahre = zufall(4, 10)
  const variante = wahl(['faelligkeit', 'tilgung'] as const)
  if (variante === 'faelligkeit') {
    const zinsenGesamt = Math.round(betrag * (satz / 100) * jahre * 100) / 100
    return {
      text: `Ein Fälligkeitsdarlehen über ${euro(betrag)} läuft ${jahre} Jahre bei ${formatiereZahl(satz)} % p. a. (Tilgung komplett am Ende). Berechnen Sie die gesamten Zinszahlungen über die Laufzeit!`,
      loesungswert: zinsenGesamt, einheit: '€', toleranz: 0.01,
      loesungsweg: [
        `Zinsen pro Jahr: ${euro(betrag)} × ${formatiereZahl(satz)} ÷ 100 = ${euro((betrag * satz) / 100)}`,
        `Gesamt: × ${jahre} Jahre = **${euro(zinsenGesamt)}**`,
      ].join('\n\n'),
    }
  }
  const tilgung = betrag / jahre
  const jahrN = zufall(2, jahre)
  const restschuld = betrag - tilgung * (jahrN - 1)
  const zinsenJahrN = Math.round(restschuld * (satz / 100) * 100) / 100
  return {
    text: `Ein Tilgungsdarlehen über ${euro(betrag)} wird in ${jahre} gleichen Jahresraten getilgt (Zinssatz ${formatiereZahl(satz)} % p. a. auf die Restschuld). Berechnen Sie die Zinsen im ${jahrN}. Jahr!`,
    loesungswert: zinsenJahrN, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Jährliche Tilgung: ${euro(betrag)} ÷ ${jahre} = ${euro(tilgung)}`,
      `Restschuld zu Beginn von Jahr ${jahrN}: ${euro(betrag)} − ${jahrN - 1} × ${euro(tilgung)} = ${euro(restschuld)}`,
      `Zinsen: ${euro(restschuld)} × ${formatiereZahl(satz)} ÷ 100 = **${euro(zinsenJahrN)}**`,
    ].join('\n\n'),
  }
}
```

Und im Export ergänzen:

```ts
export const GENERATOREN: Record<string, () => GenerierteAufgabe> = {
  dreisatz,
  prozentrechnung,
  zinsrechnung,
  'kg-gewinnverteilung': kgGewinnverteilung,
  'gleichgewichtspreis-umsatz': gleichgewichtspreisUmsatz,
  darlehen,
}
```

- [ ] **Step 3: GREEN**: `node node_modules/vitest/vitest.mjs run tests/rechnen.test.ts`

- [ ] **Step 4: Commit** — `git commit -am "Rechnen-Kachel: Prüfungs-Generatoren KG, Markt, Darlehen"`

---

### Task 6: Prüfungs-Generatoren II (Leasing, Wirtschaftlichkeit, Konjunktur, Energie)

**Files:**
- Modify: `src/lib/rechnen.ts`
- Modify: `tests/rechnen.test.ts`

**Interfaces:**
- Produces: `GENERATOREN`-Einträge `leasing`, `wirtschaftlichkeit-produktivitaet`, `konjunktur-indikatoren`, `energie-betriebskosten`. Danach ist `GENERATOREN` vollständig (10 Schlüssel = 10 Kapitel-IDs).

- [ ] **Step 1: Failing Tests** — ergänzen:

```ts
pruefeGenerator('leasing', 1_000, 500_000)
pruefeGenerator('wirtschaftlichkeit-produktivitaet', 0.1, 100_000)
pruefeGenerator('konjunktur-indikatoren', 0.1, 100)
pruefeGenerator('energie-betriebskosten', 1, 500_000)

it('GENERATOREN deckt exakt die 10 Kapitel-IDs ab', () => {
  expect(Object.keys(GENERATOREN).sort()).toEqual([
    'darlehen', 'dreisatz', 'energie-betriebskosten', 'gleichgewichtspreis-umsatz',
    'kg-gewinnverteilung', 'konjunktur-indikatoren', 'leasing', 'prozentrechnung',
    'wirtschaftlichkeit-produktivitaet', 'zinsrechnung',
  ])
})
```

- [ ] **Step 2: RED beobachten**, dann implementieren:

```ts
function leasing(): GenerierteAufgabe {
  const sonderzahlung = zufall(5_000, 20_000, 1_000)
  const rate = zufall(800, 3_000, 100)
  const monate = wahl([24, 36, 48])
  const mitRestwert = Math.random() < 0.5
  const restwert = mitRestwert ? zufall(5_000, 30_000, 1_000) : 0
  const gesamt = sonderzahlung + rate * monate + restwert
  return {
    text: `Für einen Firmenwagen gilt: Leasing-Sonderzahlung ${euro(sonderzahlung)}, monatliche Rate ${euro(rate)}, Laufzeit ${monate} Monate${mitRestwert ? `, Übernahme zum Restwert von ${euro(restwert)} am Ende` : ''}. Berechnen Sie die Leasing-Gesamtkosten!`,
    loesungswert: gesamt, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Raten: ${euro(rate)} × ${monate} = ${euro(rate * monate)}`,
      `Gesamt: ${euro(sonderzahlung)} + ${euro(rate * monate)}${mitRestwert ? ` + ${euro(restwert)}` : ''} = **${euro(gesamt)}**`,
    ].join('\n\n'),
  }
}

function wirtschaftlichkeitProduktivitaet(): GenerierteAufgabe {
  if (Math.random() < 0.5) {
    const aufwand = zufall(80_000, 400_000, 20_000)
    const faktor = zufall(105, 140, 5) / 100
    const ertrag = Math.round(aufwand * faktor)
    const loesung = Math.round((ertrag / aufwand) * 100) / 100
    return {
      text: `Ein Unternehmen erzielt einen Ertrag von ${euro(ertrag)} bei einem Aufwand von ${euro(aufwand)}. Berechnen Sie die Wirtschaftlichkeit (2 Nachkommastellen)!`,
      loesungswert: loesung, einheit: '', toleranz: 0.01,
      loesungsweg: `Wirtschaftlichkeit = Ertrag ÷ Aufwand = ${euro(ertrag)} ÷ ${euro(aufwand)} = **${formatiereZahl(loesung)}** (> 1 → wirtschaftlich)`,
    }
  }
  const stunden = zufall(400, 2_000, 100)
  const proStunde = zufall(4, 20)
  const output = stunden * proStunde
  return {
    text: `In einem Monat werden ${formatiereZahl(output, 0)} Ordner in ${formatiereZahl(stunden, 0)} Arbeitsstunden gefertigt. Berechnen Sie die Arbeitsproduktivität (Stück je Stunde)!`,
    loesungswert: proStunde, einheit: 'Stück', toleranz: 0.01,
    loesungsweg: `Produktivität = Output ÷ Input = ${formatiereZahl(output, 0)} ÷ ${formatiereZahl(stunden, 0)} = **${formatiereZahl(proStunde, 0)} Stück/Stunde**`,
  }
}

function konjunkturIndikatoren(): GenerierteAufgabe {
  if (Math.random() < 0.5) {
    const alt = zufall(1000, 1200, 5) / 10 // VPI 100,0–120,0
    const punkte = zufall(15, 60, 5) / 10
    const neu = Math.round((alt + punkte) * 10) / 10
    const loesung = Math.round(((neu - alt) / alt) * 1000) / 10
    return {
      text: `Der Verbraucherpreisindex steigt von ${formatiereZahl(alt, 1)} auf ${formatiereZahl(neu, 1)} Punkte. Berechnen Sie die Inflationsrate in Prozent (1 Nachkommastelle)!`,
      loesungswert: loesung, einheit: '%', toleranz: 0.05,
      loesungsweg: `(${formatiereZahl(neu, 1)} − ${formatiereZahl(alt, 1)}) ÷ ${formatiereZahl(alt, 1)} × 100 = **${formatiereZahl(loesung, 1)} %**`,
    }
  }
  const erwerbspersonen = zufall(40_000, 46_000, 500) // in Tsd.
  const quote = zufall(40, 90, 5) / 10 // 4,0–9,0 %
  const arbeitslose = Math.round(erwerbspersonen * (quote / 100))
  const loesung = Math.round((arbeitslose / erwerbspersonen) * 1000) / 10
  return {
    text: `In einem Land sind ${formatiereZahl(arbeitslose, 0)} Tsd. Personen arbeitslos bei ${formatiereZahl(erwerbspersonen, 0)} Tsd. zivilen Erwerbspersonen. Berechnen Sie die Arbeitslosenquote in Prozent (1 Nachkommastelle)!`,
    loesungswert: loesung, einheit: '%', toleranz: 0.05,
    loesungsweg: `${formatiereZahl(arbeitslose, 0)} ÷ ${formatiereZahl(erwerbspersonen, 0)} × 100 = **${formatiereZahl(loesung, 1)} %**`,
  }
}

function energieBetriebskosten(): GenerierteAufgabe {
  const leistung = zufall(20, 90, 2) // kW
  const stunden = zufall(1_000, 4_000, 250)
  const centProKwh = zufall(22, 38, 2)
  const kosten = Math.round(leistung * stunden * centProKwh) / 100
  return {
    text: `Die Beleuchtungsanlage hat eine Leistung von ${leistung} kW und läuft ${formatiereZahl(stunden, 0)} Stunden im Jahr. Der Strompreis beträgt ${formatiereZahl(centProKwh / 100)} € je kWh. Berechnen Sie die jährlichen Stromkosten!`,
    loesungswert: kosten, einheit: '€', toleranz: 0.01,
    loesungsweg: [
      `Verbrauch: ${leistung} kW × ${formatiereZahl(stunden, 0)} h = ${formatiereZahl(leistung * stunden, 0)} kWh`,
      `Kosten: ${formatiereZahl(leistung * stunden, 0)} kWh × ${formatiereZahl(centProKwh / 100)} € = **${euro(kosten)}**`,
    ].join('\n\n'),
  }
}
```

Export um die vier Einträge ergänzen (`leasing`, `'wirtschaftlichkeit-produktivitaet': wirtschaftlichkeitProduktivitaet`, `'konjunktur-indikatoren': konjunkturIndikatoren`, `'energie-betriebskosten': energieBetriebskosten`).

- [ ] **Step 3: GREEN**: `node node_modules/vitest/vitest.mjs run tests/rechnen.test.ts`

- [ ] **Step 4: Commit** — `git commit -am "Rechnen-Kachel: restliche Prüfungs-Generatoren"`

---

### Task 7: Fortschritt (`src/lib/rechnenFortschritt.ts`)

**Files:**
- Create: `src/lib/rechnenFortschritt.ts`
- Test: `tests/rechnenFortschritt.test.ts`

**Interfaces:**
- Consumes: `getItem`, `setItem` aus `src/lib/storage.ts` (voll qualifizierte Keys; setItem benachrichtigt den Server-Sync automatisch).
- Produces:
  - `interface KapitelStand { richtig: number; falsch: number; geloest: string[] }`
  - `interface RechnenStand { kapitel: Record<string, KapitelStand> }`
  - `ladeRechnenStand(): RechnenStand`
  - `merkeRechnenUebung(kapitelId: string, richtig: boolean): void` (Generator-Übungen)
  - `merkeRechnenAufgabe(kapitelId: string, aufgabeId: string, richtig: boolean): void` (feste Aufgaben; zählt richtig/falsch UND trägt bei richtig die ID idempotent in `geloest` ein)

- [ ] **Step 1: Failing Tests** (`tests/rechnenFortschritt.test.ts`) — localStorage existiert im Vitest-Node-Umfeld nicht automatisch; dasselbe Muster wie `tests/storage.test.ts` verwenden (dort nachsehen: dort wird localStorage gemockt/gepolyfillt — exakt das Setup kopieren):

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { ladeRechnenStand, merkeRechnenAufgabe, merkeRechnenUebung } from '../src/lib/rechnenFortschritt'

beforeEach(() => localStorage.clear())

describe('Rechnen-Fortschritt', () => {
  it('startet leer', () => {
    expect(ladeRechnenStand()).toEqual({ kapitel: {} })
  })

  it('zählt Generator-Übungen je Kapitel', () => {
    merkeRechnenUebung('dreisatz', true)
    merkeRechnenUebung('dreisatz', false)
    merkeRechnenUebung('dreisatz', true)
    expect(ladeRechnenStand().kapitel['dreisatz']).toEqual({ richtig: 2, falsch: 1, geloest: [] })
  })

  it('merkt gelöste feste Aufgaben idempotent', () => {
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-01', true)
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-01', true)
    merkeRechnenAufgabe('darlehen', 'rechnen-darlehen-02', false)
    const stand = ladeRechnenStand().kapitel['darlehen']
    expect(stand.geloest).toEqual(['rechnen-darlehen-01'])
    expect(stand.richtig).toBe(2)
    expect(stand.falsch).toBe(1)
  })
})
```

- [ ] **Step 2: RED beobachten**, dann implementieren:

```ts
// Fortschritt der Rechnen-Kachel: kbm.v1.* wird vom Server-Sync automatisch
// mitgenommen — hier nur lokale Zähler je Kapitel.
import { getItem, setItem } from './storage'

const KEY = 'kbm.v1.rechnen'

export interface KapitelStand {
  richtig: number
  falsch: number
  geloest: string[] // IDs fester Aufgaben, die mindestens einmal richtig waren
}

export interface RechnenStand {
  kapitel: Record<string, KapitelStand>
}

export function ladeRechnenStand(): RechnenStand {
  return getItem<RechnenStand>(KEY) ?? { kapitel: {} }
}

function schreibe(kapitelId: string, aendern: (k: KapitelStand) => void): void {
  const stand = ladeRechnenStand()
  const kapitel = stand.kapitel[kapitelId] ?? { richtig: 0, falsch: 0, geloest: [] }
  aendern(kapitel)
  setItem(KEY, { ...stand, kapitel: { ...stand.kapitel, [kapitelId]: kapitel } })
}

export function merkeRechnenUebung(kapitelId: string, richtig: boolean): void {
  schreibe(kapitelId, (k) => {
    if (richtig) k.richtig++
    else k.falsch++
  })
}

export function merkeRechnenAufgabe(kapitelId: string, aufgabeId: string, richtig: boolean): void {
  schreibe(kapitelId, (k) => {
    if (richtig) {
      k.richtig++
      if (!k.geloest.includes(aufgabeId)) k.geloest.push(aufgabeId)
    } else {
      k.falsch++
    }
  })
}
```

- [ ] **Step 3: GREEN + tsc**, **Step 4: Commit** — `git commit -am "Rechnen-Kachel: Fortschritts-Speicher"`

---

### Task 8: Seiten, Routen, Home-Kachel

**Files:**
- Create: `src/pages/Rechnen.tsx` (Kapitelübersicht)
- Create: `src/pages/RechnenKapitel.tsx` (Tabs Erklärung/Üben/Prüfungsaufgaben)
- Modify: `src/App.tsx` (Routen), `src/pages/Home.tsx` (Kachel), `src/lib/farben.ts` (Farbe `rose`)

**Interfaces:**
- Consumes: `ladeRechnen`+`useDaten` (data.ts), `GENERATOREN` (rechnen.ts), `RechnenAufgabe` (Task 3), `ladeRechnenStand`/`merkeRechnenUebung`/`merkeRechnenAufgabe` (Task 7), `farbe` aus farben.ts.
- Produces: Routen `#/rechnen` und `#/rechnen/:kapitelId`.

- [ ] **Step 1: Farbe `rose`** in `src/lib/farben.ts` zum `FARBEN`-Record ergänzen (Muster der bestehenden Einträge):

```ts
  rose: {
    kachel: 'border-rose-200 bg-rose-50 hover:border-rose-400',
    balken: 'bg-rose-500',
    akzentText: 'text-rose-700',
    chip: 'bg-rose-100 text-rose-800',
    button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
  },
```

- [ ] **Step 2: Routen** in `src/App.tsx` — Imports + DIREKT bei den anderen festen Routen (VOR dem Catch-all `/:bereichId`, sonst greift der Bereichs-Router!):

```tsx
<Route path="/rechnen" element={<Rechnen />} />
<Route path="/rechnen/:kapitelId" element={<RechnenKapitel />} />
```

- [ ] **Step 3: Home-Kachel** in `src/pages/Home.tsx` — beim bestehenden Glossar-Link das `sm:col-span-2` ENTFERNEN und direkt danach einfügen:

```tsx
<Link
  to="/rechnen"
  className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-rose-300 bg-white p-5 shadow-sm transition hover:border-rose-400 hover:shadow-md"
>
  <span className="text-3xl">🧮</span>
  <span>
    <span className="block font-bold text-slate-900">Kaufmännisches Rechnen</span>
    <span className="block text-sm text-slate-600">
      Alle Rechenarten der WiSo-Prüfung üben — mit unbegrenzten Übungsaufgaben und Lösungsweg.
    </span>
  </span>
</Link>
```

- [ ] **Step 4: `src/pages/Rechnen.tsx`**:

```tsx
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeRechnen, useDaten } from '../lib/data'
import { ladeRechnenStand } from '../lib/rechnenFortschritt'
import type { RechnenKapitel } from '../types'

const GRUPPEN: { id: RechnenKapitel['gruppe']; titel: string }[] = [
  { id: 'grundlagen', titel: 'Grundlagen' },
  { id: 'pruefung', titel: 'Prüfungstypen WiSo' },
]

export default function Rechnen() {
  const { daten, fehler, laedt } = useDaten(ladeRechnen)
  const stand = ladeRechnenStand()

  if (laedt) return <Layout titel="Kaufmännisches Rechnen"><p className="text-slate-500">Lade …</p></Layout>
  if (fehler || !daten)
    return <Layout titel="Kaufmännisches Rechnen"><p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p></Layout>

  return (
    <Layout titel="Kaufmännisches Rechnen">
      <p className="-mt-2 mb-4 text-sm text-slate-600">
        Kurz erklärt, dann rechnen: unbegrenzt Übungsaufgaben mit Lösungsweg — plus die
        Original-Rechenaufgaben aus den Aufgabensammlungen.
      </p>
      {GRUPPEN.map((g) => (
        <section key={g.id} className="mb-6">
          <h2 className="mb-3 font-bold text-slate-900">{g.titel}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {daten.kapitel.filter((k) => k.gruppe === g.id).map((k) => {
              const s = stand.kapitel[k.id]
              const versuche = (s?.richtig ?? 0) + (s?.falsch ?? 0)
              return (
                <Link
                  key={k.id}
                  to={`/rechnen/${k.id}`}
                  className="block rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 shadow-sm transition hover:border-rose-400"
                >
                  <h3 className="font-bold text-slate-900">{k.titel}</h3>
                  <p className="mt-1 text-sm text-slate-600">{k.kurz}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {versuche > 0
                      ? `${s!.richtig} von ${versuche} richtig`
                      : 'Noch nicht geübt'}
                    {k.aufgaben.length > 0 &&
                      ` · Prüfungsaufgaben: ${s?.geloest.length ?? 0} von ${k.aufgaben.length} gelöst`}
                  </p>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </Layout>
  )
}
```

- [ ] **Step 5: `src/pages/RechnenKapitel.tsx`**:

```tsx
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import RechnenAufgabe from '../components/RechnenAufgabe'
import { ladeRechnen, useDaten } from '../lib/data'
import { GENERATOREN } from '../lib/rechnen'
import { merkeRechnenAufgabe, merkeRechnenUebung } from '../lib/rechnenFortschritt'

type Tab = 'erklaerung' | 'ueben' | 'pruefung'

export default function RechnenKapitel() {
  const { kapitelId } = useParams<{ kapitelId: string }>()
  const { daten, fehler, laedt } = useDaten(ladeRechnen)
  const [tab, setTab] = useState<Tab>('erklaerung')
  const [runde, setRunde] = useState(0) // erzwingt neue Generator-Aufgabe
  const [festIndex, setFestIndex] = useState(0)

  const kapitel = daten?.kapitel.find((k) => k.id === kapitelId)
  const generator = kapitelId ? GENERATOREN[kapitelId] : undefined
  // Eine Aufgabe pro Runde einfrieren — sonst würfelt jeder Re-Render neu.
  const uebung = useMemo(() => generator?.(), [generator, runde])

  if (laedt) return <Layout titel="Kaufmännisches Rechnen"><p className="text-slate-500">Lade …</p></Layout>
  if (fehler || !kapitel || !generator)
    return (
      <Layout titel="Kaufmännisches Rechnen">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">Kapitel nicht gefunden.</p>
        <Link to="/rechnen" className="mt-2 inline-block text-sm font-medium text-sky-700">← Zur Übersicht</Link>
      </Layout>
    )

  const tabs: { id: Tab; titel: string }[] = [
    { id: 'erklaerung', titel: 'Erklärung' },
    { id: 'ueben', titel: 'Üben' },
    ...(kapitel.aufgaben.length > 0 ? [{ id: 'pruefung' as Tab, titel: `Prüfungsaufgaben (${kapitel.aufgaben.length})` }] : []),
  ]
  const fest = kapitel.aufgaben[festIndex]

  return (
    <Layout titel={kapitel.titel}>
      <Link to="/rechnen" className="-mt-2 mb-3 inline-block text-sm font-medium text-sky-700">
        ← Alle Rechenarten
      </Link>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.id ? 'bg-rose-600 text-white' : 'bg-white text-slate-700 border border-slate-300'
            }`}
          >
            {t.titel}
          </button>
        ))}
      </div>

      {tab === 'erklaerung' && (
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <Markdown text={kapitel.erklaerung} />
          <button
            type="button"
            onClick={() => setTab('ueben')}
            className="mt-4 rounded-lg bg-rose-600 px-4 py-2.5 font-semibold text-white"
          >
            Jetzt üben →
          </button>
        </div>
      )}

      {tab === 'ueben' && uebung && (
        <RechnenAufgabe
          key={runde}
          aufgabe={uebung}
          onErgebnis={(richtig) => merkeRechnenUebung(kapitel.id, richtig)}
          onWeiter={() => setRunde((r) => r + 1)}
          weiterText="Neue Aufgabe"
        />
      )}

      {tab === 'pruefung' && fest && (
        <div>
          <p className="mb-2 text-sm text-slate-600">
            Aufgabe {festIndex + 1} von {kapitel.aufgaben.length}
          </p>
          <RechnenAufgabe
            key={fest.id}
            aufgabe={fest}
            onErgebnis={(richtig) => merkeRechnenAufgabe(kapitel.id, fest.id, richtig)}
            onWeiter={() => setFestIndex((i) => (i + 1) % kapitel.aufgaben.length)}
            weiterText={festIndex + 1 < kapitel.aufgaben.length ? 'Nächste Aufgabe' : 'Von vorn'}
            quelleHinweis={
              fest.quelle ? `Aufgabensammlung ${fest.quelle.sammlung}, Aufgabe ${fest.quelle.aufgabe}` : undefined
            }
          />
        </div>
      )}
    </Layout>
  )
}
```

- [ ] **Step 6: Verifizieren** — `node node_modules/typescript/bin/tsc -b` (Exit 0) und `node node_modules/vitest/vitest.mjs run` (alle grün). Danach `npm run build` (muss durchlaufen) und mit `npm run preview` + Browser `#/rechnen` manuell prüfen: Kachel auf Home, Übersicht, ein Kapitel üben (richtige/falsche/knappe/leere Eingabe), Lösungsweg mit KaTeX/Tabellen.

- [ ] **Step 7: Commit** — `git commit -am "Rechnen-Kachel: Seiten, Routen und Home-Kachel"`

---

### Task 9: Original-Prüfungsaufgaben einpflegen

**Files:**
- Create: `content-pipeline/staging/rechnen-aufgaben.json`
- Create: `content-pipeline/merge-rechnen.mjs`
- Modify: `public/data/rechnen.json` (durch das Merge-Skript)
- Modify: `content-pipeline/audit-report.md` (Befunde anhängen)

**Interfaces:**
- Consumes: Format `RechnenAufgabeFest` aus Task 1; `SAMMLUNGEN`-Map in `src/lib/termine.ts` (Termin → anonyme Sammlungsnummer).
- Produces: gefüllte `aufgaben`-Arrays in `public/data/rechnen.json`.

- [ ] **Step 1: Merge-Skript** (`content-pipeline/merge-rechnen.mjs`) — Muster von `merge-zuordnung.mjs`:

```js
// Merged Rechnen-Aufgaben (content-pipeline/staging/rechnen-aufgaben.json)
// in die Kapitel von public/data/rechnen.json.
// Staging-Format: { "eintraege": [ { "kapitelId": "...", "aufgabe": { RechnenAufgabeFest } } ] }
// Aufruf: node content-pipeline/merge-rechnen.mjs
import fs from 'node:fs'

const staging = 'content-pipeline/staging/rechnen-aufgaben.json'
const ziel = 'public/data/rechnen.json'

const s = JSON.parse(fs.readFileSync(staging, 'utf8'))
const daten = JSON.parse(fs.readFileSync(ziel, 'utf8'))
let n = 0
for (const e of s.eintraege) {
  const kapitel = daten.kapitel.find((k) => k.id === e.kapitelId)
  if (!kapitel) {
    console.error(`Unbekanntes Kapitel: ${e.kapitelId} (${e.aufgabe.id}) — übersprungen`)
    continue
  }
  const idx = kapitel.aufgaben.findIndex((a) => a.id === e.aufgabe.id)
  if (idx >= 0) kapitel.aufgaben[idx] = e.aufgabe
  else kapitel.aufgaben.push(e.aufgabe)
  n++
}
fs.writeFileSync(ziel, JSON.stringify(daten, null, 2) + '\n')
console.log(`Fertig: ${n} Rechnen-Aufgaben eingepflegt.`)
```

- [ ] **Step 2: Staging-Datei erstellen** — Quelle: `public/data/aufgaben/wiso.json`. Kandidaten sind diese 36 IDs (Rechen-Analyse vom 2026-09-08):
`wiso-2025s-a6, wiso-2025s-a10, wiso-2025s-a13, wiso-produktionsfaktoren-unternehmensziele-g2, wiso-rechtsformen-vollmachten-g1, wiso-finanzierung-kreditsicherung-v1, wiso-markt-preisbildung-g2, wiso-markt-preisbildung-v2, wiso-2024s-a26, wiso-2022s-a2, wiso-2022s-a18, wiso-2022w-a1, wiso-2022w-a2, wiso-2022w-a3, wiso-2022w-a15, wiso-2023s-a14, wiso-2023s-a15, wiso-2023w-a19, wiso-2024w-a8, wiso-2024w-a9, wiso-2019s-a19, wiso-2019s-a20, wiso-2020s-a5, wiso-2020w-a8, wiso-2020w-a12, wiso-2020w-a15, wiso-2021w-a10, wiso-2021w-a14, wiso-2021w-a15, wiso-2017w-a18, wiso-2018s-a10, wiso-2018s-a12, wiso-2018s-a15, wiso-2018s-a16, wiso-2018w-a10, wiso-2018w-a28`

Übernahmeregeln (Spec):
1. Nur Aufgaben mit eindeutigem Zahlenergebnis (reine Wissensfragen wie `wiso-rechtsformen-vollmachten-g1` — Mindeststammkapital — AUSLASSEN und im audit-report dokumentieren).
2. Neue IDs: `rechnen-<kapitelId-kurz>-NN` (z. B. `rechnen-kg-01`); Original bleibt unverändert in aufgaben/wiso.json.
3. `text`: Aufgabentext übernehmen; nötige Werte aus `anlagenText` oder MC-Optionen in den Text integrieren; Markttabellen als GFM-Tabelle einbetten. Reine Schaubild-Ablese-Aufgaben ohne tabellarische Daten (`wiso-2022s-a18`, `wiso-2017w-a18`, `wiso-2022w-a15`, `wiso-2018w-a10`, `wiso-2023w-a19` — prüfen, ob Werte im Text stehen!) auslassen und dokumentieren.
4. `loesungswert`/`einheit`/`toleranz`: aus `loesung` ableiten. Euro-Beträge: toleranz 0.01; Prozentwerte mit 1 Nachkommastelle: 0.05; Kennzahlen (Wirtschaftlichkeit): 0.01.
5. `loesungsweg`: aus `loesung`+`erklaerung` als nachvollziehbare Schritte formulieren (KEINE Positions-/Optionsbezüge).
6. `quelle`: `{ sammlung, aufgabe }` — Sammlungsnummer über die `SAMMLUNGEN`-Map in `src/lib/termine.ts` aus dem `termin`-Feld ermitteln; `aufgabe` = Original-Nummer aus dem Text (`zerlegeAufgabenText`-Muster: „Aufgabe N") oder der ID. Abgeleitete/generierte Aufgaben (`-g2`, `-v1`, `-v2`-Suffixe) bekommen KEIN quelle-Feld.
7. Kapitel-Zuordnung nach themaId/Inhalt: rechtsformen → `kg-gewinnverteilung`; markt-preisbildung → `gleichgewichtspreis-umsatz`; finanzierung → `darlehen` oder `leasing` (nach Inhalt); produktionsfaktoren-Wirtschaftlichkeit → `wirtschaftlichkeit-produktivitaet`; konjunktur → `konjunktur-indikatoren`; arbeitsschutz-Strom (`wiso-2024s-a26`) → `energie-betriebskosten`; Budget-Prozent (`wiso-2022s-a2`) → `prozentrechnung`.
8. Jede Aufgabe einzeln gegen `loesung` verifizieren (loesungswert MUSS der Musterlösung entsprechen).

- [ ] **Step 3: Merge + Audit**: `node content-pipeline/merge-rechnen.mjs`, dann `node node_modules/vitest/vitest.mjs run tests/schema.test.ts` (rechnen.json-Audit grün). Ausgelassene IDs mit Begründung in `content-pipeline/audit-report.md` unter „## Rechnen-Kachel (Datum)" dokumentieren.

- [ ] **Step 4: Stichprobe im Browser** — `npm run preview`, 3 Kapitel mit Prüfungsaufgaben durchklicken (Tabellen rendern? Quelle-Hinweis korrekt anonymisiert?).

- [ ] **Step 5: Commit** — `git add -A && git commit -m "Rechnen-Kachel: Original-Prüfungsaufgaben eingepflegt"`

---

### Task 10: Erklärungen ausbauen

**Files:**
- Modify: `public/data/rechnen.json` (erklaerung-Felder)

**Interfaces:** — (reine Content-Änderung, Schema aus Task 1 bewacht)

- [ ] **Step 1:** Jede `erklaerung` zu einer vollen Kurzerklärung ausbauen: `## Titel` + 2-4 Sätze Konzept + Formel(n) als KaTeX-Display + **durchgerechnetes Mini-Beispiel**. Muster (dreisatz, so übernehmen):

```markdown
## Dreisatz

Der Dreisatz löst fast jede Verhältnisaufgabe in drei Schritten: erst auf **eine Einheit**
zurückrechnen, dann auf die gesuchte Menge hochrechnen. Bei gerader Zuordnung gilt
„je mehr, desto mehr" (Menge ↔ Preis), bei ungerader „je mehr, desto weniger"
(Arbeiter ↔ Tage).

$$x = \frac{\text{Wert} \cdot \text{gesuchte Menge}}{\text{gegebene Menge}}$$

**Mini-Beispiel:** 8 Ordner kosten 20,00 €. Was kosten 30 Ordner?

1. 1 Ordner: 20,00 € ÷ 8 = 2,50 €
2. 30 Ordner: 2,50 € × 30 = **75,00 €**

**Ungerade Zuordnung:** 4 Kräfte brauchen 6 Tage → 8 Kräfte brauchen
4 × 6 ÷ 8 = **3 Tage**.
```

Pflicht-Formeln je Kapitel (jeweils zusätzlich Mini-Beispiel mit glatten Zahlen rechnen):
- `prozentrechnung`: P = G·p/100, p = P·100/G, G = P·100/p; vermehrter Grundwert G = Brutto/1,19.
- `zinsrechnung`: Z = K·p·t/(100·360); Hinweis Monat = 30 Tage, Jahr = 360 Tage.
- `kg-gewinnverteilung`: Verzinsung = Einlage · 0,04; Restgewinn = Gewinn − Σ Verzinsungen; Hinweis: Verteilung des Rests laut Vertrag, sonst „angemessen" (§ 168 HGB).
- `gleichgewichtspreis-umsatz`: Gleichgewicht bei Angebot = Nachfrage; U = p·m; Hinweis maximaler Umsatz = Zeile mit größtem p·m der NACHFRAGE.
- `darlehen`: Zins = Restschuld·p/100; Tilgungsdarlehen: Tilgung = Betrag/Jahre konstant; Fälligkeitsdarlehen: Restschuld konstant bis Ende; Annuität = Zins + Tilgung (konstant).
- `leasing`: Gesamt = Sonderzahlung + Rate·Monate (+ Restwert); Hinweis: Vergleich mit Kaufpreis für die Entscheidungsfrage.
- `wirtschaftlichkeit-produktivitaet`: W = Ertrag/Aufwand (>1 wirtschaftlich); Produktivität = Output/Input (Mengengrößen!).
- `konjunktur-indikatoren`: Inflationsrate = (VPI neu − VPI alt)/VPI alt·100; Arbeitslosenquote = Arbeitslose/zivile Erwerbspersonen·100.
- `energie-betriebskosten`: kWh = kW·h; Kosten = kWh·Preis; Einsparung in % = Ersparnis/alte Kosten·100.

- [ ] **Step 2: Verifizieren** — Schema-Audit grün, `npm run preview`: alle 10 Erklärungs-Tabs rendern (KaTeX-Formeln sichtbar, kein rohes `$$`).

- [ ] **Step 3: Commit** — `git commit -am "Rechnen-Kachel: Kurzerklärungen mit Formeln und Mini-Beispielen"`

---

### Task 11: Lernstand-Block

**Files:**
- Modify: `src/pages/Lernstand.tsx`

**Interfaces:**
- Consumes: `ladeRechnenStand` (Task 7), `ladeRechnen` (Task 1).

- [ ] **Step 1:** In `src/pages/Lernstand.tsx` einen Block „🧮 Kaufmännisches Rechnen" ergänzen (Platzierung: nach dem „🧠 Themen-Quiz heute"-Block, gleiches Karten-Muster wie die umliegenden Blöcke). Daten: `const { daten: rechnen } = useDaten(ladeRechnen)` + `ladeRechnenStand()`. Nur Kapitel mit Versuchen anzeigen; pro Kapitel ein Balken:

```tsx
{rechnen && (() => {
  const stand = ladeRechnenStand()
  const geuebt = rechnen.kapitel.filter((k) => {
    const s = stand.kapitel[k.id]
    return s && s.richtig + s.falsch > 0
  })
  if (geuebt.length === 0) return null
  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold text-slate-900">🧮 Kaufmännisches Rechnen</h2>
      <div className="space-y-2">
        {geuebt.map((k) => {
          const s = stand.kapitel[k.id]!
          const quote = s.richtig / (s.richtig + s.falsch)
          return (
            <div key={k.id}>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">{k.titel}</span>
                <span className="text-slate-500">
                  {s.richtig}/{s.richtig + s.falsch} richtig
                  {k.aufgaben.length > 0 && ` · ${s.geloest.length}/${k.aufgaben.length} Prüfungsaufgaben`}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.round(quote * 100)}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 2: Verifizieren** — tsc grün, `npm run preview`: nach ein paar Übungen erscheint der Block im Lernstand; ohne Übungen erscheint er NICHT.

- [ ] **Step 3: Commit** — `git commit -am "Rechnen-Kachel: Lernstand-Block"`

---

### Task 12: Abschluss

- [ ] **Step 1:** Volle Suite + Build: `node node_modules/vitest/vitest.mjs run && node node_modules/typescript/bin/tsc -b && npm run build`
- [ ] **Step 2:** Manueller Rundgang (`npm run preview`): Home-Kachel → Übersicht → je 1 Kapitel pro Gruppe komplett (Erklärung, 3× Üben inkl. Falsch-/Knapp-Fall, Prüfungsaufgaben), Lernstand-Block, Reload (Fortschritt bleibt).
- [ ] **Step 3:** superpowers:finishing-a-development-branch für Merge-Entscheidung; danach ggf. `kbm-pruefungscoach-dist.zip` neu bauen (dist zippen — Muster siehe Memory/vorherige Runden), falls der Nutzer deployen will.

---

## Self-Review (durchgeführt)

- **Spec-Abdeckung:** 10 Kapitel (T1), Datenmodell+Schema (T1), Generatoren-Regeln (T4-6), Zahleneingabe mit Toleranz + „knapp"-Hinweis + Leer-Behandlung (T2-3), Tabs-UI (T8), Original-Aufgaben mit Übernahmeregeln + Anonymisierung (T9), Erklärungen (T10), Fortschritt+Sync+Lernstand (T7, T11), Tests je Baustein. Bewusst NICHT: Lehrer-Panel, Leitner, KI, neue PDFs (Spec-Ausschlüsse).
- **Typkonsistenz:** `GenerierteAufgabe`/`RechnenAufgabeFest` (T1) ↔ `RechnenAufgabe`-Props (T3, strukturell kompatibel) ↔ `GENERATOREN` (T4-6) ↔ Seiten (T8). `bewerteEingabe`-Signatur einheitlich (T2/T3). Storage-API `getItem`/`setItem` wie in `storage.ts`.
- **Platzhalter:** keine — alle Code-Schritte enthalten vollständigen Code; T9/T10 sind Content-Tasks mit vollständigen Regeln, ID-Listen und Mustern.
