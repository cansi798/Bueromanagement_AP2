# Verbesserungsrunde 2026-09-11 — Design

**Quelle:** `verbesserung.txt` (9 Punkte der Lehrkraft), Rückfragen am 2026-09-11 geklärt.

## Ziel

Acht Arbeitspakete (A–H), die bestehende Flows der App verbessern: Glossar-Lücken,
Fehler-Wiederholen im Quiz, Freitext-Selbstabgleich, vollständiger Lernstand mit
sortierbarer Themen-Übersicht, Zuordnungs-Überarbeitung (Inhalt + UI), ehrliche
Simulations-Zwischenstände, Darkmode und ausgebaute Präsentationen.

**Nicht-Ziele:**

- Keine neue Datenbank / kein Ausbau des PHP-Backends. Daten bleiben in
  localStorage (`kbm.v1.*`) und laufen über den bestehenden Server-Sync
  (`sync.ts`) mit — neue Keys müssen lediglich vom Sync miterfasst werden.
- Keine KI-Bewertung für den Freitext-Modus (bewusst Selbstabgleich; die
  WebLLM-Bewertung bleibt exklusiv in der Simulation).
- Kein Umbau des Leitner-Kernalgorithmus (`leitner.ts`) — nur additive Felder.

## Paket A — Glossar-Begriffe

„Geschäftsklima" und „Stabsstelleninhaber" fehlen in `public/data/glossar.json`.

- Beide Begriffe mit fachlich korrekter Definition ergänzen (Geschäftsklima →
  Bereich wiso; Stabsstelleninhaber → Bereich kbz, Querverweis Organigramm/
  Stabsstelle).
- Audit-Test ergänzt, der die Existenz beider Einträge prüft.

## Paket B — Fehler-Wiederholen-Modus im Quiz

Heute zeigt `Quiz.tsx` nur „fällige" Karten nach Leitner-Datum; einen Modus
„nur zuletzt falsch beantwortete" gibt es nicht.

- Leitner-Eintrag pro Karte (Storage `kbm.v1.lernpaare`) bekommt ein optionales
  Feld `letzteAntwortFalsch: boolean` (rückwärtskompatibel; fehlend = unbekannt).
- Neuer Rundenmodus „Falsche wiederholen" auf der Quiz-Seite: nimmt alle Karten
  des Bereichs mit `letzteAntwortFalsch === true`, unabhängig von Fälligkeit.
- Filterbar nach Thema (bestehende Themen-Auswahl wiederverwenden); Anzeige der
  Anzahl falscher Karten pro Thema im Auswahlmenü.
- Richtige Antwort im Fehler-Modus setzt das Flag zurück und wertet normal über
  Leitner (kein doppeltes Vorrücken).

## Paket C — Freitext-Selbstabgleich auf Karteikarten

Lernpaare kennen nur MC und Zuordnung; Freitext existiert nur in der Simulation.

- Auf `LernpaarKarte` ein Umschalter „Selbst formulieren": statt der MC-Optionen
  ein Textfeld. Die Einstellung wird in einem eigenen Key `kbm.v1.quizmodus`
  gemerkt und gilt, bis sie wieder umgeschaltet wird.
- Nach dem Abschicken: eigene Antwort und Musterlösung (die korrekte(n)
  Option(en) + Erklärung) nebeneinander, darunter Selbstbewertung
  „gewusst / teilweise / nicht gewusst".
- Leitner-Wirkung: gewusst = wie richtig; teilweise = Stufe halten (Fälligkeit
  neu setzen, Box unverändert); nicht gewusst = wie falsch (Box 1, Flag aus
  Paket B setzen).
- Zuordnungs-Lernpaare sind vom Freitext-Modus ausgenommen (Ziffern-Logik bleibt).

## Paket D — Themen-Training erfassen + Themen-Übersicht im Lernstand

Kernpaket; liefert die Datengrundlage, auf der B und die Übersicht aufsetzen.

**D1 — Themen-Training protokollieren:** Der Unterrichts-Stepper schreibt heute
keinen Fortschritt. `progress.ts` bekommt ein Feld (z. B.
`unterricht: { [themaId]: { abgeschlossen: string /* ISO-Datum */ } }`), das beim
Abschluss des Steppers gesetzt wird. Der Lernstand zeigt „Themen-Training:
X von Y Themen abgeschlossen" je Bereich.

**D2 — Sortierbare Themen-Tabelle:** Neuer Block im Lernstand: eine Tabelle
über alle Themen aller Bereiche mit den Spalten Bereich, Thema, geübt (Anzahl),
richtig, falsch, Quote, zuletzt geübt. Datenquellen: Quiz/Lernpaare
(`kbm.v1.lernpaare`), Aufgaben-Statistik, Rechnen (`kbm.v1.rechnen`),
Themen-Training (D1). Bedienung:

