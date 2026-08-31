# KBM Prüfungscoach — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Statische Lern-Webapp (GitHub Pages) für die IHK-KBM-Abschlussprüfung mit 4 Lernbereichen, 3-Stufen-Übungssystem, Karteikarten (Leitner), Quizzen, Lernzetteln und KI-extrahierten Prüfungsinhalten.

**Architecture:** Vite+React+TS+Tailwind-SPA mit Hash-Routing, liest JSON aus `public/data/`, Fortschritt in `localStorage` (versioniert `kbm.v1.*`). Content entsteht vorab per KI-Extraktion aus PDFs + Schema-Audit; die App enthält keine Extraktionslogik.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), react-router-dom (HashRouter), react-markdown, Vitest, Ajv (Schema-Audit).

**Spec:** `docs/superpowers/specs/2026-08-31-kbm-pruefungscoach-design.md`

## Global Constraints

- UI-Sprache: Deutsch. Domänen-Feldnamen im Datenmodell: Deutsch (`themaId`, `loesung`, …).
- Responsive Pflicht: Mobile-First, Desktop-Mehrspalten (Aufgabe+Anlage nebeneinander ab `lg:`).
- Zugangscode `KBMap2` nur als SHA-256-Hash im Code: `f686044080240ccbd16a5363cb8ca39278eae96da40506b09ffb40c6bf60861f`.
- `vite.config.ts` mit `base: './'` — muss auf GitHub Pages UND späterem Webserver laufen. Nur Hash-Routing.
- Keine PDFs ins Repo (`.gitignore` vorhanden: `*.pdf`, `content-pipeline/raw/`).
- Aufgaben-Kennzeichnung `quelle: original | abgeleitet | generiert`; Originale mit `termin`.
- `localStorage`-Keys: `kbm.v1.gate`, `kbm.v1.fortschritt`, `kbm.v1.karten`.
- Jede JSON-Datei in `public/data/` muss den Schema-Test (Task 2) bestehen, bevor sie committet wird.
- Commits: konventionell (`feat:`, `test:`, `content:`, `chore:`), nach jedem Task.

## File Structure (Zielbild)

```
kbm-pruefungscoach/
├── index.html, vite.config.ts, package.json, tsconfig.json
├── .github/workflows/deploy.yml
├── public/data/
│   ├── bereiche.json, glossar.json
│   ├── themen/{wiso,kbz,buchfuehrung,muendlich}.json
│   ├── aufgaben/{wiso,kbz,buchfuehrung,muendlich}.json
│   ├── pruefungen/index.json  (Liste) + je Termin-Objekt darin
│   └── karteikarten/{wiso,kbz,buchfuehrung,muendlich}.json
├── src/
│   ├── main.tsx, App.tsx, index.css, types.ts
│   ├── lib/{storage,gate,data,leitner,progress,quiz}.ts
│   ├── components/{Gate,Layout,BereichKachel,QuizMC,QuizOffen,Karteikarte,Timer,MedienSlot,QuelleBadge,Markdown}.tsx
│   └── pages/{Home,Bereich,Stufe1,Stufe2,Stufe3,Simulation,Muendlich,Landkarte,Glossar,Suche}.tsx
├── schema/content.schema.json
├── tests/{schema,storage,gate,leitner,progress,quiz}.test.ts
└── content-pipeline/{raw/ (gitignored), audit-report.md, EXTRAKTION.md}
```

---

### Task 1: Projekt-Gerüst (Vite + React + TS + Tailwind + Vitest)

**Files:** Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

**Interfaces:** Produces: lauffähiges `npm run dev` / `npm run build` / `npm test`-Gerüst.

- [ ] **Step 1:** `package.json` schreiben:

```json
{
  "name": "kbm-pruefungscoach",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.1",
    "react-router-dom": "^6.28.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "ajv": "^8.17.1",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.6.3",
    "vite": "^6.0.0",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2:** `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any)
