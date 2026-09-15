# Verbesserungsrunde 2 — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Darkmode-Lesbarkeit reparieren, Präsentationen auf max. 8 Quizfolien pro Thema ausbalancieren, Gesetzesverweise automatisch verlinken und die Lernzettel aller 32 Themen auf 6–8 gehaltvolle Folien ausbauen.

**Architecture:** Der Darkmode-Fix zentralisiert sich in `src/lib/farben.ts` (dark-Varianten) plus einem neuen Hellmodus-Modul für Druck-/Beamer-Routen. Die Quizfolien-Auswahl wird als pure Funktion nach `src/lib/folien.ts` extrahiert. Die §-Verlinkung ist ein Vorverarbeitungsschritt (`src/lib/paragraphen.ts`) im zentralen `Markdown.tsx`. Der Inhaltsausbau ändert nur `public/data/themen/*.json`.

**Tech Stack:** Vite 6, React 18, TypeScript, Tailwind v4 (klassenbasierter Darkmode via `@custom-variant dark`), Vitest (environment: **node**, Komponententests via `renderToString`), react-markdown + remark-gfm/-math + rehype-katex.

**Spec:** `docs/superpowers/specs/2026-09-15-verbesserungsrunde-2-design.md`

## Global Constraints

- Arbeitsbranch: `feature/verbesserungsrunde-2` (von `main` abzweigen; Task 1 erstellt ihn).
- Testkommando ist **`npm test`** — NIEMALS `npx vitest` (bin-links fehlen wegen `--no-bin-links` auf vboxsf). Bestand: 218 Tests, müssen grün bleiben.
- Falls `npm test`/Build mysteriös scheitert (leere Ordner in node_modules): Preview-Server stoppen, `rm -rf node_modules && npm install --no-bin-links`.
- Git-Commits können auf vboxsf beim ersten Versuch scheitern → denselben Commit einfach erneut ausführen.
- Code-Sprache: deutsche Bezeichner/Kommentare wie im Bestand (`waehleQuizfolien`, nicht `selectQuizSlides`).
- UI-Texte: Deutsch, Du-Form.
- Druckrouten (`Skript`, `Nachschlagewerk`, `Handout`) und `Praesentation` müssen IMMER hell rendern (auch wenn `html.dark` gesetzt war).
- Lernzettel-`##`-Titel, die in `FOLIEN_DIAGRAMME` (src/components/diagramme.tsx) registriert sind, dürfen NICHT umbenannt werden. Der bestehende Test `tests/folien.test.ts` („Registry-Schlüssel") erzwingt das. Geschützte Titel: „Kündigung und Kündigungsschutz", „Tarifvertrag, Betriebsrat und Mitbestimmung", „Sozialversicherung: die fünf Säulen" (Thema berufsausbildung-arbeitsrecht), „Geldpolitik der EZB, Inflation und Deflation" (konjunktur-indikatoren), „Rechtsformen im Überblick" (rechtsformen-vollmachten), „Kaufvertrag und Leistungsstörungen".
- Rechtsstand 2026: Aufbewahrungsfristen für Buchungsbelege/Handelsbücher = **8 Jahre** (nicht 10).
- Commit-Messages enden mit `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

---

### Task 1: Branch + dark-Varianten in farben.ts

**Files:**
- Modify: `src/lib/farben.ts`
- Test: `tests/farben.test.ts` (neu)

**Interfaces:**
- Consumes: bestehende `FARBEN`-Map und `farbe()`-Helfer (Signaturen unverändert).
- Produces: `FARBEN[x].kachel/akzentText/chip` enthalten zusätzlich `dark:`-Klassen. Konsumenten (`BereichKachel.tsx`, `Bereich.tsx`, `Quiz.tsx`, `Unterricht.tsx`) brauchen KEINE Änderung.

- [ ] **Step 1: Branch erstellen**

```bash
cd /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach
git checkout main && git checkout -b feature/verbesserungsrunde-2
```

- [ ] **Step 2: Fehlschlagenden Test schreiben** — `tests/farben.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { FARBEN } from '../src/lib/farben'

// Regressionsschutz für den Darkmode: Felder mit hellen Hintergründen/Texten
// brauchen zwingend eine dark:-Variante, sonst ist weiße Schrift auf
// Pastellgrund unlesbar (Bug vom 15.09.2026).
describe('FARBEN im Darkmode', () => {
  const pflichtfelder = ['kachel', 'akzentText', 'chip'] as const

  for (const [name, set] of Object.entries(FARBEN)) {
    for (const feld of pflichtfelder) {
      it(`${name}.${feld} hat eine dark:-Variante`, () => {
        expect(set[feld]).toMatch(/dark:/)
      })
    }
    it(`${name}.balken bleibt gesättigt (funktioniert auf hell und dunkel)`, () => {
      expect(set.balken).toMatch(/bg-\w+-[56]00/)
    })
  }
})
```

- [ ] **Step 3: Test laufen lassen — muss fehlschlagen**

Run: `npm test -- farben`
Expected: FAIL — 15 Tests `hat eine dark:-Variante` schlagen fehl (kein `dark:` in den Strings).

- [ ] **Step 4: farben.ts erweitern** — die 5 Sets bekommen dark-Varianten (`balken` und `button` bleiben unverändert, gesättigte Töne funktionieren auf dunklem Grund):

```ts
export const FARBEN: Record<string, FarbSet> = {
  sky: {
    kachel:
      'border-sky-200 bg-sky-50 hover:border-sky-400 dark:border-sky-800 dark:bg-sky-950/50 dark:hover:border-sky-500',
    balken: 'bg-sky-500',
    akzentText: 'text-sky-700 dark:text-sky-300',
    chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
    button: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800',
  },
  emerald: {
    kachel:
      'border-emerald-200 bg-emerald-50 hover:border-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/50 dark:hover:border-emerald-500',
    balken: 'bg-emerald-500',
    akzentText: 'text-emerald-700 dark:text-emerald-300',
    chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
    button: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800',
  },
  amber: {
    kachel:
      'border-amber-200 bg-amber-50 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/50 dark:hover:border-amber-500',
    balken: 'bg-amber-500',
    akzentText: 'text-amber-700 dark:text-amber-300',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
    button: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  violet: {
    kachel:
      'border-violet-200 bg-violet-50 hover:border-violet-400 dark:border-violet-800 dark:bg-violet-950/50 dark:hover:border-violet-500',
    balken: 'bg-violet-500',
    akzentText: 'text-violet-700 dark:text-violet-300',
    chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200',
    button: 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800',
  },
  rose: {
    kachel:
      'border-rose-200 bg-rose-50 hover:border-rose-400 dark:border-rose-800 dark:bg-rose-950/50 dark:hover:border-rose-500',
    balken: 'bg-rose-500',
    akzentText: 'text-rose-700 dark:text-rose-300',
    chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
    button: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800',
  },
}
```

Kommentar am Dateikopf ergänzen: `// Jede helle Kachel-/Chip-/Akzentklasse braucht eine dark:-Variante — tests/farben.test.ts erzwingt das.`

- [ ] **Step 5: Alle Tests laufen lassen**

Run: `npm test`
Expected: PASS (218 + 20 neue).

- [ ] **Step 6: Commit**

```bash
git add src/lib/farben.ts tests/farben.test.ts
git commit -m "fix: dark-Varianten für alle Farbsets — Kacheltitel im Darkmode lesbar

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Hellmodus-Modul für Druck- und Beamer-Routen

**Files:**
- Create: `src/lib/hellmodus.ts`
- Modify: `src/pages/Praesentation.tsx:44-53` (Inline-Effekt ersetzen), `src/pages/Skript.tsx`, `src/pages/Nachschlagewerk.tsx`, `src/pages/Handout.tsx` (Hook ergänzen)
- Test: `tests/hellmodus.test.ts` (neu)

**Interfaces:**
- Produces: `hellErzwingen(el: { classList: { contains(c: string): boolean; add(c: string): void; remove(c: string): void } }): () => void` — entfernt `dark`, Rückgabefunktion stellt wieder her. `useHellmodus(): void` — React-Hook, der `hellErzwingen(document.documentElement)` im `useEffect` nutzt.
- Consumes: nichts aus anderen Tasks. Task 3 verlässt sich darauf, dass Druckrouten danach nie `html.dark` sehen.

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `tests/hellmodus.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { hellErzwingen } from '../src/lib/hellmodus'

// Fake-Element, weil die Testumgebung "node" ist (kein echtes DOM).
function fakeElement(klassen: string[]) {
  const set = new Set(klassen)
  return {
    classList: {
      contains: (c: string) => set.has(c),
      add: (c: string) => void set.add(c),
      remove: (c: string) => void set.delete(c),
    },
    hat: (c: string) => set.has(c),
  }
}

describe('hellErzwingen', () => {
  it('entfernt dark und stellt es beim Aufräumen wieder her', () => {
    const el = fakeElement(['dark'])
    const aufraeumen = hellErzwingen(el)
    expect(el.hat('dark')).toBe(false)
    aufraeumen()
    expect(el.hat('dark')).toBe(true)
  })

  it('fügt dark beim Aufräumen NICHT hinzu, wenn es vorher fehlte', () => {
    const el = fakeElement([])
    const aufraeumen = hellErzwingen(el)
    aufraeumen()
    expect(el.hat('dark')).toBe(false)
  })
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npm test -- hellmodus` — Expected: FAIL (Modul existiert nicht).

- [ ] **Step 3: Modul schreiben** — `src/lib/hellmodus.ts`:

```ts
import { useEffect } from 'react'

interface MitKlassen {
  classList: { contains(c: string): boolean; add(c: string): void; remove(c: string): void }
}

// Druck- und Beamer-Routen rendern bewusst immer hell: dark:-Varianten der
// Kind-Komponenten würden auf weißen Karten/Seiten unleserlich.
export function hellErzwingen(el: MitKlassen): () => void {
  const hatteDark = el.classList.contains('dark')
  el.classList.remove('dark')
  return () => {
    if (hatteDark) el.classList.add('dark')
  }
}

export function useHellmodus(): void {
  useEffect(() => hellErzwingen(document.documentElement), [])
}
```

- [ ] **Step 4: Test laufen lassen** — Run: `npm test -- hellmodus` — Expected: PASS.

- [ ] **Step 5: Routen umstellen.** In `Praesentation.tsx` den Inline-`useEffect` (Zeilen 44–53, Kommentar „Präsentation hat bewusst helles Design …") komplett durch `useHellmodus()` ersetzen (Import aus `../lib/hellmodus`; ungenutzten `useEffect`-Import nur entfernen, falls er sonst nirgends in der Datei gebraucht wird — er wird für die Tastatursteuerung noch gebraucht, also bleibt er). In `Skript.tsx`, `Nachschlagewerk.tsx` und `Handout.tsx` jeweils am Anfang der Seitenkomponente `useHellmodus()` aufrufen und importieren.

- [ ] **Step 6: Alle Tests + Sichtprüfung**

Run: `npm test` — Expected: PASS.
Zusatzprüfung (Preview läuft auf 4173): `#/skript/wiso/produktionsfaktoren-unternehmensziele` bei aktivem Darkmode öffnen → Seite muss hell rendern; nach Verlassen ist der Darkmode wieder aktiv.

- [ ] **Step 7: Commit**

```bash
git add src/lib/hellmodus.ts tests/hellmodus.test.ts src/pages/Praesentation.tsx src/pages/Skript.tsx src/pages/Nachschlagewerk.tsx src/pages/Handout.tsx
git commit -m "feat: zentrales Hellmodus-Modul — Druckrouten erzwingen helles Rendering

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Markdown.tsx darkmode-fähig

**Files:**
- Modify: `src/components/Markdown.tsx`
- Test: bestehende Tests müssen grün bleiben (kein neuer Test — reine Klassenänderung; visuelle Abnahme in Task 4)

**Interfaces:**
- Consumes: Task 2 (Druckrouten sehen nie `html.dark`, daher sind `dark:`-Klassen dort wirkungslos).
- Produces: Markdown-Inhalte lesbar auf dunklen Karten. Task 7 ändert dieselbe Datei erneut (§-Links) — Task 3 zuerst ausführen.

- [ ] **Step 1: Wrapper-Klassen erweitern.** In `Markdown.tsx` im äußeren `div` ergänzen: `text-slate-800` → `text-slate-800 dark:text-slate-200`, `[&_td]:border-slate-200` → zusätzlich `dark:[&_td]:border-slate-600`, `[&_th]:border-slate-200` → zusätzlich `dark:[&_th]:border-slate-600`, `[&_th]:bg-slate-50` → zusätzlich `dark:[&_th]:bg-slate-800`.

- [ ] **Step 2: Tests + Stichprobe**

Run: `npm test` — Expected: PASS.
Stichprobe im Preview (Darkmode aktiv): `#/wiso` → Stufe 1 → ein Thema öffnen: Lernzettel-Text und Tabellen müssen lesbar sein.

- [ ] **Step 3: Commit**

```bash
git add src/components/Markdown.tsx
git commit -m "fix: Markdown-Inhalte im Darkmode lesbar (Text-/Tabellenfarben)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Visueller Dark-Sweep aller Hauptrouten

**Files:**
- Modify: nur Dateien mit gefundenen Kontrastfehlern (Muster: `dark:`-Variante ergänzen, analog Task 1/3)

**Interfaces:**
- Consumes: Tasks 1–3 (deren Fixes müssen eingebaut sein, sonst findet der Sweep nur Bekanntes).

- [ ] **Step 1: Preview sicherstellen** — läuft auf `http://localhost:4173` (sonst: `node node_modules/vite/bin/vite.js preview --port 4173` im Hintergrund; Gate via `?code=KBMap2`).

- [ ] **Step 2: Verdachtsstellen per Grep sammeln** — Dateien mit hellen Hintergründen ohne dark-Gegenstück:

```bash
grep -rln "bg-white\|bg-slate-50\|bg-sky-50\|bg-amber-50\|bg-emerald-50\|bg-violet-50\|bg-rose-50\|bg-amber-100\|bg-slate-100" src/pages src/components | while read f; do
  echo "== $f: $(grep -c 'dark:' "$f") dark-Klassen"
done
```

Dateien mit 0 `dark:`-Klassen, die KEINE Druckrouten sind (Skript/Nachschlagewerk/Handout/Praesentation sind seit Task 2 hell erzwungen und brauchen nichts), sind Prüfkandidaten.

- [ ] **Step 3: Darkmode im Browser durchklicken.** Vorbereitung einmalig per Browser-Konsole/Playwright: `localStorage.setItem('kbm.v1.theme', JSON.stringify('dunkel')); location.reload()`. Diese Routen screenshoten und auf unlesbaren Text prüfen: `#/` (Start), `#/wiso`, `#/kbz`, `#/buchfuehrung`, `#/muendlich`, `#/wiso/quiz`, `#/wiso/unterricht`, `#/lernstand`, `#/glossar` (beide Tabs), `#/rechnen` + ein Kapitel mit Aufgabe, `#/wiso/stufe2`, eine Simulation (`#/wiso/simulation/1`), `#/wiso/karteikarten`, `#/suche`.

- [ ] **Step 4: Jede Fundstelle fixen** — gleiches Muster wie Task 1: helle Klasse behält Original, bekommt `dark:`-Zwilling (Hintergrund `dark:bg-slate-800`/`dark:bg-<farbe>-950/50`, Text `dark:text-slate-200`/`dark:text-<farbe>-300`, Rahmen `dark:border-slate-600`/`dark:border-<farbe>-800`). Nach jedem Fix Screenshot wiederholen.

- [ ] **Step 5: Tests + Commit**

Run: `npm test` — Expected: PASS.

```bash
git add -A src/
git commit -m "fix: Darkmode-Sweep — restliche Kontrastfehler auf Hauptrouten

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Quizfolien-Auswahl begrenzen (max. 8, Originale zuerst)

**Files:**
- Modify: `src/lib/folien.ts` (neue Exporte `alsAufgabe`, `waehleQuizfolien`), `src/pages/Praesentation.tsx` (lokale Logik ersetzen)
- Test: `tests/folien.test.ts` (erweitern)

**Interfaces:**
- Produces: `alsAufgabe(p: Lernpaar): Aufgabe` und `waehleQuizfolien(aufgaben: Aufgabe[], lernpaare: Lernpaar[], themaId: string, max?: number): Aufgabe[]` (Default `max = 8`) aus `src/lib/folien.ts`.
- Consumes: Typen `Aufgabe`, `Lernpaar` aus `src/types`.

- [ ] **Step 1: Fehlschlagende Tests ergänzen** — in `tests/folien.test.ts` anhängen:

```ts
import { waehleQuizfolien } from '../src/lib/folien'
import type { Aufgabe, Lernpaar } from '../src/types'

function aufgabe(id: string, themaId = 't1'): Aufgabe {
  return { id, themaId, bereich: 'wiso', quelle: 'original', typ: 'mc', text: id, optionen: ['a', 'b'], korrekt: [0], loesung: '', erklaerung: '' } as Aufgabe
}
function lernpaar(id: string, themaId = 't1'): Lernpaar {
  return { id, themaId, bereich: 'wiso', frage: id, optionen: ['a', 'b'], korrekt: [0], erklaerung: '' } as Lernpaar
}

describe('waehleQuizfolien', () => {
  const aufgaben = ['a3', 'a1', 'a2'].map((id) => aufgabe(id))
  const lernpaare = ['p2', 'p1', 'p3', 'p4', 'p5', 'p6', 'p7'].map((id) => lernpaar(id))

  it('begrenzt auf max. 8 und stellt Original-Aufgaben nach vorn', () => {
    const f = waehleQuizfolien(aufgaben, lernpaare, 't1')
    expect(f).toHaveLength(8)
    expect(f.slice(0, 3).map((a) => a.id)).toEqual(['a1', 'a2', 'a3'])
    expect(f.slice(3).map((a) => a.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
  })

  it('sortiert stabil nach id (kein Zufall im Beamer-Einsatz)', () => {
    const a = waehleQuizfolien(aufgaben, lernpaare, 't1')
    const b = waehleQuizfolien(aufgaben, lernpaare, 't1')
    expect(a.map((x) => x.id)).toEqual(b.map((x) => x.id))
  })

  it('filtert fremde Themen und Nicht-Quiz-Typen heraus', () => {
    const gemischt = [...aufgaben, aufgabe('x9', 'anderes'), { ...aufgabe('r1'), typ: 'rechnen' } as Aufgabe]
    const f = waehleQuizfolien(gemischt, [], 't1')
    expect(f.map((a) => a.id)).toEqual(['a1', 'a2', 'a3'])
  })

  it('kommt mit weniger als 8 Fragen aus', () => {
    expect(waehleQuizfolien(aufgaben, [], 't1')).toHaveLength(3)
  })
})
```

Hinweis: Falls die `as Aufgabe`/`as Lernpaar`-Casts wegen Pflichtfeldern nicht kompilieren, fehlende Felder mit sinnvollen Dummywerten ergänzen statt Typen aufzuweichen (in `src/types.ts` nachsehen).

- [ ] **Step 2: Tests laufen lassen** — Run: `npm test -- folien` — Expected: FAIL (`waehleQuizfolien` existiert nicht).

- [ ] **Step 3: Implementieren** — in `src/lib/folien.ts` anhängen (Import oben: `import type { Aufgabe, Lernpaar, Thema } from '../types'`):

```ts
// Lernpaar als Aufgaben-Folie — unterstützt MC und Zuordnung.
// (Aus Praesentation.tsx hierher gezogen, damit die Auswahl testbar ist.)
export function alsAufgabe(p: Lernpaar): Aufgabe {
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

// Quizfolien eines Themas: Original-/abgeleitete Aufgaben zuerst, mit
// Lernpaaren aufgefüllt, hart gedeckelt — sonst ertrinken die Inhaltsfolien
// (WiSo hätte sonst ~70 Quizfolien pro Thema). Stabil sortiert, kein Zufall.
export function waehleQuizfolien(
  aufgaben: Aufgabe[],
  lernpaare: Lernpaar[],
  themaId: string,
  max = 8,
): Aufgabe[] {
  const originale = aufgaben
    .filter((a) => a.themaId === themaId && (a.typ === 'mc' || a.typ === 'zuordnung'))
    .sort((a, b) => a.id.localeCompare(b.id))
  const ergaenzung = lernpaare
    .filter((p) => p.themaId === themaId)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(alsAufgabe)
  return [...originale, ...ergaenzung].slice(0, max)
}
```

- [ ] **Step 4: Tests laufen lassen** — Run: `npm test -- folien` — Expected: PASS.

- [ ] **Step 5: Praesentation.tsx umstellen.** Lokale Funktion `alsAufgabe` (Zeilen 11–26) löschen und stattdessen `alsAufgabe, waehleQuizfolien` aus `../lib/folien` importieren. Im `useMemo` (Zeilen 65–84) den `fragen`-Block ersetzen durch:

```ts
const fragen = waehleQuizfolien(aufgaben ?? [], lernpaare ?? [], t.id)
```

Der Kopfkommentar der Datei („Pro Thema: Titel → …") bleibt korrekt. `aufgabeZu` funktioniert unverändert (nutzt das importierte `alsAufgabe`).

- [ ] **Step 6: Alle Tests + Sichtprüfung**

Run: `npm test` — Expected: PASS.
Preview: `#/wiso/praesentation` öffnen → pro Thema max. 8 Quizfolien („Quizfrage n von ≤8"), Inhaltsfolien wieder prominent.

- [ ] **Step 7: Commit**

```bash
git add src/lib/folien.ts src/pages/Praesentation.tsx tests/folien.test.ts
git commit -m "fix: Präsentation auf max. 8 Quizfolien pro Thema begrenzt, Originale zuerst

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: §-Erkennung als pure Funktion

**Files:**
- Create: `src/lib/paragraphen.ts`
- Test: `tests/paragraphen.test.ts` (neu)

**Interfaces:**
- Produces: `verlinkeParagraphen(text: string): string` — ersetzt erkannte Gesetzesverweise durch Markdown-Links auf gesetze-im-internet.de; alles andere bleibt byte-identisch. Task 7 ruft sie in `Markdown.tsx` auf.

- [ ] **Step 1: Fehlschlagende Tests schreiben** — `tests/paragraphen.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { verlinkeParagraphen } from '../src/lib/paragraphen'

describe('verlinkeParagraphen', () => {
  it('verlinkt einfache §-Verweise', () => {
    expect(verlinkeParagraphen('Kaufvertrag: § 433 BGB regelt die Pflichten.')).toBe(
      'Kaufvertrag: [§ 433 BGB](https://www.gesetze-im-internet.de/bgb/__433.html) regelt die Pflichten.',
    )
  })

  it('verlinkt ohne Leerzeichen nach §', () => {
    expect(verlinkeParagraphen('§433 BGB')).toBe(
      '[§433 BGB](https://www.gesetze-im-internet.de/bgb/__433.html)',
    )
  })

  it('nimmt Abs./Satz/Nr. mit in den Linktext, URL zeigt auf den §', () => {
    expect(verlinkeParagraphen('§ 622 Abs. 2 BGB')).toBe(
      '[§ 622 Abs. 2 BGB](https://www.gesetze-im-internet.de/bgb/__622.html)',
    )
  })

  it('unterstützt Buchstaben-Paragraphen', () => {
    expect(verlinkeParagraphen('§ 312g BGB')).toBe(
      '[§ 312g BGB](https://www.gesetze-im-internet.de/bgb/__312g.html)',
    )
  })

  it('verlinkt §§-Bereiche auf den ersten Paragraphen', () => {
    expect(verlinkeParagraphen('§§ 433 ff. BGB')).toBe(
      '[§§ 433 ff. BGB](https://www.gesetze-im-internet.de/bgb/__433.html)',
    )
  })

  it('verlinkt GG-Artikel', () => {
    expect(verlinkeParagraphen('Art. 14 GG schützt das Eigentum.')).toBe(
      '[Art. 14 GG](https://www.gesetze-im-internet.de/gg/art_14.html) schützt das Eigentum.',
    )
  })

  it('nutzt die Sonder-Slugs der Gesetze', () => {
    expect(verlinkeParagraphen('§ 5 UStG')).toContain('/ustg_1980/__5.html')
    expect(verlinkeParagraphen('§ 14 BBiG')).toContain('/bbig_2005/__14.html')
    expect(verlinkeParagraphen('§ 3 MuSchG')).toContain('/muschg_2018/__3.html')
  })

  it('lässt unbekannte Gesetzeskürzel unangetastet', () => {
    const t = '§ 5 SGB regelt etwas; § 3 XYZG auch.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('lässt § ohne Gesetzeskürzel unangetastet', () => {
    const t = 'Siehe § 12 des Vertrags.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('fasst Codeblöcke und Inline-Code nicht an', () => {
    const t = 'Code: `§ 433 BGB` und\n```\n§ 433 BGB\n```\nfertig.'
    expect(verlinkeParagraphen(t)).toBe(t)
  })

  it('verlinkt bereits verlinkte Verweise nicht doppelt', () => {
    const t = '[§ 433 BGB](https://example.org)'
    expect(verlinkeParagraphen(t)).toBe(t)
  })
})
```

- [ ] **Step 2: Tests laufen lassen** — Run: `npm test -- paragraphen` — Expected: FAIL (Modul existiert nicht).

- [ ] **Step 3: Implementieren** — `src/lib/paragraphen.ts`:

```ts
// Erkennt Gesetzesverweise (§ 433 BGB, Art. 14 GG …) und macht daraus
// Markdown-Links auf gesetze-im-internet.de (amtliche Volltexte).
// Nur bekannte Kürzel werden verlinkt — alles andere bleibt unverändert.

// Kürzel → URL-Slug auf gesetze-im-internet.de (einige Gesetze tragen dort
// Jahres-Suffixe im Pfad; NICHT "vereinfachen").
const GESETZE: Record<string, string> = {
  BGB: 'bgb',
  HGB: 'hgb',
  GG: 'gg',
  KSchG: 'kschg',
  BUrlG: 'burlg',
  BBiG: 'bbig_2005',
  ArbZG: 'arbzg',
  JArbSchG: 'jarbschg',
  MuSchG: 'muschg_2018',
  BetrVG: 'betrvg',
  EntgFG: 'entgfg',
  TzBfG: 'tzbfg',
  UStG: 'ustg_1980',
  GewO: 'gewo',
  ProdHaftG: 'prodhaftg',
  UWG: 'uwg_2004',
  EStG: 'estg',
  AO: 'ao_1977',
}

const KUERZEL = Object.keys(GESETZE).join('|')

// § 433 / §433 / §§ 433 ff. / § 622 Abs. 2 Satz 1 — Nummer + optionale Zusätze,
// dahinter zwingend ein bekanntes Kürzel.
const PARAGRAPH = new RegExp(
  `§§?\\s?(\\d+[a-z]?)((?:\\s(?:Abs\\.\\s?\\d+|Satz\\s?\\d+|S\\.\\s?\\d+|Nr\\.\\s?\\d+|ff?\\.))*)\\s(${KUERZEL})\\b`,
  'g',
)
const ARTIKEL = /Art\.\s?(\d+[a-z]?)((?:\s(?:Abs\.\s?\d+|Satz\s?\d+))*)\sGG\b/g

function verlinkeSegment(text: string): string {
  return text
    .replace(PARAGRAPH, (treffer, nr: string, _zusatz: string, kuerzel: string, pos: number, ganz: string) => {
      // Bereits verlinkte Vorkommen ([…](…)) nicht erneut anfassen.
      if (ganz[pos - 1] === '[') return treffer
      return `[${treffer}](https://www.gesetze-im-internet.de/${GESETZE[kuerzel]}/__${nr}.html)`
    })
    .replace(ARTIKEL, (treffer, nr: string, _zusatz: string, pos: number, ganz: string) => {
      if (ganz[pos - 1] === '[') return treffer
      return `[${treffer}](https://www.gesetze-im-internet.de/gg/art_${nr}.html)`
    })
}

export function verlinkeParagraphen(text: string): string {
  // Codeblöcke (```…```) und Inline-Code (`…`) unangetastet lassen:
  // Text an Code-Grenzen zerlegen, nur die Nicht-Code-Teile ersetzen.
  return text
    .split(/(```[\s\S]*?```|`[^`]*`)/)
    .map((teil, i) => (i % 2 === 1 ? teil : verlinkeSegment(teil)))
    .join('')
}
```

Achtung Replacer-Signatur: Bei zwei Capture-Gruppen im `ARTIKEL`-Muster sind die Parameter `(treffer, g1, g2, pos, ganz)`; beim `PARAGRAPH`-Muster mit drei Gruppen `(treffer, g1, g2, g3, pos, ganz)`. Die obigen Signaturen stimmen damit überein — bei Regex-Änderungen mitziehen.

- [ ] **Step 4: Tests laufen lassen** — Run: `npm test -- paragraphen` — Expected: PASS. Falls der „bereits verlinkt"-Test scheitert: Der Linktext in `[…]` beginnt direkt nach `[` — die `pos - 1`-Prüfung greift nur für den Anfang; reicht für unsere Inhalte, da Links immer mit dem Verweis beginnen.

- [ ] **Step 5: Stichprobe der URLs** (einmalig, kein Test): drei Links im Browser öffnen — `bgb/__433.html`, `gg/art_14.html`, `bbig_2005/__14.html` — alle drei müssen den Gesetzestext zeigen (kein 404).

- [ ] **Step 6: Commit**

```bash
git add src/lib/paragraphen.ts tests/paragraphen.test.ts
git commit -m "feat: §-Erkennung mit Links auf gesetze-im-internet.de (18 Gesetze)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: §-Links in Markdown.tsx aktivieren

**Files:**
- Modify: `src/components/Markdown.tsx`
- Test: `tests/markdown.test.tsx` (neu)

**Interfaces:**
- Consumes: `verlinkeParagraphen` aus Task 6; dark-Klassen aus Task 3 bleiben erhalten.
- Produces: Alle Markdown-Render-Stellen (Lernzettel, Folien, Skripte, Quiz-Erklärungen, Lösungen, Glossar) zeigen anklickbare §-Links (neuer Tab). Kein Konsument muss sich ändern.

- [ ] **Step 1: Fehlschlagenden Test schreiben** — `tests/markdown.test.tsx` (Muster `renderToString` wie `anlagenDiagramm.test.tsx`, Umgebung ist node):

```tsx
import { describe, it, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import Markdown from '../src/components/Markdown'

describe('Markdown mit §-Links', () => {
  it('rendert Gesetzesverweise als externe Links', () => {
    const html = renderToString(<Markdown text="Grundlage ist § 433 BGB." />)
    expect(html).toContain('href="https://www.gesetze-im-internet.de/bgb/__433.html"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('§ 433 BGB')
  })

  it('lässt Text ohne Verweise unverändert', () => {
    const html = renderToString(<Markdown text="Nur normaler Text." />)
    expect(html).not.toContain('gesetze-im-internet.de')
  })
})
```

- [ ] **Step 2: Test laufen lassen** — Run: `npm test -- markdown` — Expected: FAIL (kein `href` auf gesetze-im-internet.de).

- [ ] **Step 3: Markdown.tsx erweitern** (dark-Klassen aus Task 3 beibehalten):

```tsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { verlinkeParagraphen } from '../lib/paragraphen'

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-2 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200 [&_.katex-display]:my-2 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:font-semibold [&_li]:ml-4 [&_ol]:list-decimal [&_strong]:font-semibold [&_table]:w-full [&_table]:text-sm [&_td]:border [&_td]:border-slate-200 dark:[&_td]:border-slate-600 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-200 dark:[&_th]:border-slate-600 [&_th]:bg-slate-50 dark:[&_th]:bg-slate-800 [&_th]:px-2 [&_th]:py-1 [&_ul]:list-disc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Externe Links (v. a. §-Verweise) im neuen Tab; im Druck wie
          // normaler Text, damit Skript-PDFs ruhig bleiben.
          a: ({ node: _n, ...props }) => (
            <a
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-700 underline decoration-dotted underline-offset-2 hover:decoration-solid dark:text-sky-300 print:text-inherit print:no-underline"
            />
          ),
        }}
      >
        {verlinkeParagraphen(text)}
      </ReactMarkdown>
    </div>
  )
}
```

Die `className`-Zeile des `div` entspricht dem Stand nach Task 3 — falls Task 3 bereits ausgeführt wurde, die vorhandene Zeile NICHT erneut ändern, nur `ReactMarkdown` bekommt `components` und den vorverarbeiteten Text.

- [ ] **Step 4: Tests laufen lassen** — Run: `npm test` — Expected: PASS (alle, inkl. neuer).

- [ ] **Step 5: Sichtprüfung im Preview.** `#/kbz` → Thema „Kaufvertrag & Störungen" (Stufe 1): §-Verweise erscheinen als gepunktet unterstrichene Links und öffnen im neuen Tab. Ein Skript (`#/skript/kbz/kaufvertrag-stoerungen`) drucken (Druckvorschau reicht): Links erscheinen als normaler Text.

- [ ] **Step 6: Commit**

```bash
git add src/components/Markdown.tsx tests/markdown.test.tsx
git commit -m "feat: Gesetzesverweise überall anklickbar (Markdown-Vorverarbeitung)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Inhaltsausbau WiSo (11 Themen)

**Files:**
- Modify: `public/data/themen/wiso.json` (nur Feld `lernzettel` je Thema), `content-pipeline/audit-report.md` (Vorbehalte ergänzen)

**Interfaces:**
- Consumes: §-Verlinkung aus Task 6/7 (Verweise im Text werden automatisch zu Links — KEINE manuellen Markdown-Links auf Gesetze schreiben). Geschützte `##`-Titel siehe Global Constraints.
- Produces: 6–8 `##`-Abschnitte pro Thema; Tasks 12/13 bauen daraus PDFs/Bericht.

**Qualitätsmaßstab für JEDEN Abschnitt (gilt auch für Tasks 9–11):**
- Struktur je Abschnitt: kurze Einordnung (1–2 Sätze) → Kernwissen als Liste oder GFM-Tabelle → **ein konkretes, durchgerechnetes Beispiel mit Zahlen** oder Praxisfall → Merksatz (`**Merke:**`).
- Prüfungsrelevanz vor Vollständigkeit: was in den Original-PDFs (Ordner `/media/sf_Prfungsvorbereitung_KBM/<Jahr Saison>/`) wiederholt drankommt, zuerst.
- Rechtsthemen nennen konkrete Paragraphen im Fließtext (z. B. „Kündigungsfristen: § 622 BGB"), nur Gesetze aus der Map in Task 6 verwenden.
- KaTeX für Formeln (`$…$`), GFM-Tabellen für Gegenüberstellungen.
- Keine positionsgebundenen Formulierungen, keine Füllsätze, kein Duplizieren des Glossars.
- Typischer Zielumfang: 2 500–4 500 Zeichen pro Lernzettel (aktuell teils 1 300).

- [ ] **Step 1: Ist-Stand erheben**

```bash
node -e "
const t=JSON.parse(require('fs').readFileSync('public/data/themen/wiso.json','utf8'));
for (const x of t) console.log(x.id.padEnd(40), (x.lernzettel.match(/^## /gm)||[]).length+' Abschnitte', x.lernzettel.length+' Zeichen');"
```

- [ ] **Step 2: Alle 11 Themen ausbauen.** Reihenfolge: dünnste zuerst. Je Thema: bestehende Abschnitte inhaltlich vertiefen (nicht löschen), fehlende Abschnitte ergänzen, bis 6–8 erreicht sind; geschützte Titel wörtlich beibehalten. Fachliche Aussagen gegen die Original-PDF-Aufgaben plausibilisieren; Unsicherheiten (z. B. veralteter Rechtsstand in alten Prüfungen) in `content-pipeline/audit-report.md` unter „Verbesserungsrunde 2" dokumentieren.

- [ ] **Step 3: Tests laufen lassen** — Run: `npm test` — Expected: PASS (Schema-Audit, Registry-Test, Zeichen-Limits des Schemas beachten; bei Schema-Fehler „maxLength" den Abschnitt straffen, nicht das Schema ändern).

- [ ] **Step 4: Stichprobe im Preview** — `#/wiso/praesentation`: neue Abschnitte erscheinen als Folien; §-Links aktiv.

- [ ] **Step 5: Commit**

```bash
git add public/data/themen/wiso.json content-pipeline/audit-report.md
git commit -m "content: WiSo-Lernzettel auf 6-8 gehaltvolle Folien ausgebaut (11 Themen)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: Inhaltsausbau KBZ (6 Themen)

**Files:**
- Modify: `public/data/themen/kbz.json`, `content-pipeline/audit-report.md`

**Interfaces:** wie Task 8 (gleicher Qualitätsmaßstab, gleiche Leitplanken; geschützter Titel hier: „Kaufvertrag und Leistungsstörungen", falls in kbz.json vorhanden — per Grep prüfen).

- [ ] **Step 1: Ist-Stand erheben** (Kommando aus Task 8 Step 1 mit `kbz.json`)
- [ ] **Step 2: Alle 6 Themen ausbauen** (Maßstab aus Task 8; KBZ-Schwerpunkte: Auftragsbearbeitung, Beschaffung, Rechnungsstellung/USt, Zahlungsverkehr, Mahnwesen — §-Verweise v. a. BGB/HGB/UStG)
- [ ] **Step 3: `npm test`** — Expected: PASS
- [ ] **Step 4: Stichprobe** — `#/kbz/praesentation`
- [ ] **Step 5: Commit** — `content: KBZ-Lernzettel ausgebaut (6 Themen)` + Co-Authored-By-Zeile

---

### Task 10: Inhaltsausbau Buchführung (6 Themen)

**Files:**
- Modify: `public/data/themen/buchfuehrung.json`, `content-pipeline/audit-report.md`

**Interfaces:** wie Task 8. BuFü-Besonderheit: jeder Abschnitt mit Rechenweg braucht ein durchgebuchtes Beispiel (Buchungssatz Soll an Haben mit Beträgen); Aufbewahrungsfristen = 8 Jahre (Rechtsstand 2026); §-Verweise v. a. HGB (§§ 238 ff.), AO, UStG.

- [ ] **Step 1: Ist-Stand erheben** (`buchfuehrung.json`)
- [ ] **Step 2: Alle 6 Themen ausbauen**
- [ ] **Step 3: `npm test`** — Expected: PASS
- [ ] **Step 4: Stichprobe** — `#/buchfuehrung/praesentation`
- [ ] **Step 5: Commit** — `content: BuFü-Lernzettel ausgebaut (6 Themen)` + Co-Authored-By-Zeile

---

### Task 11: Inhaltsausbau Mündlich (9 Themen)

**Files:**
- Modify: `public/data/themen/muendlich.json`, `content-pipeline/audit-report.md`

**Interfaces:** wie Task 8. Mündlich-Besonderheit: statt Rechenbeispielen konkrete Formulierungshilfen und Beispiel-Dialoge/Reportauszüge; Quellen sind die Unterlagen in `/media/sf_Prfungsvorbereitung_KBM/Mundlich/`.

- [ ] **Step 1: Ist-Stand erheben** (`muendlich.json`)
- [ ] **Step 2: Alle 9 Themen ausbauen**
- [ ] **Step 3: `npm test`** — Expected: PASS
- [ ] **Step 4: Stichprobe** — `#/muendlich/praesentation`
- [ ] **Step 5: Commit** — `content: Mündlich-Lernzettel ausgebaut (9 Themen)` + Co-Authored-By-Zeile

---

### Task 12: PDFs regenerieren, dist bauen, ZIP packen

**Files:**
- Modify (generiert): `public/downloads/*.pdf`, Medien-Quell-PDFs in `/media/sf_Prfungsvorbereitung_KBM/*-Medien/quell-pdfs/`, `dist/`, `/media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach-dist.zip`

**Interfaces:**
- Consumes: alle vorherigen Tasks (Inhalte final). Zugangscode für Headless-PDF: `KBMap2` (Gate akzeptiert `?code=`).

- [ ] **Step 1: Build + Preview**

```bash
npm run build   # muss fehlerfrei durchlaufen (tsc + vite)
node node_modules/vite/bin/vite.js preview --port 4173 --strictPort &   # falls nicht schon aktiv
```

- [ ] **Step 2: Download-PDFs** — `bash scripts/pdfs.sh KBMap2` (nutzt google-chrome headless gegen den Preview). Expected: alle PDFs in `public/downloads/` neu, keine Fehlermeldung.

- [ ] **Step 3: Medien-Quell-PDFs** — `bash scripts/medien-pdfs.sh KBMap2` (Skript-Inhalte haben sich geändert). Expected: 32 PDFs in den 4 Medien-Ordnern erneuert.

- [ ] **Step 4: dist neu bauen (enthält jetzt die neuen Download-PDFs) + ZIP**

```bash
npm run build
rm -f /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach-dist.zip
cd dist && zip -r /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach-dist.zip . && cd ..
```

Vorher mit `unzip -l` des alten ZIPs (falls noch vorhanden) abgleichen, dass die Struktur identisch ist (Dateien im ZIP-Wurzelverzeichnis, kein `dist/`-Präfix).

- [ ] **Step 5: Tests final** — Run: `npm test` — Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add public/downloads
git commit -m "chore: Download-PDFs regeneriert (Inhaltsausbau + §-Links), dist-ZIP neu

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 13: Update-Bericht (Ordner + gebündeltes PDF)

**Files:**
- Create: `/media/sf_Prfungsvorbereitung_KBM/Update-Bericht-<heutiges Datum>/00-Uebersicht.md` + je eine nummerierte Datei pro Verbesserung (01–04) + `Update-Bericht-<Datum>.pdf`

**Interfaces:**
- Consumes: Ergebnisse aller Tasks (Testzahlen, Umfänge).

- [ ] **Step 1: Nummerierte Markdown-Dateien schreiben.** Muster wie `Update-Bericht-2026-09-15/` (Wunsch → Umgesetzt → So nutzt du es; Zielgruppe Schüler/Kollegen, kein Technik-Jargon): 00-Übersichtstabelle, 01-Darkmode-repariert, 02-Praesentation-ausbalanciert, 03-Gesetzes-Links, 04-Ausfuehrlichere-Folien.

- [ ] **Step 2: Gebündeltes PDF erzeugen** — Desktop-Commander `write_pdf`, alle Kapitel in einer Datei, Seitenumbrüche via `<div style="page-break-before: always;"></div>` (Nutzer-Standard: Berichte IMMER auch als ein PDF).

- [ ] **Step 3: Kein Commit** — der Berichtsordner liegt außerhalb des Repos im Share.

---

### Task 14: Abschluss — Verifikation und Merge

- [ ] **Step 1: Gesamtverifikation** (superpowers:verification-before-completion): `npm test` (alles grün, Zahl notieren), `npm run build` fehlerfrei, Darkmode-Stichprobe (Start + 1 Bereich + Quiz), Präsentations-Stichprobe (max. 8 Quizfolien), §-Link-Stichprobe.
- [ ] **Step 2: Nutzer-Review.** Dem Nutzer Darkmode + neue Folien + §-Links im Preview zeigen (er wollte visuell prüfen); auf sein Okay warten.
- [ ] **Step 3: Merge** via superpowers:finishing-a-development-branch (Merge auf `main`, Push zu GitHub, Branch aufräumen).