- Sortierbar per Klick auf Spaltenkopf (Quote, zuletzt geübt, Bereich, geübt).
- Filter: Bereich-Auswahl + Schalter „Gekonntes ausblenden" (Quote ≥ 80 % und
  mindestens 5 Übungen).
- Keine neue Persistenz nötig; die Tabelle aggregiert zur Laufzeit.

## Paket E — Zuordnungsaufgaben (Inhalt, Bedienung, Anzeige)

**E1 — Inhalts-Audit:** Alle 64 Zuordnungs-Aufgaben (`public/data/aufgaben/`)
und alle Zuordnungs-Lernpaare gegen die Original-Lösungen (PDF-Quellen) prüfen;
Fehler korrigieren, Befunde wie üblich in `content-pipeline/audit-report.md`.
Korrekturen laufen über das Staging-Muster der Content-Pipeline.

**E2 — Bedienung:** Statt freiem Ziffern-Tippen pro Zeile eine Auswahl aus der
Legende (Tap-Buttons bzw. Dropdown bei vielen Optionen) in `ZuordnungFelder`.
Jede Zeile zeigt die gewählte Ziffer + Kurztext der gewählten Option; Auswahl
jederzeit änderbar bis zur Abgabe. Wertungslogik (`zuordnung.ts`) unverändert.

**E3 — Anzeige:** Legende bleibt neben/über den Zuordnungszeilen dauerhaft
sichtbar (auf Mobile als aufklappbarer, initial offener Block), statt nur
einmal oben im Aufgabentext.

## Paket F — Simulation: ehrlicher Zwischenstand

Direkt nach Abgabe zählt das Ergebnis nur die MC-Punkte; offene Aufgaben sind
noch unbewertet — das wirkt wie eine falsche Note.

- Ergebniskarte nach Abgabe umbauen: „Zwischenstand: X von Y Punkten aus den
  Auswahlaufgaben — Z Punkte aus offenen Aufgaben noch unbewertet."
- Note und Gesamtprozent erscheinen erst, wenn alle offenen Aufgaben bewertet
  sind (Selbstbewertung oder KI); vorher stattdessen Hinweis + Zähler der noch
  unbewerteten Aufgaben.
- Berechnungslogik selbst bleibt unverändert (sie war korrekt, nur die
  Präsentation war irreführend).

## Paket G — Darkmode

Aktuell existiert kein Darkmode; Farben sind hartcodiert (`bg-white`,
`bg-slate-100` …).

- Tailwind-Darkmode per `class`-Strategie (`dark` auf `<html>`).
- Theme-Umschalter im Layout-Header: Hell / Dunkel / System; Persistenz in
  `kbm.v1.theme`; „System" folgt `prefers-color-scheme` live.
- `dark:`-Varianten flächendeckend über Layout, Kacheln, Karten, Quiz,
  Simulation, Lernstand, Glossar, Präsentation, Rechnen. Diagramme
  (Rough.js/AnlagenDiagramm) und KaTeX auf Lesbarkeit im Dunkeln prüfen
  (ggf. Strichfarbe aus Theme ableiten).
- Druck-/PDF-Routen (`#/skript`, `#/nachschlagewerk`) rendern immer hell
  (Druckqualität), unabhängig vom Theme.

## Paket H — Präsentationen ausbauen

Folien entstehen aus Lernzettel-`##`-Abschnitten + maximal 3 MC-Fragen je Thema.

- Fragen-Folien: statt fix 3 alle passenden MC-/Zuordnungs-Fragen des Themas
  als Folien anhängen, mit Navigations-Hinweis „Frage i/n"; Reihenfolge stabil
  (kein Zufall im Beamer-Einsatz).
- Bestandsprüfung: je Bereich abgleichen, ob jedes Thema Folien liefert und ob
  die `FOLIEN_DIAGRAMME`-Registry-Schlüssel noch zu den `##`-Titeln passen;
  Lücken in Lernzetteln ergänzen.
- Danach Download-PDFs regenerieren (`bash scripts/pdfs.sh <CODE>`).

## Reihenfolge

A (trivial) → D (Datengrundlage) → B → C → E → F → H → G (Darkmode zuletzt,
da flächendeckende Klassenänderungen sonst Merge-Rauschen in alle anderen
Pakete tragen).

## Testing

- Bestehende Tests (~140) bleiben grün.
- Neue Audit-Tests: Glossar-Begriffe (A), Zuordnungs-Datenkorrekturen (E1).
- Neue Unit-/Render-Tests: Fehler-Modus-Auswahllogik (B), Freitext-Karte inkl.
  Leitner-Wirkung der drei Selbstbewertungen (C), Aggregation der
  Themen-Tabelle (D2), Zuordnungs-Auswahl-UI (E2), Zwischenstand-Anzeige (F),
  Theme-Umschalter inkl. System-Modus (G), Folien-Erzeugung mit allen Fragen (H).
- Manuelle Prüfung: Darkmode-Durchklick aller Seiten, Beamer-Präsentation
  eines Themas mit vielen Fragen, PDF-Regenerierung.