```

- [ ] **Step 3:** `tsconfig.json` (ein einziges, kein project-references-Split; `tsc -b` funktioniert damit):

```json
{
  "compilerOptions": {
    "target": "ES2022", "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext", "moduleResolution": "bundler",
    "jsx": "react-jsx", "strict": true, "noEmit": true,
    "skipLibCheck": true, "isolatedModules": true,
    "types": ["vitest/globals"]
  },
  "include": ["src", "tests", "content-pipeline/*.ts"]
}
```

- [ ] **Step 4:** `index.html` (lang=de, viewport für mobil), `src/index.css` (`@import "tailwindcss";`), `src/main.tsx` (React root), `src/App.tsx` (vorerst `<h1>KBM Prüfungscoach</h1>`).
- [ ] **Step 5:** `npm install`, dann `npm run build` → Expected: `dist/` entsteht ohne Fehler. Falls vboxsf-Symlink-Probleme: `npm install --no-bin-links` versuchen und `npx vite build` nutzen.
- [ ] **Step 6:** Commit `chore: scaffold vite react ts tailwind`.

### Task 2: Datenmodell — Typen, JSON-Schema, Schema-Test, bereiche.json

**Files:** Create: `src/types.ts`, `schema/content.schema.json`, `tests/schema.test.ts`, `public/data/bereiche.json`

**Interfaces:** Produces (von ALLEN späteren Tasks konsumiert):

```ts
// src/types.ts — vollständig:
export type BereichId = 'wiso' | 'kbz' | 'buchfuehrung' | 'muendlich'

export interface MedienSlot { titel: string; url?: string; status: 'geplant' | 'vorhanden' }
export interface Medien { video?: MedienSlot; podcast?: MedienSlot }

export interface Bereich {
  id: BereichId; name: string; kurz: string; beschreibung: string
  farbe: string          // Tailwind-Farbstamm, z. B. "sky"
  hatStufen: boolean     // false nur für 'muendlich'
}

export interface Thema {
  id: string; bereich: BereichId; name: string; beschreibung: string
  haeufigkeit: string[]      // Termin-IDs, z. B. "2024-sommer"
  lernzettel: string         // Markdown
  eselsbruecken: string[]
  selbstcheck: string[]      // kurze Fragen für Stufe 1
  medien?: Medien
}

export type AufgabenQuelle = 'original' | 'abgeleitet' | 'generiert'
export type AufgabenTyp = 'mc' | 'offen' | 'rechnen'

export interface Aufgabe {
  id: string; themaId: string; bereich: BereichId
  quelle: AufgabenQuelle; termin?: string
  typ: AufgabenTyp; text: string; anlagenText?: string; punkte?: number
  optionen?: string[]; korrekt?: number[]   // nur typ 'mc'
  loesung: string; erklaerung?: string
}

export interface Pruefung {
  termin: string; bereich: BereichId; name: string
  zeitMinuten: number; punkteGesamt: number; aufgabenIds: string[]
}

export interface Karteikarte { id: string; themaId: string; bereich: BereichId; vorderseite: string; rueckseite: string }
export interface GlossarEintrag { begriff: string; definition: string; bereiche: BereichId[] }
```

- [ ] **Step 1:** `src/types.ts` exakt wie oben schreiben.
- [ ] **Step 2:** `schema/content.schema.json` — ein Schema mit `$defs` pro Entität (bereich, thema, aufgabe, pruefung, karteikarte, glossarEintrag) und je einem Array-Wrapper; draft-07; `additionalProperties: false`; `required` = alle Nicht-`?`-Felder aus den Typen; `quelle`/`typ`/`status`/`bereich` als `enum`. Regel im Schema: `aufgabe` mit `typ: "mc"` erfordert `optionen` und `korrekt` (via `if/then`).
- [ ] **Step 3:** Failing Test `tests/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import Ajv from 'ajv'

const schema = JSON.parse(readFileSync('schema/content.schema.json', 'utf8'))
const ajv = new Ajv({ allErrors: true })
const dataDir = 'public/data'

function validate(defName: string, file: string) {
  const v = ajv.compile({ $ref: `content.schema.json#/$defs/${defName}` , $id: 'x'})
  const data = JSON.parse(readFileSync(file, 'utf8'))
  const ok = v(data)
  expect(ok, JSON.stringify(v.errors, null, 2)).toBe(true)
}

