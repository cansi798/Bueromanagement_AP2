# Design: KBM Prüfungscoach

**Datum:** 2026-08-31
**Status:** Vom Auftraggeber (Lehrkraft) mündlich freigegeben, schriftliche Spec zur Review.

## 1. Ziel und Kontext

Eine statische Lern-Webapp zur Vorbereitung auf die IHK-Abschlussprüfung
**Kaufmann/-frau für Büromanagement (KBM)**. Grundlage sind 17 Prüfungstermine
(2017 Winter bis 2025 Sommer) plus Material zur mündlichen Prüfung, vorliegend
als PDF unter `/media/sf_Prfungsvorbereitung_KBM/`.

Die App richtet sich an Schüler/Auszubildende der Lehrkraft. Sie wird zunächst
auf **GitHub Pages** gehostet und später auf einen eigenen Webserver umgezogen.

**Nicht-Ziele (YAGNI):**
- Kein Server, keine Datenbank, keine Nutzerkonten.
- Kein Editor/CMS in der App — Inhalte entstehen ausschließlich über die
  Content-Pipeline (Abschnitt 6).
- Keine echte Zugriffssicherheit (siehe 3.1) — bewusste Entscheidung.

## 2. Randbedingungen und Entscheidungen

| Thema | Entscheidung |
|---|---|
| Hosting | GitHub Pages (statisch), später eigener Webserver |
| Repo | Öffentlich; Zugangscode wird nicht prominent dokumentiert |
| Zugang | Zugangscode-Gate mit Code `KBMap2` (Soft-Gate, kein echter Schutz) |
| Inhalte | Originalaufgaben + abgeleitete Themen-Übungen + zusätzlich KI-generierte prüfungsähnliche Aufgaben |
| Content-Erstellung | Vollautomatische KI-Extraktion aus den PDFs mit mehrstufigem Audit |
| Fortschritt | Nur lokal im Browser (`localStorage`), kein Login |
| Original-PDFs | Bleiben außerhalb des Repos (`.gitignore`: `*.pdf`, `content-pipeline/raw/`) |

## 3. Architektur

```
PDFs (Prüfungen 2017–2025, Mündlich)
   │   Content-Pipeline: KI-Extraktion + Audit (Build-Zeit, lokal)
   ▼
JSON-Datendateien (public/data/…)
   │   werden mit der Seite ausgeliefert
   ▼
Statische Web-App (Vite + React + TypeScript + Tailwind CSS)
   │
   ▼
Browser des Schülers (Fortschritt in localStorage)
```

- **Kein Backend.** Alle „Intelligenz" (Themenanalyse, Aufgabenextraktion,
  Generierung) passiert vorab in der Pipeline; die App liest nur JSON.
- **Routing:** Hash-Routing (`/#/wiso/stufe2/…`), damit die App ohne
  Server-Konfiguration auf GitHub Pages und jedem statischen Webserver läuft.

### 3.1 Zugangscode-Gate

Beim ersten Aufruf fragt die App einen Zugangscode ab (`KBMap2`). Bei Erfolg
wird ein Flag in `localStorage` gesetzt; danach keine erneute Abfrage.
Der Code wird als Hash im Client geprüft (nicht im Klartext im Quelltext),
ist aber prinzipiell umgehbar — das ist akzeptiert und dokumentiert.

## 4. Lernbereiche

Vier Bereiche als Kacheln auf der Startseite, jeweils mit eigenem Fortschritt:

1. **WiSo** — Wirtschafts- und Sozialkunde
2. **Kundenbeziehungsprozesse (KBZ)** — schriftliche AP2
3. **Buchführung / Rechnungswesen** — eigener Bereich
4. **Mündliche Prüfung** — eigener Bereich mit anderem Format:
   Report-Hinweise, Fachaufgaben, 60+ Beispiel-Prüfungsgespräche mit Lösungen,
   Leitfäden zur Gesprächssimulation. Kein 3-Stufen-System, sondern
   Kategorien: „Ablauf & Report", „Beispielprüfungen üben", „Karteikarten".

## 5. Funktionsumfang

### 5.1 Das 3-Stufen-System (Bereiche 1–3)

