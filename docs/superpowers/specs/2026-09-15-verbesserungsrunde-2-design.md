# Verbesserungsrunde 2 — Darkmode-Fix, Präsentations-Balance, §-Verlinkung, Inhaltsausbau

**Datum:** 2026-09-15 · **Status:** vom Nutzer freigegeben (Chat) · **Branch:** `feature/verbesserungsrunde-2`

## Anlass

Nutzer-Feedback nach der Verbesserungsrunde vom 11.09.:

1. **Darkmode:** „alles nicht erkennbar" — auf Start- und Bereichsseiten sind Kachel-Titel im Darkmode unsichtbar (weiße Schrift auf hellem Pastellgrund).
2. **Präsentation:** Nur die Quizfolien sind mehr geworden, die Inhaltserklärungen nicht. WiSo-Präsentationen bestehen zu 95 % aus Quizfolien (772 Quiz vs. 40 Inhaltsfolien), weil Paket H *alle* Aufgaben **und alle Lernpaare** als Folien aufnimmt.
3. **Neu gewünscht:** Gesetzesverweise (§ …) sollen direkt verlinkt sein, damit man den Paragraphen bei Bedarf nachlesen kann.
4. **Entscheidung des Nutzers:** Quizfolien auf 6–8 pro Thema begrenzen (empfohlene Option) **und** Inhaltsfolien in allen 4 Bereichen ausbauen.

## Root-Cause-Befunde (verifiziert)

- **Darkmode:** `src/lib/farben.ts` definiert die 5 Farbsets (sky, emerald, amber, violet, rose → Felder `kachel`, `balken`, `akzentText`, `chip`, `button`) ausschließlich mit hellen Klassen (`bg-sky-50`, `bg-amber-100` …) **ohne `dark:`-Varianten**. Konsumenten (`BereichKachel.tsx`, `Bereich.tsx`, `Quiz.tsx`, `Unterricht.tsx`) haben im Darkmode-Sweep `dark:text-slate-100` u. Ä. erhalten → weiße Schrift auf hellem Grund. Per Playwright-Screenshot auf Start- und WiSo-Bereichsseite reproduziert.
- **Präsentation:** `Praesentation.tsx` (Paket H, Commit 568b010) hängt pro Thema *alle* MC-/Zuordnungs-Aufgaben **plus alle Lernpaare** als Quizfolien an. Inhaltsfolien (aus `folienAusThema`, `lib/folien.ts`) sind unverändert vorhanden, gehen aber unter. Quiz-Anteile: WiSo 95 %, KBZ 93 %, BuFü 85 %, Mündlich 77 %.

## Paket A — Darkmode reparieren

**Änderung `src/lib/farben.ts`:** Jedes Feld jedes Farbsets erhält `dark:`-Varianten, z. B. für sky:

- `kachel`: `border-sky-200 bg-sky-50 hover:border-sky-400 dark:border-sky-800 dark:bg-sky-950/50 dark:hover:border-sky-500`
- `akzentText`: `text-sky-700 dark:text-sky-300`
- `chip`: `bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200`
- `balken`: unverändert (`bg-sky-500` ist auf dunkler Spur sichtbar)
- `button`: unverändert (gesättigte 600er-Töne funktionieren im Darkmode)

Analog für emerald, amber, violet, rose.

**Visueller Sweep:** Nach dem Fix alle Hauptrouten im Darkmode per Playwright screenshoten und prüfen: Start, alle 4 Bereichsseiten, Themen-Quiz, Unterricht/Session, Lernstand, Glossar (beide Tabs), Rechnen (Kapitel + Aufgabe), Simulation, Karteikarten, Suche. Jede weitere Fundstelle mit hellem Hintergrund + hellem Text wird gefixt (gleiches Muster: `dark:`-Variante ergänzen). Druckrouten und Präsentation bleiben bewusst hell (bestehendes Verhalten).

**Regressionsschutz:** Neuer Test `tests/farben.test.ts`: Für jedes Farbset gilt — enthält ein Feld eine helle Hintergrundklasse (`bg-*-50`, `bg-*-100`) oder helle Textklasse (`text-*-700`, `text-*-800`), muss dasselbe Feld eine `dark:`-Variante enthalten.

## Paket B — Präsentation ausbalancieren

**Änderung `Praesentation.tsx`:** Quizfolien pro Thema auf **maximal 8** begrenzen:

1. Original-/abgeleitete Aufgaben (MC + Zuordnung) stabil nach id sortiert zuerst,
2. mit Lernpaaren (stabil nach id) aufgefüllt, bis 8 erreicht sind.

Keine Zufallsauswahl (Beamer-Einsatz muss reproduzierbar sein). Das vollständige Fragenset bleibt im Themen-Quiz erreichbar. `tests/folien.test.ts` wird auf die Obergrenze angepasst (Thema mit >8 Fragen → genau 8 Folien; Original-Aufgaben haben Vorrang).

## Paket C — §-Verlinkung

**Neues Modul `src/lib/paragraphen.ts`:** erkennt Gesetzesverweise in Text und liefert URL auf **gesetze-im-internet.de** (amtliche Quelle):