describe('Content-Schema-Audit', () => {
  ajv.addSchema(schema, 'content.schema.json')
  it('bereiche.json ist gültig', () => validate('bereichListe', join(dataDir, 'bereiche.json')))
  for (const sub of ['themen', 'aufgaben', 'karteikarten'] as const) {
    const dir = join(dataDir, sub)
    if (!existsSync(dir)) continue
    for (const f of readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const def = { themen: 'themaListe', aufgaben: 'aufgabeListe', karteikarten: 'karteikarteListe' }[sub]
      it(`${sub}/${f} ist gültig`, () => validate(def, join(dir, f)))
    }
  }
  if (existsSync(join(dataDir, 'pruefungen/index.json')))
    it('pruefungen/index.json ist gültig', () => validate('pruefungListe', join(dataDir, 'pruefungen/index.json')))
  if (existsSync(join(dataDir, 'glossar.json')))
    it('glossar.json ist gültig', () => validate('glossarListe', join(dataDir, 'glossar.json')))
})
```

- [ ] **Step 4:** `public/data/bereiche.json` mit den 4 Bereichen (wiso/sky, kbz/emerald, buchfuehrung/amber, muendlich/violet; `hatStufen:false` nur bei muendlich). `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: datenmodell mit schema-audit`.

### Task 3: Storage-Lib (versioniertes localStorage, Privatmodus-sicher)

**Files:** Create: `src/lib/storage.ts`, `tests/storage.test.ts`

**Interfaces:** Produces: `getItem<T>(key: string): T | null`, `setItem<T>(key: string, value: T): boolean`, `storageVerfuegbar(): boolean`. Keys werden von Aufrufern voll qualifiziert übergeben (`kbm.v1.…`).

- [ ] **Step 1:** Failing Test: setzt/holt Objekt, liefert `null` bei fehlendem Key, überlebt kaputtes JSON (`localStorage.setItem('k','{{')` → `getItem` gibt `null`), und mit gemocktem werfendem `localStorage` gibt `setItem` `false` zurück statt zu werfen. Für Node-Tests: Mini-Mock `globalThis.localStorage` als Map-basiertes Objekt im Test.
- [ ] **Step 2:** Implementierung: try/catch um alle Zugriffe; `storageVerfuegbar()` schreibt+löscht Testkey.
- [ ] **Step 3:** `npm test` → PASS. Commit `feat: storage-lib`.

### Task 4: Zugangscode-Gate

**Files:** Create: `src/lib/gate.ts`, `tests/gate.test.ts`, `src/components/Gate.tsx`; Modify: `src/App.tsx`

**Interfaces:** Produces: `pruefeCode(eingabe: string): Promise<boolean>` (SHA-256 via `crypto.subtle`, vergleicht gegen `CODE_HASH`), `istFreigeschaltet(): boolean`, `schalteFrei(): void` (Key `kbm.v1.gate` = `"ok"`). `<Gate>` rendert Kinder nur nach Freischaltung, sonst Code-Formular (zentriert, mobil-tauglich).

- [ ] **Step 1:** Failing Test: `pruefeCode('KBMap2')` → true, `pruefeCode('falsch')` → false (Node ≥20 hat `crypto.subtle` global).
- [ ] **Step 2:** Implementierung mit `CODE_HASH = 'f686044080240ccbd16a5363cb8ca39278eae96da40506b09ffb40c6bf60861f'`.
- [ ] **Step 3:** `Gate.tsx`: Formular mit Passwortfeld + Fehlermeldung „Falscher Code"; bei Erfolg `schalteFrei()` + State-Update. In `App.tsx` um alles wickeln.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: zugangscode-gate`.

### Task 5: Routing, Layout, Startseite

**Files:** Create: `src/components/Layout.tsx`, `src/components/BereichKachel.tsx`, `src/pages/Home.tsx`; Modify: `src/App.tsx`

**Interfaces:** Consumes: `ladeBereiche()` aus Task 6 (bis dahin: direkter `fetch('./data/bereiche.json')` inline, wird in Task 6 ersetzt). Produces: Routenschema `#/`, `#/:bereichId`, `#/:bereichId/stufe1|stufe2|stufe3`, `#/:bereichId/simulation/:termin`, `#/landkarte/:bereichId`, `#/glossar`, `#/suche`.

- [ ] **Step 1:** `App.tsx`: `<HashRouter>` + `<Routes>`; Platzhalter-Seiten für noch nicht gebaute Routen (einfaches `<p>folgt</p>` NUR bis der jeweilige Task sie ersetzt — am Projektende existiert keine mehr).
- [ ] **Step 2:** `Layout.tsx`: Kopfzeile (Titel, Zurück-Link), Inhalt `max-w-5xl mx-auto px-4`, mobile Bottom-Nav (Start/Suche/Glossar) via `fixed bottom-0 … md:hidden`, Desktop-Topnav `hidden md:flex`.
- [ ] **Step 3:** `Home.tsx`: lädt Bereiche, Grid `grid-cols-1 sm:grid-cols-2` aus `BereichKachel` (Name, Beschreibung, Farbe, Fortschrittsbalken-Platzhalter 0 % bis Task 8 ihn füttert).
- [ ] **Step 4:** `npm run build` → OK; manueller Check `npm run dev`. Commit `feat: routing layout startseite`.

