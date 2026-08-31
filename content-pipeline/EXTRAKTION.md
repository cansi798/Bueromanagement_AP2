# Extraktions-Prozedur (je Prüfungstermin)

So werden weitere Prüfungstermine in die App übernommen. Am besten mit
Claude Code: einen Extraktions-Agenten pro Bereich/Termin beauftragen.

## Schritte

1. **PDFs lesen:** Aufgaben-, Lösungs- und Anlagen-PDF des Termins seitenweise
   lesen (Read-Tool mit `pages`, max. 20 Seiten pro Aufruf).
2. **Themen zuordnen:** Bestehende Themen-IDs aus `public/data/themen/<bereich>.json`
   WIEDERVERWENDEN. Nur wirklich neue Themen anlegen. Beim bestehenden Thema
   den Termin in `haeufigkeit` ergänzen (Format `"2024-sommer"`).
3. **Aufgaben schreiben** in `public/data/aufgaben/<bereich>.json` (anhängen):
   - `quelle: "original"`, `termin` gesetzt, echte Punktzahlen, vollständige
     Lösung, Anlagen als `anlagenText` (Tabellen als Markdown).
   - ID-Muster: `<bereich>-<jahr><s|w>-a<nr>` (z. B. `kbz-2024s-a3-1`).
4. **Prüfungseintrag** in `public/data/pruefungen/index.json` ergänzen
   (`zeitMinuten`/`punkteGesamt` vom Deckblatt, `aufgabenIds` in Reihenfolge).
5. **Audit:** `npm test` muss grün sein (Schema + Referenzen). Punktesumme der
   Aufgaben gegen `punkteGesamt` prüfen (±5 % Toleranz). Auffälligkeiten in
   `content-pipeline/audit-report.md` protokollieren.
6. **Stichproben-Zweitprüfung:** PDF erneut an 3–5 Stellen gegen das JSON
   lesen (v. a. MC-`korrekt`-Indizes!). Abweichungen fixen und protokollieren.
7. **Commit:** `content: <bereich> <termin> (original, auditiert)`.

## Prioritätenliste (noch offen)

1. 2024 Sommer (KBZ + WiSo) — ✅ sobald erledigt, hier abhaken
2. 2024 Winter, 2023 Sommer/Winter … rückwärts bis 2017 Winter
3. Ältere Termine (vor 2020) haben teils andere Aufgabenformate — Themen
   trotzdem denselben IDs zuordnen, damit die Häufigkeits-Statistik stimmt.

## Häufige Stolperfallen

- MC-`korrekt` ist **0-basiert** — doppelt prüfen, falsche Indizes sind für
  Lernende fatal.
- `quelle: "original"` erfordert `termin` (Audit-Test schlägt sonst an).
- `additionalProperties: false` — keine Extra-Felder erfinden.
- Scans: OCR-Fehler bei Zahlen (0/O, 1/l) gegen den Kontext plausibilisieren.
