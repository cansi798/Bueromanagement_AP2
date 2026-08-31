# Audit-Report Content-Pipeline

Protokoll aller Auffälligkeiten aus der KI-Extraktion. Jede Extraktion muss
`npm test` (Schema- + Referenz-Audit) bestehen, bevor sie committet wird.

## GESAMT-ROLLOUT abgeschlossen (2026-08-31)

**Alle 16 Termine (2017 Winter – 2025 Sommer) extrahiert: 1.303 Aufgaben,
davon 1.186 Originale; 30 Prüfungseinträge (KBZ + WiSo je Termin, soweit
Material vorhanden).** Extraktion in 3 Wellen à 4–5 parallelen Agenten über
Staging-Dateien (merge-staging.mjs), jede Welle gegen Schema + Referenzen
validiert.

### Zentral behobene Formfehler (Welle 1)
- 134 MC-Aufgaben mit `korrekt` als Zahl statt Array → automatisch gewrappt.
- 6 Prüfungseinträge ohne termin/bereich/name → aus Staging rekonstruiert.
- Welle 2+3 danach fehlerfrei (Prompts nachgeschärft).

### Wichtige inhaltliche Vorbehalte (je Termin dokumentiert)
- **Winter 2021 (Sammlung 9):** Für offene KBZ-Aufgaben existiert NUR der
  MC-Schlüssel als amtliche Lösung. Die Musterlösungen der offenen Aufgaben
  sind fachlich fundiert ERGÄNZT und in jeder Aufgabe gekennzeichnet.
- **Winter 2018 (Sammlung 15):** Lösungen stammen aus U-Form-
  Lösungserläuterungen (Fachverlag), nicht von der IHK; Standalone-
  Lösungsbogen war blanko. KBZ 4.5: Beträge 4800/5101 in der Quelle
  vermutlich vertauscht — korrigiert vermerkt.
- **Winter 2024 (Sammlung 3):** WiSo-Aufgaben 18–22 fehlen (Seite fehlt im
  Quell-PDF); 8 Kontierungs-Teilaufgaben nicht als Einzelaufgaben erfasst
  (Buchungssätze im Audit gelistet).
- **Sommer 2018 (Sammlung 14):** KBZ 4.5 Entgeltabrechnung: Lohnsteuerwerte
  in Aufgabensatz und Musterlösung widersprechen sich — dokumentiert.
- **Winter 2019 (Sammlung 13):** WiSo A28: amtlicher Schlüssel (fristlos)
  weicht von § 22 BBiG (4-Wochen-Frist) ab — Schlüssel übernommen,
  Einordnung in der Erklärung.
- **Sommer 2021 (Sammlung 8):** Kein WiSo-Aufgabenblatt im Ordner (nur
  Lösungsraster) → kein WiSo für diesen Termin.
- **2017 Winter:** Datei „W17 18 Losungen" im 2018er-Ordner enthält in
  Wahrheit die Winter-2018/19-Lösungen (irreführender Name) — korrekt
  auseinandergehalten.
- Generell: Reine Tabellen-/Formular-/Erörterungsaufgaben ohne modellierbaren
  Schlüssel wurden je Termin bewusst weggelassen (Details in den
  Wellen-Protokollen der Agenten); Punktesummen daher teils < Deckblatt.
- Rundung gebundener Punkte (2,1739/2,2727/3,33) führt zu Summen wie 144/90 —
  `punkteGesamt` trägt immer den Deckblattwert.

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

## Sommer 2024 (Rollout, 2026-08-31)

### KBZ
- 55 Originalaufgaben, 150 Min / 150 Punkte, Punktesumme exakt 150,00.
- **Zweitprüfung fand einen Fehler:** Aufgabe 2.6 war zunächst mit der fachlich
  „schöneren" Antwort 5 erfasst; der offizielle Lösungsschlüssel sagt Antwort 4
  ⇒ korrigiert. Alle 12 MC-Schlüssel stimmen jetzt mit dem Lösungsbogen überein.
- Alle Kontierungs-Buchungssätze und Rechenlösungen gegen die Musterlösung
  verifiziert (u. a. 2.3 = 12,62 %; 5.6 = 1.098,80 €; 6.7 = 310,62 €).
- Neues Thema `buchfuehrung-kontierung` (Aufgabe 5); 5 bestehende Themen um
  „2024-sommer" erweitert.

### WiSo
- 31 Originalaufgaben; alle Lösungen aus der offiziellen IHK-Musterlösung
  („Vorläufige Lösungen"), keine einzige selbst gelöst.
- Kompletter 31-Aufgaben-Kreuzcheck gegen den Lösungsschlüssel: alle Treffer.
- Zuordnungs-/Reihenfolgeaufgaben als Single-Choice mit voller Zuordnung in
  der korrekten Option modelliert (wie beim 2025er-Bestand).
- Neue Themen: `datenschutz-digitales-arbeiten`, `prozesse-epk`;
  7 bestehende Themen erweitert.

## Bekannte Lücken (Stand 2026-08-31)
- Termine 2017 Winter – 2023 Winter und 2024 Winter: noch nicht extrahiert
  (Prozedur siehe EXTRAKTION.md).
- `haeufigkeit` basiert bisher auf 2024 Sommer + 2025 Sommer — die
  Landkarten-Statistik wird mit jedem weiteren Termin aussagekräftiger.
- Mündlich: 4 von 10 Wahlqualifikationen ohne Beispielfragen.