### Task 6: Datenlader mit Fehlerzuständen

**Files:** Create: `src/lib/data.ts`; Modify: `src/pages/Home.tsx`

**Interfaces:** Produces:

```ts
ladeBereiche(): Promise<Bereich[]>
ladeThemen(b: BereichId): Promise<Thema[]>
ladeAufgaben(b: BereichId): Promise<Aufgabe[]>
ladePruefungen(): Promise<Pruefung[]>
ladeKarteikarten(b: BereichId): Promise<Karteikarte[]>
ladeGlossar(): Promise<GlossarEintrag[]>
// alle: fetch('./data/…'), Module-Level-Cache (Map<string, Promise>), wirft bei !res.ok
```

Zusätzlich Hook `useDaten<T>(loader: () => Promise<T>): { daten: T | null; fehler: string | null; laedt: boolean }`.

- [ ] **Step 1:** Implementieren; fehlende Datei ⇒ Fehlertext „Inhalte konnten nicht geladen werden" in der jeweiligen Kachel/Seite statt Crash (Spec §9).
- [ ] **Step 2:** Home auf `useDaten(ladeBereiche)` umstellen. Build OK. Commit `feat: datenlader`.

### Task 7: Leitner-Algorithmus

**Files:** Create: `src/lib/leitner.ts`, `tests/leitner.test.ts`

**Interfaces:** Produces:

```ts
export interface KartenStand { fach: 1|2|3|4|5; faelligAm: string } // ISO-Datum YYYY-MM-DD
export const INTERVALLE = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 } as const
antworten(stand: KartenStand | undefined, richtig: boolean, heute: string): KartenStand
istFaellig(stand: KartenStand | undefined, heute: string): boolean  // undefined ⇒ true (neu)
naechsteFaellige(staende: Record<string, KartenStand>, ids: string[], heute: string): string[]
```

- [ ] **Step 1:** Failing Tests: neu+richtig ⇒ Fach 2, fällig morgen; Fach 3+falsch ⇒ Fach 1, fällig heute; Fach 5+richtig bleibt 5, fällig +14; `istFaellig` mit Vergangenheit ⇒ true, Zukunft ⇒ false, undefined ⇒ true; `naechsteFaellige` sortiert Neue vor Überfällige.
- [ ] **Step 2:** Implementieren (Datumsarithmetik über `new Date(heute + 'T00:00:00Z')` + `setUTCDate`, zurück zu ISO-Slice). `npm test` → PASS.
- [ ] **Step 3:** Commit `feat: leitner-spaced-repetition`.

### Task 8: Fortschritt & Streak

**Files:** Create: `src/lib/progress.ts`, `tests/progress.test.ts`; Modify: `src/components/BereichKachel.tsx`

**Interfaces:** Produces:

```ts
export interface Fortschritt {
  erledigteAufgaben: string[]                       // Aufgaben-IDs
  quizErgebnisse: Record<string, { richtig: number; gesamt: number }> // key: themaId
  streak: { letzterTag: string; tage: number }
}
ladeFortschritt(): Fortschritt                       // aus kbm.v1.fortschritt, sonst Default
merkeErledigt(aufgabeId: string, heute: string): Fortschritt
merkeQuiz(themaId: string, richtig: number, gesamt: number, heute: string): Fortschritt
aktualisiereStreak(f: Fortschritt, heute: string): Fortschritt  // gestern⇒+1, heute⇒gleich, sonst⇒1
bereichsFortschritt(f: Fortschritt, aufgaben: Aufgabe[]): number // 0..1 Anteil erledigter
```

- [ ] **Step 1:** Failing Tests für Streak-Fälle (gleicher Tag idempotent, Folgetag +1, Lücke ⇒ 1) und `bereichsFortschritt` (2 von 4 ⇒ 0.5, leere Liste ⇒ 0).
- [ ] **Step 2:** Implementieren (nutzt Task-3-Storage). `npm test` → PASS.
- [ ] **Step 3:** `BereichKachel` zeigt echten Fortschrittsbalken + Streak-Flamme im Layout-Header. Commit `feat: fortschritt und streak`.