- **Stufe 1 — Auffrischung:** Pro Thema die wesentlichen Inhalte:
  Lernzettel/Skript mit Erklärungen und Eselsbrücken, kurze
  Selbstcheck-Fragen. Ziel: Stoff verstehen/erinnern.
- **Stufe 2 — Themenbezogene Prüfungsaufgaben:** Aufgaben nach Thema
  gruppiert. Quellen-Mix: Originalaufgaben aus den Prüfungen, daraus
  abgeleitete Varianten und zusätzlich generierte prüfungsähnliche Aufgaben.
  Jede Aufgabe ist als `original | abgeleitet | generiert` gekennzeichnet
  und bei Originalen mit Termin (z. B. „Sommer 2024") ausgewiesen.
- **Stufe 3 — Prüfungsjahre:** Komplette Prüfungen eines Termins am Stück,
  wahlweise als **Simulation** (Timer entsprechend echter Prüfungszeit,
  Lösungen erst am Ende) oder im **Übungsmodus** (Lösung pro Aufgabe sofort
  aufklappbar).

### 5.2 Lernmethoden

- **Karteikarten** mit Spaced Repetition (Leitner-System, 5 Fächer,
  Stände in `localStorage`).
- **Themen-Landkarte** pro Bereich: alle Themen mit **Häufigkeit** über die
  Termine („kam 6× dran 2017–2025") als Priorisierungshilfe; verlinkt in
  Stufe 1 und Stufe 2 des Themas.
- **Quizze:** Multiple Choice mit sofortigem Feedback; offene Fragen mit
  Musterlösung zur Selbsteinschätzung („Wusste ich / Wusste ich nicht").
- **Medien-Platzhalter:** Pro Thema optional Video- und Podcast-Slot
  (Titel, URL, Status `geplant | vorhanden`). Die Lehrkraft füllt die URLs
  später; leere Slots zeigen „Video folgt".
- **Fortschritt:** pro Bereich/Stufe/Thema (erledigte Aufgaben, Quiz-Ergebnisse,
  Karteikarten-Stand); Lern-Streak (Tage in Folge).
- **Suche** über Themen und Aufgaben; **Glossar** der Fachbegriffe.

## 6. Content-Pipeline (Build-Zeit, lokal)

Skripte unter `content-pipeline/`, ausgeführt von der Lehrkraft/Claude lokal —
nie im Browser. Die Original-PDFs werden nach `content-pipeline/raw/` gelinkt
oder kopiert (gitignored).

**Schritte je Prüfungstermin:**
1. **Extraktion:** PDF → Text/Struktur (KI-gestützt, da Scans und Tabellen
   vorkommen).
2. **Strukturierung:** KI ordnet zu: Bereich → Thema → Aufgabe(n) → Lösung,
   inkl. Punktzahlen und Anlagenbezug. Ausgabe: JSON-Entwurf.
3. **Audit (mehrstufig, automatisch):**
   - **Schema-Validierung** gegen das JSON-Schema (Abschnitt 7).
   - **Kreuz-Check:** Jede Aufgabe hat genau eine Lösung; Punktzahlen der
     Aufgaben summieren sich plausibel zur Prüfungssumme.
   - **Dubletten-Check** über Termine hinweg.
   - **KI-Zweitprüfung:** Ein zweiter, unabhängiger Prüf-Durchlauf vergleicht
     JSON gegen PDF-Quelltext und meldet Abweichungen.
   - Auffälligkeiten landen in `content-pipeline/audit-report.md`.
4. **Anreicherung:** Themen-Zuordnung zur Landkarte, Häufigkeitszählung,
   Generierung zusätzlicher prüfungsähnlicher Aufgaben (gekennzeichnet),
   Lernzettel + Eselsbrücken + Quizfragen + Karteikarten je Thema.

**Rollout-Strategie:** Zuerst 1–2 aktuelle Termine (z. B. Sommer 2024/2025)
als Qualitätsmuster durch die komplette Pipeline; erst nach Freigabe der
Qualität werden die übrigen Termine verarbeitet.

## 7. Datenmodell (JSON, Kurzform)

Dateien unter `public/data/`:

- `bereiche.json` — die vier Bereiche mit Metadaten.
- `themen/<bereich>.json` — Themen: `id`, `name`, `beschreibung`,
  `haeufigkeit` (Terminliste), `lernzettel` (Markdown), `eselsbruecken[]`,
  `medien` (`video?`, `podcast?` mit `titel`, `url?`, `status`).
- `aufgaben/<bereich>.json` — Aufgaben: `id`, `themaId`, `quelle`
  (`original | abgeleitet | generiert`), `termin?`, `typ`
  (`mc | offen | rechnen`), `text`, `anlagenText?`, `punkte?`,
  `loesung`, `erklaerung?`.
- `pruefungen/<termin>.json` — Stufe 3: Terminmetadaten (`zeitMinuten`,
  `punkteGesamt`) + geordnete Aufgaben-IDs.
- `karteikarten/<bereich>.json` — `id`, `themaId`, `vorderseite`, `rueckseite`.
- `glossar.json` — Begriff, Definition, Bereichsbezug.

Alle Dateien werden vom selben JSON-Schema validiert, das auch das Audit
(6.3) nutzt. TypeScript-Typen werden aus dem Schema abgeleitet, damit
Pipeline und App dieselbe Wahrheit teilen.

`localStorage`-Schlüssel sind versioniert (`kbm.v1.*`), damit spätere
Datenmigrationen möglich sind.

## 8. Technik

- **Stack:** Vite + React + TypeScript + Tailwind CSS.
- **Deploy:** GitHub Actions → GitHub Pages; Build ist ein normales
  `vite build`, dessen `dist/` auch 1:1 auf den späteren Webserver kopiert
  werden kann (relative Pfade/Hash-Routing machen es hostunabhängig).
- **Tests:** Vitest. Schwerpunkt: Datenlade-/Fortschrittslogik,
  Leitner-Algorithmus, Quiz-Auswertung, Schema-Validierung der Inhalte
  (jede JSON-Datei muss im CI gegen das Schema validieren).
- **Sprache der UI:** Deutsch.
- **Responsive Design (Pflicht):** Die App muss auf Smartphones voll nutzbar
  sein (Mobile-First mit Tailwind-Breakpoints) und auf Desktop eine
  angepasste, breitere Ansicht bieten. Karteikarten, Quizze und die
  Prüfungssimulation werden primär für Touch/Mobil ausgelegt;
  Desktop erhält Mehrspalten-Layouts (z. B. Aufgabe + Anlage nebeneinander).

## 9. Fehlerbehandlung

- Fehlende/kaputte JSON-Datei → Bereichskachel zeigt Hinweis statt Crash.
- Medien-Slot ohne URL → „folgt"-Badge, kein toter Link.
- `localStorage` nicht verfügbar (Privatmodus) → App läuft ohne
  Fortschrittsspeicherung, mit Hinweis.
- Pipeline: Jeder Audit-Fehler blockiert die Übernahme der betroffenen
  Datei nach `public/data/` (kein „halb kaputtes" Deployment).

## 10. Phasenplan

Jede Phase endet mit einem lauffähigen Zwischenstand:

- **Phase 0 — Setup:** Repo, Vite/React-Gerüst, Zugangscode-Gate,
  GitHub-Pages-Deploy („Hello KBM").
- **Phase 1 — Datenmodell:** JSON-Schema, Typen, Datenlader, Startseite mit
  vier Bereichen; ein Bereich mit echten Beispieldaten (1 Termin KBZ).
- **Phase 2 — Übungskern:** Stufe 1/2/3 inkl. Quiz-Komponenten, Simulation
  mit Timer, Fortschritt.
- **Phase 3 — Karteikarten:** Leitner-System.
- **Phase 4 — Lernzettel & Medien:** Lernzettel-Ansicht, Eselsbrücken,
  Medien-Platzhalter, Glossar, Suche.
- **Phase 5 — Content-Rollout:** Pipeline über alle 17 Termine + Mündlich,
  mit Audit-Berichten.
- **Phase 6 — Politur:** generierte Zusatzaufgaben vervollständigen,
  Themen-Landkarte mit Häufigkeiten, Streak, Feinschliff.
