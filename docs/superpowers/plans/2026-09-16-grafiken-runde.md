# Grafiken-Runde — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 15 Aufgaben mit hängenden Grafik-Verweisen reparieren (Anlagen nachtragen) und alle 32 Themen mit einem Übersichtsdiagramm ausstatten, abgesichert durch dauerhafte Tests.

**Architecture:** Anlagen-Daten fließen über das bestehende Staging-Muster in die `aufgaben/*.json` (Felder `anlagenText`/`anlagenDiagramm`, Renderer existieren). Übersichtsdiagramme sind handgebaute SVG-Funktionskomponenten in der `DIAGRAMME`-Registry (`src/components/diagramme.tsx`); alle 5 Konsumenten (Stufe1, UnterrichtSession, Skript, Handout, Praesentation) rendern sie automatisch über `hatDiagramm`/`ThemaDiagramm` — kein Konsument wird angefasst.

**Tech Stack:** Vite 6 + React 18 + TS, SVG-Helfer in diagramme.tsx (B/Pfeil/T/Dia bzw. rough.js RB/RPfeil/Skizze), Vitest (node-env, `renderToString`).

**Spec:** `docs/superpowers/specs/2026-09-16-grafiken-runde-design.md`

## Global Constraints

- Branch `feature/grafiken-runde` von `main` (Task 1 erstellt ihn).
- Testkommando `npm test` (NIEMALS npx vitest). Bestand: 263 Tests, bleiben grün.
- vboxsf: Commits ggf. zweimal versuchen; ZIP nie in-place ersetzen (nach /tmp zippen, dann `mv`).
- Deutsche Bezeichner/Kommentare/UI-Texte. Commit-Messages enden mit `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- Bestehende 12 `DIAGRAMME`-Einträge und `FOLIEN_DIAGRAMME` NICHT ändern.
- Fachliche Treue: Diagramm-Inhalte müssen dem jeweiligen Lernzettel (`public/data/themen/*.json`) entsprechen; Anlagen-Rekonstruktionen müssen den Original-PDFs entsprechen. Wenn eine PDF-Quelle nicht auffindbar ist: aus Aufgabentext+Lösung rekonstruieren und als Vorbehalt in `content-pipeline/audit-report.md` (Abschnitt „Grafiken-Runde") dokumentieren.
- `AnlagenDiagramm`-Feldformen (src/types.ts): organigramm → `knoten: {id, text, unter?, stab?}[]`; schilder → `zeichen: {nr, form: kreis|dreieck|quadrat|rechteck|raute|sechseck, farbe?: gruen|rot|gelb|blau|grau|weiss, innen?, text?}[]`; Pflicht: `typ`, `titel`.

---

### Task 1: Branch + WiSo-Anlagen (4 Organigramme, 2 Schilder-Sets)

**Files:**
- Modify: `public/data/aufgaben/wiso.json` (NUR Feld `anlagenDiagramm` bei 6 Aufgaben ergänzen), `content-pipeline/audit-report.md`

**Interfaces:**
- Produces: `anlagenDiagramm` bei wiso-2019w-a19, wiso-2020s-a19, wiso-2020s-a20, wiso-2022w-a8, wiso-2022w-a28, wiso-2024w-a27. `AufgabenKarte.tsx` rendert das Feld automatisch.

- [ ] **Step 1: Branch** — `git checkout main && git checkout -b feature/grafiken-runde`

- [ ] **Step 2: Quellen lesen.** Organigramme: `Read` mit `pages` auf die WiSo-PDFs der Termine — 2019W: `/media/sf_Prfungsvorbereitung_KBM/2019 Winter/KBM W 19_20 WiSo.pdf`; 2020S: `/media/sf_Prfungsvorbereitung_KBM/2020 Sommer/AP2 WiSo.pdf` (Anlagen ggf. in `Prufung mit Anlagen.pdf`); 2022W: `/media/sf_Prfungsvorbereitung_KBM/2022 Winter/WiSo_W22.pdf`. Sicherheitszeichen 2022W ebd.; 2024W: kein WiSo-PDF im Share (bekannte Lücke) → Zeichen aus Aufgabentext+Lösung rekonstruieren („Grün/Weiß" = Rettungszeichen), Vorbehalt dokumentieren. Die betroffenen Aufgabentexte+Lösungen in wiso.json nennen die Stellen/Personen — sie MÜSSEN zum rekonstruierten Organigramm passen (z. B. wiso-2019w-a19: „Herr Fischer (Stelle Organisation/IT)").

- [ ] **Step 3: `anlagenDiagramm` je Aufgabe eintragen** (2020s-a19 und 2020s-a20 teilen dasselbe Organigramm-Objekt inhaltlich — als identische Kopie eintragen, Format-Beispiel organigramm):

```json
"anlagenDiagramm": {
  "typ": "organigramm",
  "titel": "Organigramm der Jana Loft KG (Anlage)",
  "quelle": "Rekonstruiert nach Original-Anlage 2019 Winter",
  "knoten": [
    { "id": "gl", "text": "Geschäftsleitung" },
    { "id": "orgit", "text": "Organisation/IT\nHerr Fischer", "unter": "gl" },
    { "id": "assist", "text": "Assistenz", "unter": "gl", "stab": true }
  ]
}
```

Schilder-Beispiel (Struktur; Inhalte gemäß PDF/Lösung):

```json
"anlagenDiagramm": {
  "typ": "schilder",
  "titel": "Sicherheitszeichen (Anlage)",
  "zeichen": [
    { "nr": "1", "form": "quadrat", "farbe": "gruen", "innen": "→🚪", "text": "" },
    { "nr": "2", "form": "kreis", "farbe": "blau", "innen": "👓" }
  ]
}
```

- [ ] **Step 4: Validieren** — `node -e "JSON.parse(require('fs').readFileSync('public/data/aufgaben/wiso.json','utf8'))"` und `npm test` (Schema-Audit muss grün bleiben). Danach Render-Probe: `npm test -- anlagenDiagramm` (bestehende Render-Tests decken organigramm/schilder ab).

- [ ] **Step 5: audit-report.md** — Abschnitt „## Grafiken-Runde (2026-09-17)" anlegen: je Aufgabe Quelle (PDF-Seite) oder Rekonstruktions-Vorbehalt.

- [ ] **Step 6: Commit** — `git add public/data/aufgaben/wiso.json content-pipeline/audit-report.md && git commit -m "content: fehlende Organigramm-/Schilder-Anlagen für 6 WiSo-Aufgaben"` (+ Co-Authored-By-Zeile).

---

### Task 2: 2025W-Belege als anlagenText (9 Aufgaben KBZ/BuFü)

**Files:**
- Modify: `public/data/aufgaben/kbz.json` (kbz-2025w-a4-3, a4-7, a4-8, a4-10, a4-11), `public/data/aufgaben/buchfuehrung.json` (bufu-2025w-a7, a8, a10, a11), `content-pipeline/audit-report.md`

**Interfaces:**
- Produces: Feld `anlagenText` (Markdown) bei den 9 Aufgaben. Identische Belege wortgleich teilen: Beleg 2 (Heizungsbau Meier) → kbz-a4-7 + bufu-a7; Beleg 3 (Stadtwerke) → kbz-a4-8 + bufu-a8; Beleg 4 (Kfz-Kennzeichen) → kbz-a4-10 + bufu-a10; Belege 3+4 → kbz-a4-11 + bufu-a11; fehlerhafte Eingangsrechnung Wüland → kbz-a4-3.

- [ ] **Step 1: Quelle lesen** — `/media/sf_Prfungsvorbereitung_KBM/2025 Winter/2025 Winter KBZ.pdf` (Anlagenteil; `Read` mit `pages`). Beträge mit den Lösungen der Aufgaben quervergleichen (z. B. bufu-2025w-a6 nennt Beleg 1 Brutto 2.681,78 € — die Belegdaten müssen die Lösungsbeträge exakt stützen).

- [ ] **Step 2: anlagenText als Markdown-Beleg eintragen** — GFM-Tabellen-Stil wie bestehende `anlagenText`-Einträge (per `grep -m3 anlagenText public/data/aufgaben/kbz.json` ein Bestandsmuster ansehen und übernehmen). Beispielstruktur:

```markdown
**Beleg Nr. 2 — Heizungsbau Meier GmbH, Rechnung Nr. 2025-4711 vom 21.11.2025**

| Pos. | Bezeichnung | Betrag |
|---|---|---|
| 1 | Wartung Heizungsanlage | 480,00 € |
| 2 | … (gemäß PDF) | … |
| | Umsatzsteuer 19 % | … |
| | **Rechnungsbetrag** | **…** |
```

- [ ] **Step 3: Validieren** — JSON-Parse beider Dateien + `npm test`. Stichprobe: Lösungsbeträge der 9 Aufgaben rechnerisch gegen die Belegdaten prüfen (kaufmännisch runden!).

- [ ] **Step 4: audit-report.md** ergänzen (Belegquelle je Aufgabe, PDF-Seite).

- [ ] **Step 5: Commit** — `content: 2025W-Belege als anlagenText nachgetragen (9 Aufgaben)` (+ Co-Authored-By).

---

### Task 3: Dauerhafter Audit-Test für Grafik-Verweise

**Files:**
- Test: `tests/anlagenVerweise.test.ts` (neu)

**Interfaces:**
- Consumes: Tasks 1–2 (Daten vollständig — sonst schlägt der Scan fehl und benennt die Lücken).

- [ ] **Step 1: Test schreiben:**

```ts
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
```

- [ ] **Step 2: Laufen lassen** — `npm test -- anlagenVerweise`. Expected: PASS. Falls FAIL: Die Fehlermeldung listet echte Rest-Lücken (→ zurück zu Task 1/2-Daten) ODER falsche Treffer (Maschinen-„Anlage" o. Ä.) → nach Einzelprüfung in `AUSNAHMEN` mit Begründungskommentar aufnehmen. Erwartete Ausnahmen-Kandidaten aus dem Audit: Texte mit „Sortieranlage"/„Beleuchtungsanlage" matchen NICHT (Muster verlangt Verweisformen) — Ausnahmen also voraussichtlich leer.

- [ ] **Step 3: Full `npm test`** — Expected: PASS (263 + 2).

- [ ] **Step 4: Commit** — `test: Audit erzwingt Anlage bei Grafik-Verweisen` (+ Co-Authored-By).

---

### Task 4: Übersichtsdiagramme WiSo (8 Themen) + Render-Test

**Files:**
- Modify: `src/components/diagramme.tsx` (neue Komponenten + `DIAGRAMME`-Einträge)
- Test: `tests/diagramme.test.tsx` (neu)

**Interfaces:**
- Produces: `DIAGRAMME['<themaId>']` für produktionsfaktoren-unternehmensziele, rechtsformen-vollmachten, finanzierung-kreditsicherung, arbeitsschutz-umwelt, datenschutz-digitales-arbeiten, prozesse-epk, unternehmensorganisation, projektmanagement. Render-Test, den Tasks 5–6 wiederverwenden (testet ALLE Registry-Einträge generisch).

**Bau-Muster (verbindlich):** Jedes Diagramm ist `const Name = () => (<Dia titel="…" viewBox="0 0 960 340">…</Dia>)` mit den vorhandenen Helfern: `B({x,y,w,h,t,f?,fs?})` = Kasten mit Text (\n = Zeilen), `Pfeil({x1,y1,x2,y2,dash?})`, `T({x,y,t,fs?,anchor?})` = freier Text. Bestehende Beispiele in der Datei ab Zeile ~81 (`Kaufvertrag`, `Konjunktur` …) als Vorlage lesen. Qualität: max. ~7 Kästen, Schrift ≥ 13, deutsche Begriffe exakt wie im Lernzettel des Themas, viewBox-Breite 960. Inhalts-Ideen (Spec-Tabelle, anpassbar an Lernzettel): Zielbeziehungs-Dreieck; Vollmachten-Stufen; Finanzierungsarten-Baum; Schilder-Farblogik; DSGVO-Rollen; **Mini-EPK (Ereignis→Funktion→XOR — Session 9!)**; Einlinien-/Stabliniensystem nebeneinander; Projektphasen-Pfeil.

- [ ] **Step 1: Fehlschlagenden Render-Test schreiben** — `tests/diagramme.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import { DIAGRAMME } from '../src/components/diagramme'

// Jedes Übersichtsdiagramm muss serverseitig fehlerfrei rendern und echte
// SVG-Ausgabe erzeugen (fängt Laufzeitfehler in den Zeichenfunktionen).
describe('DIAGRAMME rendern', () => {
  for (const [themaId, D] of Object.entries(DIAGRAMME)) {
    it(`${themaId} rendert SVG`, () => {
      const html = renderToString(<>{D()}</>)
      expect(html).toContain('<svg')
      expect(html.length).toBeGreaterThan(300)
    })
  }
})

describe('WiSo-Abdeckung', () => {
  for (const id of [
    'produktionsfaktoren-unternehmensziele', 'rechtsformen-vollmachten',
    'finanzierung-kreditsicherung', 'arbeitsschutz-umwelt',
    'datenschutz-digitales-arbeiten', 'prozesse-epk',
    'unternehmensorganisation', 'projektmanagement',
  ]) {
    it(`${id} hat ein Diagramm`, () => expect(DIAGRAMME[id]).toBeDefined())
  }
})
```

- [ ] **Step 2: RED** — `npm test -- diagramme.test` → 8 Abdeckungs-Tests schlagen fehl.
- [ ] **Step 3: 8 Komponenten bauen + in `DIAGRAMME` registrieren** (vor jedem Diagramm den Lernzettel des Themas lesen: `node -e` auf themen/wiso.json; Begriffe daraus verwenden).
- [ ] **Step 4: GREEN** — `npm test -- diagramme.test`, dann full `npm test`.
- [ ] **Step 5: Sichtprüfung** — `npm run build`, Preview starten, `#/wiso/stufe1/prozesse-epk` u. a. screenshoten (Playwright-MCP) und JEDEN Screenshot per Read ansehen: Text lesbar? Nichts überlappt? Nachbessern bis sauber.
- [ ] **Step 6: Commit** — `feat: Übersichtsdiagramme für 8 WiSo-Themen (u. a. EPK/Session 9)` (+ Co-Authored-By).

---

### Task 5: Übersichtsdiagramme KBZ + BuFü (4 Themen)

**Files:** Modify: `src/components/diagramme.tsx`; Test: `tests/diagramme.test.tsx` (Abdeckungsblock ergänzen)

**Interfaces:** wie Task 4 — Einträge für kundenkommunikation (Beschwerde-Eskalationstreppe), personalwirtschaft (Personalprozess-Kette), stueckkosten-kostenrechnung (Fixkostendegression-Kurve — Kurven per `Pfeil`/`T` oder rough-`Skizze`-Helfer, siehe `BreakEven` als Vorlage), normalkosten-kostenabweichung (Über-/Unterdeckung-Balken).

- [ ] **Step 1:** Abdeckungsblock `describe('KBZ/BuFü-Abdeckung')` mit den 4 ids in tests/diagramme.test.tsx anhängen (Muster aus Task 4) → RED
- [ ] **Step 2:** 4 Komponenten bauen (Lernzettel lesen!), registrieren → GREEN, full `npm test`
- [ ] **Step 3:** Sichtprüfung wie Task 4 Step 5 (`#/kbz/stufe1/kundenkommunikation` …)
- [ ] **Step 4:** Commit — `feat: Übersichtsdiagramme KBZ/BuFü (4 Themen)` (+ Co-Authored-By)

---

### Task 6: Übersichtsdiagramme Mündlich (8 Themen)

**Files:** Modify: `src/components/diagramme.tsx`; Test: `tests/diagramme.test.tsx`

**Interfaces:** wie Task 4 — report-schreiben (Report-Aufbau), gespraechstechnik (Gesprächsphasen), wq-auftragssteuerung, wq-kmu, wq-einkauf-logistik, wq-marketing-vertrieb, wq-personalwirtschaft, wq-assistenz-sekretariat (je Kernprozess-Schaubild aus dem Lernzettel).

- [ ] **Step 1:** Abdeckungsblock (8 ids) → RED
- [ ] **Step 2:** 8 Komponenten bauen, registrieren → GREEN, full `npm test`
- [ ] **Step 3:** Sichtprüfung (`#/muendlich/stufe1/report-schreiben` …)
- [ ] **Step 4:** Commit — `feat: Übersichtsdiagramme Mündlich (8 Themen)` (+ Co-Authored-By)

---

### Task 7: Vollständigkeits-Garantie (nie wieder Thema ohne Diagramm)

**Files:** Test: `tests/diagramme.test.tsx` (Block ergänzen)

- [ ] **Step 1: Test anhängen:**

```tsx
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

describe('Vollständigkeit', () => {
  it('JEDES Thema hat ein Übersichtsdiagramm', () => {
    const fehlend: string[] = []
    for (const b of ['wiso', 'kbz', 'buchfuehrung', 'muendlich']) {
      const themen = JSON.parse(
        readFileSync(join(__dirname, '..', 'public', 'data', 'themen', `${b}.json`), 'utf8'),
      )
      for (const t of themen) if (!DIAGRAMME[t.id]) fehlend.push(`${b}/${t.id}`)
    }
    expect(fehlend, `Themen ohne Diagramm: ${fehlend.join(', ')}`).toEqual([])
  })
})
```

- [ ] **Step 2:** `npm test -- diagramme.test` → PASS (Tasks 4–6 komplett), full `npm test` → PASS
- [ ] **Step 3:** Commit — `test: Vollständigkeits-Garantie — jedes Thema hat ein Übersichtsdiagramm` (+ Co-Authored-By)

---

### Task 8: PDFs, dist, ZIP

**Files (generiert):** `public/downloads/*.pdf`, Medien-Quell-PDFs, `dist/`, Share-ZIP

- [ ] **Step 1:** Alten Preview stoppen (`pkill -f "vite.js preview"`), `npm run build`, Preview neu starten (Port 4173)
- [ ] **Step 2:** `bash scripts/pdfs.sh KBMap2` (41 PDFs, Datum prüfen) und `bash scripts/medien-pdfs.sh KBMap2` (32 PDFs)
- [ ] **Step 3:** `npm run build` erneut (dist mit neuen Download-PDFs), ZIP über /tmp: `cd dist && zip -qr /tmp/kbm-dist-neu.zip . && cd .. && mv -f /tmp/kbm-dist-neu.zip /media/sf_Prfungsvorbereitung_KBM/kbm-pruefungscoach-dist.zip`; `unzip -l | head` → index.html im Root
- [ ] **Step 4:** `npm test` grün; VOR dem Commit `git status` prüfen (Chrome-PDF-Race: nachgeschriebene Dateien mit committen)
- [ ] **Step 5:** Commit — `chore: PDFs regeneriert (Anlagen + 20 neue Diagramme), dist-ZIP neu` (+ Co-Authored-By); Preview laufen lassen

---

### Task 9: Update-Bericht (Ordner + gebündeltes PDF)

- [ ] **Step 1:** Ordner `/media/sf_Prfungsvorbereitung_KBM/Update-Bericht-<heutiges Datum>/`: `00-Uebersicht.md` (Statustabelle, Testzahl) + `01-Reparierte-Aufgaben.md` (15 Aufgaben wieder lösbar — Organigramme, Sicherheitszeichen, 2025W-Belege) + `02-Diagramme-ueberall.md` (alle 32 Themen mit Übersichtsgrafik, Hinweis Session 9). Stil wie `Update-Bericht-2026-09-16/` (Wunsch → Umgesetzt → So nutzt du es, Du-Form, kein Jargon).
- [ ] **Step 2:** Gebündeltes PDF via Desktop-Commander `write_pdf` (ToolSearch: `select:mcp__plugin_desktop-commander_desktop-commander__write_pdf`), Seitenumbrüche `<div style="page-break-before: always;"></div>`. Kein Commit (außerhalb des Repos).

---

### Task 10: Abschluss — Verifikation, Nutzer-Review, Merge

- [ ] **Step 1:** Gesamtverifikation: `npm test` (Zahl notieren), `npm run build` fehlerfrei, Screenshot-Stichprobe Session 9 (`#/wiso/unterricht` → Session 9) + 2 weitere neue Diagramme + 1 reparierte Aufgabe (wiso-2022w-a8 in Stufe 2 unternehmensorganisation)
- [ ] **Step 2:** Nutzer-Review abwarten (visueller Durchklick)
- [ ] **Step 3:** Merge via superpowers:finishing-a-development-branch (vorher `git status` — PDF-Race!), Push, ZIP-Hinweis