### Task 9: Quiz-Logik & -Komponenten

**Files:** Create: `src/lib/quiz.ts`, `tests/quiz.test.ts`, `src/components/QuizMC.tsx`, `src/components/QuizOffen.tsx`, `src/components/QuelleBadge.tsx`, `src/components/Markdown.tsx`

**Interfaces:** Produces:

```ts
// lib/quiz.ts
wertungMC(korrekt: number[], gewaehlt: number[]): boolean   // Mengengleichheit
// QuizMC: props { aufgabe: Aufgabe; onErgebnis: (richtig: boolean) => void }
// QuizOffen: props { aufgabe: Aufgabe; onErgebnis: (richtig: boolean) => void }
//   zeigt Frage → Button „Lösung anzeigen" → Musterlösung + Buttons „Wusste ich“/„Wusste ich nicht“
// QuelleBadge: props { quelle: AufgabenQuelle; termin?: string }  → farbiges Label
// Markdown: dünner Wrapper um react-markdown mit Tailwind-Prose-Klassen
```

- [ ] **Step 1:** Failing Tests `wertungMC`: exakte Menge ⇒ true; Teilmenge/Übermenge/Reihenfolge-egal-Fälle.
- [ ] **Step 2:** Implementieren + Komponenten (MC: Antwortknöpfe `min-h-12` touch-tauglich, nach Wertung grün/rot + `erklaerung`). `npm test` → PASS.
- [ ] **Step 3:** Commit `feat: quiz-komponenten`.

### Task 10: Bereichsseite + Stufe 1 (Auffrischung)

**Files:** Create: `src/pages/Bereich.tsx`, `src/pages/Stufe1.tsx`, `src/components/MedienSlot.tsx`

**Interfaces:** Consumes: Task 6 Lader, Task 9 Markdown. Produces: `Bereich.tsx` = Stufenwahl (3 große Karten: „1 · Auffrischung", „2 · Themen-Training", „3 · Prüfungsjahre" + Karteikarten + Landkarte-Link); `muendlich` routet stattdessen zu Task 14. `Stufe1.tsx` = Themenliste (Accordion); pro Thema: Lernzettel (Markdown), Eselsbrücken (💡-Kästen `bg-amber-50`), Selbstcheck-Fragen (auf-/zuklappbar), `MedienSlot` (Video/Podcast; ohne URL ⇒ Badge „folgt", mit URL ⇒ Link).

- [ ] **Step 1:** Bauen; Desktop: Lernzettel zweispaltig (`lg:columns-2` für lange Texte vermeiden — stattdessen `lg:grid lg:grid-cols-[2fr_1fr]`: links Lernzettel, rechts Eselsbrücken+Medien).
- [ ] **Step 2:** Build OK, mobiler Smoke-Test im dev-Server. Commit `feat: stufe1 auffrischung`.

### Task 11: Stufe 2 (Themen-Training)

**Files:** Create: `src/pages/Stufe2.tsx`

