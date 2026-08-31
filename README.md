# KBM Prüfungscoach

Statische Lern-Webapp für den Unterricht und die Vorbereitung auf die
IHK-Abschlussprüfung **Kaufmann/-frau für Büromanagement**: 4 Lernbereiche
(WiSo, KBZ, Buchführung & KLR, Mündliche Prüfung), geführte
**Unterrichts-Sessions**, **Beamer-Präsentationen** (HTML + PDF), druckbare
**Lernskripte** mit Deckblatt/Inhaltsverzeichnis/Eselsbrücken,
3-Stufen-Training, Simulation mit Timer, Karteikarten (Leitner), Quizze,
Glossar und Suche. Mobil und Desktop.

**Anonymisierung:** Prüfungstermine heißen nach außen „Aufgabensammlung N".
Die interne Zuordnung steht in `content-pipeline/termine-intern.md` und
`src/lib/termine.ts` — beides beim Ergänzen neuer Termine pflegen.

**PDFs neu erzeugen** (nach Content-Änderungen):

```bash
npm run build && npm run preview &   # Server auf :4173
bash scripts/pdfs.sh <ZUGANGSCODE>   # schreibt public/downloads/*.pdf
npm run build                        # PDFs in dist/ übernehmen
```

## Befehle

```bash
npm install          # einmalig (auf VirtualBox-Shared-Folder: --no-bin-links)
npm run dev          # Entwicklungsserver
npm test             # Tests inkl. Content-Schema-Audit
npm run build        # Produktions-Build nach dist/
npm run preview      # Build lokal ansehen
```

## Veröffentlichen

- **GitHub Pages:** Repo pushen, unter *Settings → Pages → Source:
  GitHub Actions* aktivieren — der Workflow `.github/workflows/deploy.yml`
  testet, baut und veröffentlicht bei jedem Push auf `main`.
- **Eigener Webserver:** einfach den Inhalt von `dist/` hochladen
  (relative Pfade + Hash-Routing, keine Server-Konfiguration nötig).

## Zugang & Inhalte

- Die App fragt einen Zugangscode ab (im Quelltext nur als SHA-256-Hash).
- Inhalte liegen als JSON unter `public/data/` und werden durch
  `schema/content.schema.json` + `npm test` abgesichert.
- Neue Prüfungstermine einpflegen: Prozedur in
  `content-pipeline/EXTRAKTION.md`; Auffälligkeiten stehen in
  `content-pipeline/audit-report.md`.
- Video-/Podcast-Links eintragen: in `public/data/themen/<bereich>.json`
  beim Thema unter `medien.video.url` bzw. `medien.podcast.url` die URL
  setzen und `status` auf `"vorhanden"` stellen.

## Hinweis Urheberrecht

Die Original-Prüfungs-PDFs bleiben außerhalb des Repos (`.gitignore`).
Die extrahierten Originalaufgaben sind für den Unterrichtsgebrauch gedacht —
vor einer öffentlichen Veröffentlichung die Rechte prüfen.
