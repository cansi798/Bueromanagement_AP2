# Grafiken-Runde — Anlagen-Lücken schließen + Übersichtsdiagramme für alle Themen

**Datum:** 2026-09-16 · **Status:** Scope vom Nutzer gewählt (alle 20 Themen) · **Branch:** `feature/grafiken-runde`

## Anlass

Nutzer-Report: „Es fehlen teilweise noch Grafiken, prüfe überall" — Hinweis auf Unterrichts-Session 9 (WiSo = `prozesse-epk`). Audit-Befund (2026-09-16):

1. **15 Aufgaben verweisen ins Leere:** Text nennt „abgebildetes Organigramm/Sicherheitszeichen/Beleg", aber weder `anlagenText` noch `anlagenDiagramm` sind gesetzt. Betroffen: 6× WiSo (4 Organigramm-Aufgaben `unternehmensorganisation`: wiso-2019w-a19, wiso-2020s-a19, wiso-2020s-a20, wiso-2022w-a8; 2 Sicherheitszeichen-Aufgaben `arbeitsschutz-umwelt`: wiso-2022w-a28, wiso-2024w-a27), 5× KBZ (kbz-2025w-a4-3, a4-7, a4-8, a4-10, a4-11), 4× BuFü (bufu-2025w-a7, a8, a10, a11). Die 2025W-Fälle sind ohne Beleg unlösbar.
2. **20 von 32 Themen ohne Übersichtsdiagramm** (`DIAGRAMME`-Registry in `src/components/diagramme.tsx` deckt nur 12 ab) — dadurch haben manche Unterrichts-Sessions/Präsentationen eine Diagramm-Folie, andere nicht. Die `FOLIEN_DIAGRAMME`-Abschnittsdiagramme sind intakt (pro Thema verifiziert).

## Paket A — 15 Anlagen-Lücken schließen (Datenfehler)

- **WiSo-Organigramme (4 Aufgaben):** `anlagenDiagramm` vom Typ `organigramm` (Renderer existiert) aus den Original-PDFs der Termine (2019 Winter, 2020 Sommer, 2022 Winter) rekonstruieren. Gleiches Organigramm ggf. für mehrere Aufgaben desselben Termins wiederverwenden.
- **WiSo-Sicherheitszeichen (2 Aufgaben):** `anlagenDiagramm` Typ `schilder` (Renderer existiert; Felder form/farbe/innen/text) gemäß PDF (2022 Winter, 2024 Winter).
- **KBZ/BuFü 2025W-Belege (9 Aufgaben):** `anlagenText` (Markdown-Wiedergabe der Belege Nr. 2–4: Heizungsbau Meier, Stadtwerke Hamburg, Kfz-Kennzeichen) aus den 2025-Winter-PDFs; identische Belege werden zwischen kbz-2025w-a4-* und bufu-2025w-a* (abgeleitete Übungen) wortgleich geteilt.
- Rollout: Bei diesem kleinen Umfang (15 gezielte Einträge) direkte Edits in den aufgaben-JSONs statt Staging-Merge — abgesichert durch JSON-Validierung, Schema-Tests und den neuen Audit-Test. Befunde in `audit-report.md`.
- **Dauerhafter Audit-Test** `tests/anlagenVerweise.test.ts`: Kein Aufgaben-Text darf auf Anlage/Abbildung/Organigramm/Schaubild verweisen (Muster aus dem Audit-Skript), ohne dass `anlagenText` oder `anlagenDiagramm` gesetzt ist. Ausnahmen (falsche Treffer wie „Sortieranlage") über eine dokumentierte Allowlist im Test.

## Paket B — Übersichtsdiagramme für die 20 fehlenden Themen

Für jedes Thema ein handgebautes Rough.js-Übersichtsdiagramm in `DIAGRAMME` (gleiches Muster wie die bestehenden 12: Funktion → ReactNode, seed-stabil, deutsch beschriftet, lesbar auf Beamer):

| Bereich | Themen (Diagramm-Idee) |
|---|---|
| WiSo | produktionsfaktoren-unternehmensziele (Zielbeziehungs-Dreieck), rechtsformen-vollmachten (Vollmachten-Stufen), finanzierung-kreditsicherung (Finanzierungsarten-Baum), arbeitsschutz-umwelt (Schilder-Farblogik), datenschutz-digitales-arbeiten (DSGVO-Rollen), **prozesse-epk (Mini-EPK: Ereignis→Funktion→Konnektor — Session 9!)**, unternehmensorganisation (Einlinien/Stablinien nebeneinander), projektmanagement (Phasenpfeil mit Meilensteinen) |
| KBZ | kundenkommunikation (Beschwerde-Eskalationstreppe), personalwirtschaft (Personalprozess-Kette) |
| BuFü | stueckkosten-kostenrechnung (Fixkostendegression-Kurve), normalkosten-kostenabweichung (Über-/Unterdeckung-Balken) |
| Mündlich | report-schreiben (Report-Aufbau), gespraechstechnik (Gesprächsphasen) sowie die 6 WQ-Themen wq-auftragssteuerung, wq-kmu, wq-einkauf-logistik, wq-marketing-vertrieb, wq-personalwirtschaft, wq-assistenz-sekretariat (je Kernprozess-Schaubild) — `ablauf-fachaufgabe` hat bereits ein Diagramm |

- Diagramm-Ideen sind Vorschläge; fachliche Treue zum Lernzettel-Inhalt geht vor Originalität. KEINE Änderungen an bestehenden 12 Diagrammen oder an `FOLIEN_DIAGRAMME`.
- Falls `diagramme.tsx` dadurch unhandlich groß wird (>~1200 Zeilen), neue Diagramme in `src/components/diagramme/` aufteilen (je Bereich eine Datei), Registry bleibt zentral — Konsumenten-API (`DIAGRAMME`, `hatDiagramm`, `ThemaDiagramm`, `FOLIEN_DIAGRAMME`, `FolienDiagramm`) unverändert.
- **Render-Test** `tests/diagramme.test.tsx`: `renderToString` für JEDEN `DIAGRAMME`-Eintrag → wirft nicht, enthält `<svg`- oder `<path`-Ausgabe; zusätzlich: jede themaId aus den Themen-JSONs hat einen `DIAGRAMME`-Eintrag (Vollständigkeits-Garantie — nie wieder „Session ohne Grafik").

## Abschluss

- Alle Tests grün (Bestand 263 + neue). Download-PDFs regenerieren (Skripte/Präsentationen zeigen neue Diagramme), Medien-Quell-PDFs neu, dist + ZIP neu.
- Update-Bericht als nummerierter Ordner + gebündeltes PDF.
- Merge auf `main` + Push nach Nutzer-Review.

## Nicht in dieser Runde

- Keine neuen `FOLIEN_DIAGRAMME`-Abschnittsdiagramme (eigene Runde, falls gewünscht).
- Keine Änderung an Aufgaben-Lösungen/Erklärungen außer den 15 Anlagen-Ergänzungen.
- Kein Nachbau von Belegen als gezeichnete Grafik — `anlagenText`-Markdown genügt (IHK-Bogen-Stil).