**Interfaces:** Consumes: Lader, QuizMC/QuizOffen, QuelleBadge, `merkeErledigt`, `merkeQuiz`. Produces: Themenauswahl (Chips mit Häufigkeitszahl „6×") → Aufgabenliste des Themas; `mc` als QuizMC, `offen`/`rechnen` als QuizOffen (bei `rechnen` zusätzlich `erklaerung` als Rechenweg); `anlagenText` auf Desktop rechts neben der Aufgabe (`lg:grid-cols-2`), mobil darunter aufklappbar; erledigte Aufgaben mit Haken, Filter „Nur offene".

- [ ] **Step 1:** Bauen. Ergebnis-Callbacks: `onErgebnis` ⇒ `merkeErledigt(aufgabe.id, heute)` + `merkeQuiz(themaId, …)`.
- [ ] **Step 2:** Build OK. Commit `feat: stufe2 themen-training`.

### Task 12: Stufe 3 (Prüfungsjahre + Simulation)

**Files:** Create: `src/pages/Stufe3.tsx`, `src/pages/Simulation.tsx`, `src/components/Timer.tsx`

**Interfaces:** Consumes: `ladePruefungen()`, Lader, Quiz-Komponenten. Produces: `Stufe3.tsx` = Terminliste des Bereichs (Karte je Termin: Name, `zeitMinuten`, `punkteGesamt`, Buttons „Üben" / „Simulation"). Übungsmodus = Aufgaben sequenziell mit sofort aufklappbarer Lösung. `Simulation.tsx` = Timer läuft (`Timer` props `{ minuten: number; onAbgelaufen: () => void }`, `mm:ss`, ab 5 Min rot), Lösungen gesperrt bis Abgabe/Ablauf; danach Auswertungsseite (pro Aufgabe Selbstbewertung bei offenen, automatische Wertung bei MC, Punktesumme).

- [ ] **Step 1:** Timer bauen (setInterval in useEffect, cleanup!). Seiten bauen.
- [ ] **Step 2:** Build OK, Simulation manuell mit 1-Minuten-Testtermin geprüft. Commit `feat: stufe3 pruefungsjahre simulation`.

### Task 13: Karteikarten-Seite

**Files:** Create: `src/pages/Karteikarten.tsx`, `src/components/Karteikarte.tsx`; Modify: `src/App.tsx` (Route `#/:bereichId/karten`)

**Interfaces:** Consumes: `ladeKarteikarten`, Leitner (Task 7), Storage (`kbm.v1.karten` = `Record<kartenId, KartenStand>`). Produces: Stapel-Ansicht: fällige Karten via `naechsteFaellige`; Karte tippen ⇒ Umdrehen (CSS-Flip oder simpler Toggle), Buttons „Gewusst"/„Nicht gewusst" ⇒ `antworten(…)` + speichern; Zähler „Heute fällig: N"; leerer Stapel ⇒ „Alles gelernt für heute 🎉".

- [ ] **Step 1:** Bauen (mobil: Karte füllt Breite, Buttons als große Daumen-Zone unten).
- [ ] **Step 2:** Build OK. Commit `feat: karteikarten mit leitner`.

### Task 14: Bereich Mündliche Prüfung

**Files:** Create: `src/pages/Muendlich.tsx`

**Interfaces:** Consumes: Lader (Themen/Aufgaben/Karteikarten von `muendlich`). Produces: Drei Kategorien statt Stufen: **„Ablauf & Report"** (Themen mit `lernzettel` = Hinweise/Leitfäden), **„Beispielprüfungen üben"** (Aufgaben `typ: offen` als QuizOffen — Prüfungsfrage → Musterantwort), **„Karteikarten"** (Link auf Task-13-Seite). `Bereich.tsx` leitet `muendlich` hierher.

- [ ] **Step 1:** Bauen. Build OK. Commit `feat: muendlich-bereich`.

### Task 15: Themen-Landkarte, Glossar, Suche

**Files:** Create: `src/pages/Landkarte.tsx`, `src/pages/Glossar.tsx`, `src/pages/Suche.tsx`

**Interfaces:** Consumes: Lader. Produces: Landkarte = Themen des Bereichs sortiert nach `haeufigkeit.length` absteigend, Balken + „N× geprüft (2017–2025)", Links zu Stufe 1/2 des Themas. Glossar = alphabetisch gruppiert, Filter-Chips nach Bereich. Suche = Eingabefeld, case-insensitive Substring über Themen (`name`, `beschreibung`) und Aufgaben (`text`) aller Bereiche, Ergebnisliste mit Sprunglinks.

- [ ] **Step 1:** Bauen. Build OK. Commit `feat: landkarte glossar suche`.

### Task 16: Deploy-Workflow (GitHub Pages)

**Files:** Create: `.github/workflows/deploy.yml`

- [ ] **Step 1:**

```yaml
name: Deploy
on: { push: { branches: [main] } }
permissions: { contents: read, pages: write, id-token: write }
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: { name: github-pages }
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2:** Commit `chore: github-pages deploy`. (Aktivierung „Pages → GitHub Actions" macht der Nutzer beim Hochladen.)

### Task 17: Content — Muster-Extraktion (je Bereich 1 aktueller Termin)

**Files:** Create: `content-pipeline/EXTRAKTION.md` (dokumentierte Prozedur), `public/data/themen/*.json`, `public/data/aufgaben/*.json`, `public/data/pruefungen/index.json`, `content-pipeline/audit-report.md`

**Interfaces:** Consumes: Schema (Task 2). Produces: valide Contentdaten für: KBZ (S25 AP2 Aufgaben+Lösungen), WiSo (WiSo So25 + Lösung), Buchführung (LosungenBuchfuhrungKlr S25), Mündlich (Auswahl aus „60 Mundliche Prufungen mit Losungen" + „Mundliche Prufung Hinweise").

**Prozedur je Termin (in EXTRAKTION.md dokumentieren und befolgen):**
- [ ] **Step 1:** PDF mit Read-Tool seitenweise lesen (`pages`), Aufgaben + Lösungen + Punkte + Anlagenbezug erfassen.
- [ ] **Step 2:** Themen identifizieren/zuordnen (bestehende Themen-IDs wiederverwenden!), JSON schreiben: Aufgaben mit `quelle: "original"`, `termin` gesetzt; Prüfungseintrag mit `zeitMinuten`/`punkteGesamt` laut Deckblatt.
- [ ] **Step 3:** Audit: `npm test` (Schema); Punktesummen-Check Aufgaben vs. `punkteGesamt` (±5 % Toleranz für nicht erfasste Formalia — Abweichung in `audit-report.md` notieren); KI-Zweitprüfung: PDF erneut stichprobenartig gegen JSON lesen (andere Seitenreihenfolge), Abweichungen fixen und in `audit-report.md` protokollieren.
- [ ] **Step 4:** Commit `content: <bereich> <termin> (original, auditiert)`.

### Task 18: Content — Anreicherung (Lernzettel, Eselsbrücken, Quiz, Karteikarten)

**Files:** Modify: `public/data/themen/*.json`; Create: `public/data/karteikarten/*.json`, `public/data/glossar.json`; Modify: `public/data/aufgaben/*.json`

- [ ] **Step 1:** Je Thema aus Task 17: `lernzettel` (Markdown, 200–500 Wörter: Definitionen, Merksätze, Beispiele), ≥2 `eselsbruecken`, ≥3 `selbstcheck`-Fragen, Medien-Slots `status: "geplant"` mit sinnvollen Titeln.
- [ ] **Step 2:** Je Thema ≥5 Karteikarten, ≥3 MC-Quizfragen (`quelle: "generiert"`, `typ: "mc"`) und ≥2 abgeleitete Übungsaufgaben (`quelle: "abgeleitet"`). Glossar ≥30 Kernbegriffe über alle Bereiche.
- [ ] **Step 3:** `npm test` (Schema) → PASS. Commit `content: anreicherung lernzettel quiz karteikarten`.

### Task 19: Content — Rollout weitere Termine + Abschluss-Audit

**Files:** Modify: `public/data/**`, `content-pipeline/audit-report.md`

- [ ] **Step 1:** Prozedur aus Task 17 für weitere Termine (Priorität: 2024 Sommer, 2023er, dann rückwärts; so viele wie in der Session qualitativ machbar — NICHT hetzen, lieber weniger Termine sauber; Rest als dokumentierte Anleitung in EXTRAKTION.md für spätere Sessions).
- [ ] **Step 2:** `haeufigkeit` aller Themen aktualisieren (jeder Termin, in dem das Thema vorkam).
- [ ] **Step 3:** Abschluss-Audit: `npm test`, Dubletten-Check (gleicher Aufgabentext in 2 Terminen ⇒ in `audit-report.md`), Build, Smoke-Test aller Seiten mobil+desktop im dev-Server.
- [ ] **Step 4:** Commit `content: rollout weitere termine + audit`.

---

## Self-Review (durchgeführt)

- **Spec-Abdeckung:** §3 Gate→T4, Routing→T5; §4 vier Bereiche→T2/T5/T14; §5.1 Stufen→T10/11/12; §5.2 Karteikarten→T7/T13, Landkarte→T15, Quiz→T9, Medien→T10, Fortschritt/Streak→T8, Suche/Glossar→T15; §6 Pipeline+Audit→T17–19; §7 Datenmodell→T2; §8 Stack/Deploy/Responsive→T1/T16/alle UI-Tasks; §9 Fehler→T3/T6. Keine Lücken.
- **Platzhalter:** Nur erlaubte Übergangs-Platzhalter in T5 (explizit terminiert). Keine TBDs.
- **Typkonsistenz:** Alle späteren Tasks referenzieren exakt die in T2/T7/T8/T9 definierten Namen (`antworten`, `istFaellig`, `merkeErledigt`, `wertungMC`, `hatStufen`, …).
