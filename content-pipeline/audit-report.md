# Audit-Report Content-Pipeline

Protokoll aller Auffälligkeiten aus der KI-Extraktion. Jede Extraktion muss
`npm test` (Schema- + Referenz-Audit) bestehen, bevor sie committet wird.

## Sommer 2025 (Muster-Extraktion, 2026-08-31)

### KBZ (Kundenbeziehungsprozesse)
- 57 Originalaufgaben, 150 Min / 150 Punkte. Punktesumme der Aufgaben: 149,99993
  (IHK-typische gebundene Punkte 50/23 ⇒ krumme Einzelwerte, kein Fehler).
- **Aufgabe 6.6 (Zuschlagskalkulation):** Die offizielle IHK-Musterlösung ist in
  sich nicht konsistent (Materialgemeinkosten 130,62 € statt rechnerisch
  130,20 €). Übernommen wurde der offizielle Selbstkosten-Endwert 777,17 €,
  in der Lösung transparent kommentiert; 6.7.3 (Unterdeckung 32,83 €) baut darauf auf.
- **Aufgabe 5.5:** Lösungsbogen nennt nur Konten; Skonto-Teilbeträge wurden
  rechnerisch abgeleitet und sind als Hinweis gekennzeichnet.
- **Aufgabe 5.4:** Handschriftlicher Rechenweg teils schwer lesbar; offizieller
  Endwert 11.086,28 € eindeutig und übernommen.
- Anlagen (Mängelrüge, Rechnung, UStG-Auszug, Belege, Kalender, ArbZG) als
  Markdown bei den Aufgaben hinterlegt; OCR-behaftete Scan-Felder plausibilisiert.

### WiSo
- 31 Originalaufgaben, 60 Min / 100 Punkte. Punkte pro Aufgabe sind im PDF
  nicht abgedruckt ⇒ `punkte` nur bei den 5 Rechenaufgaben gesetzt (Summe 15);
  die Punktesumme entspricht daher bewusst NICHT den 100 Gesamtpunkten.
- IHK-Zuordnungsaufgaben (Kennziffern) wurden schema-konform als MC mit
  Antwortkombinationen abgebildet; korrekte Kombination laut Lösungs-PDF.
- Preis-Mengen-Tabellen (a12–a14) in Prosa zusammengefasst; Werte verifiziert
  (Gleichgewicht 1.800 € / 3.000 Stück).

### Buchführung & KLR
- **Wichtig:** Die Quelldatei `LosungenBuchfuhrungKlr.pdf` ist in Wahrheit das
  komplette KBZ-Aufgabenblatt Sommer 2025 mit handschriftlichen Musterlösungen.
  Extrahiert wurde nur die echte BuFü/KLR-Substanz (Aufgaben 5 + 6):
  18 Originalaufgaben. Kein eigener Prüfungstermin (Zeit/Punkte gehören zur
  Gesamt-KBZ-Prüfung) ⇒ kein Eintrag in `pruefungen/index.json`.
- **Bewusste Überschneidung:** Die Rechnungswesen-Aufgaben existieren dadurch
  sowohl im Bereich KBZ (als Teil der Originalprüfung) als auch als
  Trainings-Extrakt im Bereich Buchführung. Das ist gewollt (Buchführung ist
  auf Wunsch ein eigener Übungsbereich), kein Dubletten-Fehler.
- Kontonummern der Belege anhand des Kontenplan-Auszugs rekonstruiert.
- Alle abgeleiteten Rechenvarianten wurden unabhängig nachgerechnet.

### Mündliche Prüfung
- 21 Beispiel-Prüfungsfragen mit Musterlösungen über 6 Wahlqualifikationen;
  als `quelle: "abgeleitet"` erfasst (Übungsprüfungen, keine IHK-Termine).
- Hinweise-PDF hatte nur 3 Seiten; Report-Aufbau ergänzend aus `Report.pdf`.
- 4 von 10 Wahlqualifikationen ohne extrahierte Fragen ⇒ bewusst keine
  leeren Themen angelegt.

## Bekannte Lücken (Stand 2026-08-31)
- Termine 2017 Winter – 2024 Winter: noch nicht extrahiert
  (Prozedur siehe EXTRAKTION.md).
- `haeufigkeit` basiert bisher nur auf 2025 Sommer — die Landkarten-Statistik
  wird erst mit weiteren Terminen aussagekräftig.