- Muster: `§ 433 BGB`, `§433 BGB`, `§ 622 Abs. 2 BGB`, `§§ 433 ff. BGB` (Link auf ersten §), `Art. 14 GG`.
- URL-Schema: `https://www.gesetze-im-internet.de/<gesetz>/__<nr>.html` (z. B. `bgb/__433.html`); GG-Artikel: `gg/art_14.html`. Buchstaben-Paragraphen wie `§ 312g` werden unterstützt (`__312g.html`).
- Gesetzes-Map (nur bekannte Kürzel werden verlinkt): BGB, HGB, GG, KSchG, BUrlG, BBiG, ArbZG, JArbSchG, MuSchG, BetrVG, EntgFG, TzBfG, UStG, GewO, ProdHaftG, UWG, EStG, AO. Unbekannte Kürzel (auch SGB-Verweise, deren Buch sich aus dem Text nicht sicher ergibt): Text bleibt unverändert.
- Abs./Satz/Nr.-Zusätze bleiben im Linktext, die URL zeigt auf die §-Seite.

**Integration in `src/components/Markdown.tsx`:** Vorverarbeitungsschritt wandelt erkannte Verweise in Markdown-Links um (nur in normalem Text, nicht in Codeblöcken/bestehenden Links). Damit wirkt die Verlinkung überall, wo Markdown gerendert wird: Lernzettel, Folien, Skripte, Quiz-Erklärungen, Aufgaben-Lösungen, Glossar. Links öffnen mit `target="_blank" rel="noopener"`; in Druckrouten (`print:`) werden sie als normaler Text gestylt (keine URL-Anzeige).

**Tests `tests/paragraphen.test.ts`:** Erkennungsmuster (mit/ohne Leerzeichen, Abs./Satz, §§, Art., Buchstaben-§), bekannte vs. unbekannte Kürzel, keine Ersetzung in Codeblöcken/Links.

## Paket D — Inhaltsfolien aller 4 Bereiche ausbauen

**Ziel:** Lernzettel aller 32 Themen (wiso 11, kbz 6, buchfuehrung 6, muendlich 9) auf **6–8 gehaltvolle `##`-Folien** heben. Ausbau bedeutet: Schritt-für-Schritt-Erklärungen, durchgerechnete Beispiele mit Zahlen, Merksätze, typische Prüfungsfallen — kein Aufblähen mit Fülltext.

**Leitplanken:**

- `##`-Struktur bleibt das Folienformat (`lib/folien.ts` unverändert); KaTeX und GFM-Tabellen dürfen genutzt werden.
- Fachliche Absicherung gegen die Original-Prüfungs-PDFs im Share (gleiches Audit-Vorgehen wie bei der Extraktion); Unsicherheiten werden in `content-pipeline/audit-report.md` vermerkt.
- Rechtsstand 2026 beachten (z. B. Aufbewahrungsfristen 8 Jahre); Rechtsthemen erhalten konkrete §-Verweise, die Paket C automatisch verlinkt.
- `FOLIEN_DIAGRAMME`-Registry (`diagramme.tsx`): Schlüssel ist der exakte `##`-Titel — bestehende Titel mit registriertem Diagramm dürfen nicht umbenannt werden. Neuer Test: Jeder Registry-Schlüssel muss weiterhin als `##`-Überschrift in einem Lernzettel vorkommen.
- Schema-/Audit-Tests (`content.schema.json`, Vitest) müssen weiter bestehen.

**Abschlussarbeiten:** Download-PDFs regenerieren (`bash scripts/pdfs.sh <CODE>` bei laufendem Preview), Medien-Quell-PDFs neu erzeugen (`scripts/medien-pdfs.sh`, da Skript-Inhalte sich ändern), dist neu bauen, `kbm-pruefungscoach-dist.zip` neu packen.

## Abschluss der Runde

- Alle Tests grün (Bestand: 218 + neue).
- Update-Bericht als nummerierter Ordner **plus gebündeltes PDF** im Share (`Update-Bericht-<Datum>/`), Muster wie `Update-Bericht-2026-09-15/`.
- Merge auf `main` nach Nutzer-Review, Push zu GitHub.

## Nicht in dieser Runde (YAGNI)

- Keine Änderung an Quiz-/Leitner-Logik, Simulation, Rechnen, Backend.
- Keine SGB-Buch-Auflösung oder Verlinkung juristischer Sekundärquellen.
- Kein Medien-Einbau (`medien`-Feld) — bleibt eigene Runde.

## Teststrategie (Zusammenfassung)

| Paket | Tests |
|-------|-------|
| A | `tests/farben.test.ts` (dark-Variante erzwungen) + Playwright-Sichtprüfung aller Hauptrouten |
| B | `tests/folien.test.ts` (Obergrenze 8, Original-Vorrang, stabile Reihenfolge) |
| C | `tests/paragraphen.test.ts` (Muster, Map, Negativfälle) |
| D | bestehende Schema-/Audit-/Registry-Tests + PDF-Regeneration |
