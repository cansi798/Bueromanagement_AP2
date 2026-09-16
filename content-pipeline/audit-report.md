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

## Winter 2025/26 (Rollout 2026-09-02, Aufgabensammlung 17)

- KBZ: 53 Teilaufgaben, 150,00006 P. (100 P. ungebunden exakt laut Lösungshinweisen + 22 gebundene à 2,27273 P.). Keine neuen Themen.
- **Vorbehalt:** Für die 22 gebundenen Aufgaben (14 MC, 7 Kontierungen, Zuordnung 5.2) existieren keine offiziellen Lösungen — fachlich selbst hergeleitet, doppelt geprüft und gegen die Lösungshinweise der ungebundenen Aufgaben plausibilisiert (2.1↔LO 2.3, 4.10↔LO 4.11, 4.6↔LO 4.5, 5.2↔LO 5.1). Vorgehen analog 2021-winter.
- Kontierungen/Zuordnung als typ "offen" erfasst (Lösungsbogen-Format), 14 echte Auswahlaufgaben als "mc".
- Aufgabe 3.5: "Vielleicht"-Diagrammwerte teils unleserlich, aus 100-%-Differenz rekonstruiert; "Ja"-Werte durch LO bestätigt.
- WiSo Winter 2025/26 lag nicht im Ordner (nur KBZ-Aufgaben + LO ungebunden) — bei Nachlieferung nachziehen.

## Anlagen-Vollaudit gegen alle Original-PDFs (2026-09-03)

Abgleich aller 17 Terminordner (Original-PDFs, teils per pdftoppm-Bildanalyse
für Scans/>20-MB-Dateien) mit den JSON-Aufgaben: Welche zum Lösen nötigen
Grafiken fehlten oder existierten nur als Textbeschreibung?

**Neue Diagrammtypen** in `AnlagenDiagramm.tsx` + Schema: `organigramm`
(Baum mit Stabstellen), `schilder` (Sicherheitszeichen/EPK-Symbole),
`kreislauf` (Wirtschaftskreislauf-Skizzenvarianten).

**20 Einträge ergänzt** (merge-anlagen-diagramme.mjs, alle gegen Original-PDF
und hinterlegte Lösung verifiziert):
- Kreislauf-Skizzen (je 5 Varianten, Pfeilrichtungen aus PDF abgelesen,
  Lösung Skizze 4 bestätigt): wiso-2019s-a10, wiso-2023w-a13
- Organigramme: wiso-2019w-a18 (+Stab Jan Fischer), wiso-2022w-a7,
  wiso-2023s-a9 (obere Ebenen als Diagramm + komplette Hierarchie mit allen
  27 Stellen/Namen als anlagenText), wiso-2024s-a31 (EPK-Ausschnitt als
  Ablaufbaum mit „?"-Knoten)
- Schilder/Symbole: wiso-2019w-a17, wiso-2019w-a22 (EPK), wiso-2020w-a24,
  wiso-2021w-a28, wiso-2025s-a27
- Linien-/Balkendiagramme: wiso-2017w-a16 (Schaubild von a17 mit neutralen
  Seriennamen übernommen), wiso-2020w-a11, kbz-2025s-a6-5 (Geraden konsistent
  zur Lösung A=Erlöse/B=variable Kosten/C=BEP bei 1.200 rekonstruiert),
  kbz-2025w-a5-2, kbz-2025w-a3-5 (Balken aus anlagenText-Tabelle)
- anlagenText-Upgrades: kbz-2025s-a3-5 (Kalender Nov/Dez 2024 als Tabelle),
  wiso-2023w-a22 (Quartalstabelle Inflations-/Arbeitslosenquote/Wachstum)

**Vorbehalte/Entscheidungen:**
- wiso-2020w-a30 (Produktkennzeichen Blauer Engel etc.): bewusst KEIN
  Nachzeichnen (geschützte Logos, Namen stehen ohnehin in der Anlage).
- wiso-2023w-a12: im PDF reine Text-MC-Aufgabe — keine EPK-Grafik nötig
  (frühere Agenten-Meldung war falsch, per Sichtung aller Seiten widerlegt).
- Belege/Rechnungen/Formulare aller Termine: als Markdown-anlagenText
  adäquat; „siehe Anlage der vorigen Teilaufgabe" ist Absichts-Muster.
- 2023W/2024S über „komprimiert"/AP-PDF-Versionen geprüft (Originale >20 MB).

**Gleichzeitig (Quiz-Fairness-Runde):** Alle 267 Erklärungen mit
Positionsbezügen („Option 2", „die letzte Option") inhaltlich umgeschrieben,
da QuizMC/Simulation jetzt zur Laufzeit mischen (mischeOptionen mit
Pinning-Guard für „keine/alle der genannten"-Optionen). MC-loesung-Felder
werden nie neben gemischten Optionen angezeigt (geprüft) — dort keine Änderung.

## Zuordnungs-Runde (2026-09-08): MC-kodierte Ziffern-Zuordnungen → typ "zuordnung"

**42 Einträge konvertiert** (aufgaben/wiso 29, aufgaben/kbz 3, lernpaare/wiso 10)
via `staging/zuordnung-*.json` + `merge-zuordnung.mjs`. Anlass: Als MC waren
diese Aufgaben entweder unrealistisch (fertige Kombinationsketten statt
Ziffern-Eintragung wie auf dem IHK-Bogen) oder unlösbar (korrekt-Array als
REIHENFOLGE kodiert, z. B. wiso-2021w-a6 mit [0,0,1,1] bei 2 Optionen).
Adversarial-Prüfung gegen Original + loesung: alle 42 Ziffernfolgen korrekt.

**Vorbehalte/Entscheidungen:**
- wiso-2018s-a7: altes korrekt-Array widersprach der Musterlösung (b/c
  vertauscht) — loesung als Wahrheit übernommen (a2 b3 c5 d4 e1).
- wiso-2018s-a21: 4. Item „Petra Wagner" ergänzt (stand in der loesung,
  fehlte im MC-korrekt); loesung-Formulierung entsprechend modernisiert.
- wiso-2025s-a27: Itemtext „Zeichen 2" von „rot" auf „grün" korrigiert
  (Notruftelefon = Rettungszeichen; deckt sich mit anlagenDiagramm).
- wiso-2025s-a27 + wiso-2020w-a24: Item-Labels von „1–5" auf „a–e"
  umgestellt (Kollision mit den Lösungsziffern 1–5 der Legende).
- 13 loesung/erklaerung-Texte bereinigt („Richtig ist Option 1", Meta-Sätze
  über das korrekt-Array).
- BEWUSST NICHT konvertiert (reine Text-Zuordnungen ohne Ziffern-Legende,
  bleiben MC per Nutzer-Entscheidung): wiso-lp-produktionsfaktoren-
  unternehmensziele-05, wiso-lp-markt-preisbildung-14, wiso-lp-
  berufsausbildung-arbeitsrecht-13, wiso-lp-arbeitsschutz-umwelt-09/-19,
  wiso-produktionsfaktoren-unternehmensziele-v1, wiso-konjunktur-
  indikatoren-g1 (Reihenfolge-Single-Choice, funktional).
- Schema-Audit erzwingt das Muster jetzt dauerhaft: MC-Optionen dürfen
  keine Ziffernketten mehr sein, korrekt muss eine echte Menge sein.

## Rechnen-Kachel (2026-09-08)

**29 Rechnen-Aufgaben eingepflegt** aus 36 Kandidaten-IDs via
`staging/rechnen-aufgaben.json` + `merge-rechnen.mjs`.
Alle loesungswerte gegen die loesung-Felder in wiso.json nachgerechnet —
keine Diskrepanzen gefunden. Schema-Audit + volle Testsuite (139 Tests) grün.

### Übernommene Aufgaben (29)

| Neue ID | Quelle-ID | Kapitel | loesungswert | Sammlung/Aufgabe |
|---|---|---|---|---|
| rechnen-kg-01 | wiso-2025s-a6 | kg-gewinnverteilung | 75.000,00 € | 2/6 |
| rechnen-ggu-01 | wiso-2025s-a13 | gleichgewichtspreis-umsatz | 5.000.000,00 € | 2/13 |
| rechnen-wirt-01 | wiso-produktionsfaktoren-unternehmensziele-g2 | wirtschaftlichkeit-produktivitaet | 1,25 | (kein quelle — generiert) |
| rechnen-ggu-02 | wiso-markt-preisbildung-g2 | gleichgewichtspreis-umsatz | 60.000,00 € | (kein quelle — generiert) |
| rechnen-ggu-03 | wiso-markt-preisbildung-v2 | gleichgewichtspreis-umsatz | 5.600.000,00 € | (kein quelle — generiert) |
| rechnen-eb-01 | wiso-2024s-a26 | energie-betriebskosten | 15.552,00 € | 1/26 |
| rechnen-proz-01 | wiso-2022s-a2 | prozentrechnung | 15,38 % | 6/2 |
| rechnen-kg-02 | wiso-2022w-a1 | kg-gewinnverteilung | 30.000,00 € | 7/1 |
| rechnen-kg-03 | wiso-2022w-a2 | kg-gewinnverteilung | 420.000,00 € | 7/2 |
| rechnen-kg-04 | wiso-2022w-a3 | kg-gewinnverteilung | 245.000,00 € | 7/3 |
| rechnen-ggu-04 | wiso-2022w-a15 | gleichgewichtspreis-umsatz | 2.250.000,00 € | 7/15 |
| rechnen-ggu-05 | wiso-2023s-a14 | gleichgewichtspreis-umsatz | 1.800,00 € (Preis) | 4/14 |
| rechnen-ggu-06 | wiso-2023s-a15 | gleichgewichtspreis-umsatz | 1.080.000,00 € | 4/15 |
| rechnen-ggu-07 | wiso-2023w-a19 | gleichgewichtspreis-umsatz | 55.000,00 € | 5/19 |
| rechnen-kg-05 | wiso-2024w-a8 | kg-gewinnverteilung | 165.600,00 € | 3/8 |
| rechnen-kg-06 | wiso-2024w-a9 | kg-gewinnverteilung | 30.000,00 € | 3/9 |
| rechnen-kg-07 | wiso-2019s-a19 | kg-gewinnverteilung | 550.000,00 € | 12/19 |
| rechnen-kg-08 | wiso-2019s-a20 | kg-gewinnverteilung | 75.000,00 € | 12/20 |
| rechnen-leas-01 | wiso-2020s-a5 | leasing | 25.031,08 € | 10/5 |
| rechnen-kg-09 | wiso-2020w-a8 | kg-gewinnverteilung | 87.500,00 € | 11/8 |
| rechnen-zins-01 | wiso-2021w-a10 | zinsrechnung | 4.900,00 € | 9/10 |
| rechnen-ggu-08 | wiso-2021w-a14 | gleichgewichtspreis-umsatz | 1.800,00 € (Preis) | 9/14 |
| rechnen-ggu-09 | wiso-2021w-a15 | gleichgewichtspreis-umsatz | 5.000.000,00 € | 9/15 |
| rechnen-ggu-10 | wiso-2017w-a18 | gleichgewichtspreis-umsatz | 2.250.000,00 € | 16/18 |
| rechnen-zins-02 | wiso-2018s-a10 | zinsrechnung | 2,8 % | 14/10 |
| rechnen-kg-10 | wiso-2018s-a12 | kg-gewinnverteilung | 32.700,00 € | 14/12 |
| rechnen-ggu-11 | wiso-2018s-a15 | gleichgewichtspreis-umsatz | 1.800,00 € (Preis) | 14/15 |
| rechnen-ggu-12 | wiso-2018s-a16 | gleichgewichtspreis-umsatz | 1.080.000,00 € | 14/16 |
| rechnen-ggu-13 | wiso-2018w-a10 | gleichgewichtspreis-umsatz | 55.000,00 € | 15/10 |

### Ausgelassene IDs (7)

| Quell-ID | Grund |
|---|---|
| wiso-rechtsformen-vollmachten-g1 | Reine Wissensfrage (Mindeststammkapital GmbH = 25.000 €) — kein eindeutiges Rechenergebnis; Regel 1 + Brief explizit genannt |
| wiso-finanzierung-kreditsicherung-v1 | MC, Darlehensart-Erkennung (Abzahlungsdarlehen) — kein Zahlenergebnis |
| wiso-2025s-a10 | MC, Darlehensart-Erkennung (Annuitätendarlehen) — kein Zahlenergebnis |
| wiso-2022s-a18 | Schaubild-Ablese ohne tabellare Werte im Text: anlagenText beschreibt nur die Grafik, nennt keine konkreten Koordinaten des Gleichgewichtspunkts — Regel 3 (Schaubild-Aufgabe ohne numerische Daten) |
| wiso-2020w-a12 | MC, Konjunkturphase benennen (Abschwung/Rezession) — kein Zahlenergebnis |
| wiso-2020w-a15 | MC, Darlehensart-Erkennung (Annuitätendarlehen) — kein Zahlenergebnis |
| wiso-2018w-a28 | MC, Darlehensart-Erkennung (Annuitätendarlehen) — kein Zahlenergebnis |

### Verifikation loesungswerte

Alle 29 loesungswerte wurden gegen das loesung-Feld in wiso.json nachgerechnet.
Keine Diskrepanzen. Hinweis zu wiso-2019s-a20 (rechnen-kg-08): loesung-Feld enthält
einen redaktionellen Kommentar zu einem alternativen Algorithmus; der Wert 75.000 €
ist gemäß Angabe im Feld „laut Lösungsschlüssel" die maßgebliche Wahrheit und wurde
übernommen. Nachrechnung bestätigt: Neuer Kommanditist erhält 20.000 € (4 % auf
500.000 €) + 55.000 € (1/10 von 550.000 €) = 75.000 € gesamt; um diesen Betrag
werden die Altgesellschafter schlechtergestellt.

## Zuordnungs-Audit 2026-09-11

### Struktureller Test (dauerhaft)

`tests/zuordnungDaten.test.ts` angelegt. Prüft für alle 42 Zuordnungs-Einträge aus
`aufgaben/*.json` und `lernpaare/*.json`:
- Ziffern-Nummern (nr) eindeutig je Eintrag
- Labels (a, b, c …) eindeutig je Eintrag
- Jeder `korrekt`-Wert zeigt auf eine tatsächlich vorhandene Ziffer-Nr
- Mindestens 2 Ziffern pro Legende

**Ergebnis: 43 Tests grün (1 Meta-Test + 42 Einzel-Tests), kein Strukturfehler.**

### Inhaltlicher Audit: aufgaben/kbz.json (3 Einträge)

- **kbz-2019s-a4-8** (Arbeitsrechtsquellen): korrekt [3,2,1] = BGB/Betriebsvereinbarung/Tarifvertrag.
  PDF-Abgleich Sommer 2019 KBZ Lösungsbogen (4.8 = 3;2;1): **bestätigt, kein Befund**.
- **kbz-2020s-a1-8** (Vertragswirksamkeit): korrekt [1,2,2,1,3,1].
  PDF-Abgleich Sommer 2020 KBZ/WiSo Lösung (1.8 = 1;2;2;1;3;1): **bestätigt, kein Befund**.
- **kbz-2021w-a4-3** (Kosten-Erlös-Diagramm Linien): korrekt [3,1,2] = Erlöse/Gewinn/Variable Kosten.
  PDF-Abgleich Winter 2021/22 gebundene Lösungen (4.3 = 3;1;2): **bestätigt, kein Befund**.
  Fachlich konsistent: Erlöse = steilste Gerade (Steigung 943), Variable Kosten = mittlere Gerade
  (Steigung 750), Gewinn = flachste Gerade (Steigung 193 = Deckungsbeitrag je Stück).

### Inhaltlicher Audit: aufgaben/wiso.json (29 Einträge)

PDF-Abgleich für alle Einträge mit `termin`-Feld (29 Einträge mit 9 Terminen):

**Sommer 2018 (WiSo Vorläufige Lösungen):**
- wiso-2018s-a4 (Produktionsfaktoren): korrekt [1,4,2]. PDF: A4 = 1;4;2. **bestätigt**.
- wiso-2018s-a7 (Multimomentmethode Reihenfolge): korrekt [2,3,5,4,1]. PDF: A7 = 2;3;5;4;1. **bestätigt**.
- wiso-2018s-a9 (Finanzierungsarten): korrekt [1,3,2]. PDF: A9 = 1;3;2. **bestätigt**.
- wiso-2018s-a21 (JAV-Wahl Wahlrecht): korrekt [3,1,3,2]. PDF: A21 = 3;1;3;2. **bestätigt**.
  Fachliche Plausibilität: Petra Wagner (20 J., Produktionsarbeiterin, nicht Azubi, über 18)
  → nach §60 BetrVG nicht wahlberechtigt (nicht jugendlich, nicht in Berufsausbildung),
  nach §61 BetrVG wählbar (unter 25) → korrekt = 2 (nur wählbar). **kein Befund**.

**Sommer 2019 (WiSo Lösungen):**
- wiso-2019s-a5 (Prozessoptimierung Reihenfolge): korrekt [3,1,2,5,4]. PDF: A5 = 3;1;2;5;4. **bestätigt**.

**Sommer 2020 (WiSo Vorläufige Lösungen):**
- wiso-2020s-a1 (Zielbeziehungen): korrekt [2,2,3,1,1]. PDF: A1 = 2;2;3;1;1. **bestätigt**.

**Winter 2020/21 (WiSo Lösungen):**
- wiso-2020w-a5 (EPK-Symbole): korrekt [2,4,3]. PDF: A5 = 2;4;3. **bestätigt**.
- wiso-2020w-a6 (Projektphasen): korrekt [4,3,1,2]. PDF: A6 = 4;3;1;2. **bestätigt**.
- wiso-2020w-a24 (Sicherheitszeichen-Kategorien): korrekt [3,4,5,1,2]. PDF: A24 = 3;4;5;1;2. **bestätigt**.

**Winter 2021/22 (WiSo Lösungen):**
- wiso-2021w-a2 (Zielbeziehungen): korrekt [1,2,3]. PDF: A2 = 1;2;3. **bestätigt**.
- wiso-2021w-a6 (Haftungskapital): korrekt [1,1,2,2]. PDF: A6 = 1;1;2;2. **bestätigt**.
- wiso-2021w-a9 (Finanzierungsarten): korrekt [1,3,2]. PDF: A9 = 1;3;2. **bestätigt**.
- wiso-2021w-a17 (Konjunkturschaubild): korrekt [1,6,3]. PDF: A17 = 1;6;3. **bestätigt**.
- wiso-2021w-a29 (Abfallhierarchie): korrekt [2,1,3]. PDF: A29 = 2;1;3. **bestätigt**.

**Sommer 2023 (WiSo Vorläufige Lösungen):**
- wiso-2023s-a3 (Produktionsfaktoren): korrekt [1,4,2]. PDF: A3 = 1;4;2. **bestätigt**.
- wiso-2023s-a12 (Kreditsicherheiten): korrekt [3,1,2]. PDF: A12 = 3;1;2. **bestätigt**.

**Winter 2023/24 (WiSo Vorläufige Lösungen):**
- wiso-2023w-a2 (Betriebliche Grundfunktionen): korrekt [5,1,2,4,3]. PDF: A2 = 5;1;2;4;3. **bestätigt**.
- wiso-2023w-a8 (Vertretungsbefugnis KG): korrekt [3,2,1]. PDF: A8 = 3;2;1. **bestätigt**.
- wiso-2023w-a11 (Prozessoptimierung Reihenfolge): korrekt [3,1,2,5,4]. PDF: A11 = 3;1;2;5;4. **bestätigt**.
- wiso-2023w-a18 (Marktformen): korrekt [3,6,1]. PDF: A18 = 3;6;1. **bestätigt**.
  Fachliche Prüfung: „Benno" (zwei weitere Hersteller + sehr wenige Kunden) = zweiseitiges
  Oligopol (6). PDF-Aufgabentext und Lösung konsistent. **kein Befund**.

**Sommer 2024 (WiSo Vorläufige Lösungen):**
- wiso-2024s-a1 (Zielbeziehungen): korrekt [2,2,3,1,1]. PDF: A1 = 2;2;3;1;1. **bestätigt**.
- wiso-2024s-a15 (Konjunkturbegriffe): korrekt [2,1,3]. PDF: A15 = 2;1;3. **bestätigt**.
- wiso-2024s-a16 (Konjunkturphasen): korrekt [2,1,1,2]. PDF: A16 = 2;1;1;2. **bestätigt**.
- wiso-2024s-a29 (Nachhaltigkeitssäulen): korrekt [3,1,2]. PDF: A29 = 3;1;2. **bestätigt**.

**Sommer 2025 (WiSo, Lösung inline im Aufgabenblatt):**
- wiso-2025s-a2 (Produktionsfaktoren): korrekt [2,1,4]. Aufgabenblatt S. 3 bestätigt: 2, 1, 4. **bestätigt**.
- wiso-2025s-a15 (Konjunkturschaubild): korrekt [1,6,3]. Aufgabenblatt S. 6 bestätigt: A=1, B=6, C=3. **bestätigt**.
- wiso-2025s-a19 (Rechtsgrundlagen Ausbildung): korrekt [3,1,2]. Aufgabenblatt S. 7 bestätigt: 3, 1, 2. **bestätigt**.
- wiso-2025s-a27 (Sicherheitszeichen-Namen): korrekt [3,2,1,5,4]. Aufgabenblatt S. 10 bestätigt: 3, 2, 1, 5, 4. **bestätigt**.
- wiso-2025s-a29 (Kreislaufwirtschaft): korrekt [3,1,2]. Aufgabenblatt S. 11 bestätigt: 3, 1, 2. **bestätigt**.

**Einträge ohne termin (fachliche Prüfung loesung/erklaerung vs. korrekt):**
Kein Eintrag ohne termin in aufgaben/wiso.json — alle 29 Einträge haben termin-Feld und wurden PDF-verifiziert.

### Inhaltlicher Audit: lernpaare/wiso.json (10 Einträge)

Lernpaare haben kein `loesung`-Feld (nur `erklaerung`). Prüfung: Erklaerung vs. korrekt-Ziffern.

- **wiso-lp-produktionsfaktoren-unternehmensziele-08** (Zielbeziehungen): korrekt [2,3,1].
  Erklaerung nennt: Klimaschutzabgabe=konkurrierend(2), Arbeitsklima/Recycling=indifferent(3),
  ergonomische Möbel/weniger Krankheitstage=komplementär(1). **konsistent, kein Befund**.
  quellTermin: 2024-sommer — inhaltlich deckungsgleich mit wiso-2024s-a1 (andere Items, gleiche Logik).
- **wiso-lp-konjunktur-indikatoren-12** (Konjunkturbegriffe): korrekt [2,1,3].
  Erklaerung: Trend=langfristige Grundrichtung(2), Konjunkturzyklus=Wellenbewegung(1),
  saisonal=jahreszeitlich(3). **konsistent, kein Befund**.
- **wiso-lp-konjunktur-indikatoren-16** (Konjunkturphasen): korrekt [2,1,1,2].
  Erklaerung: sinkende Ausgabebereitschaft=Rezession(2), steigende Nachfrage=Expansion(1),
  hochwertige Produkte=Expansion(1), aufgeschobene Käufe=Rezession(2). **konsistent, kein Befund**.
- **wiso-lp-konjunktur-indikatoren-17** (Konjunkturschaubild): korrekt [1,6,3].
  Erklaerung: senkrechte Achse=BIP(1), Abwärtsbewegung=Rezession(6), steigende Gerade=Wirtschaftstrend(3).
  **konsistent, kein Befund**.
- **wiso-lp-projektmanagement-04** (Projektphasen): korrekt [4,3,1,2].
  Erklaerung: Lastenheft=Definition(4), Struktur-/Ablaufplan=Planung(3), Statusberichte=Durchführung(1),
  Reflexion=Abschluss(2). **konsistent, kein Befund**.
- **wiso-lp-produktionsfaktoren-unternehmensziele-20** (Werkstoffkategorien): korrekt [1,2,3].
  Erklaerung: Buchenholz=Rohstoff(1), Leim/Schrauben=Hilfsstoff(2), Schmieröl=Betriebsstoff(3).
  **konsistent, kein Befund**.
- **wiso-lp-rechtsformen-vollmachten-23** (Haftungskapital): korrekt [1,2,2,1].
  Erklaerung: Komplementär=Geschäfts+Privat(1), Kommanditist=nur Einlage(2),
  GmbH-Gesellschafter=nur Gesellschaft(2), e.K.=Geschäfts+Privat(1). **konsistent, kein Befund**.
- **wiso-lp-rechtsformen-vollmachten-30** (Handlungsvollmacht-Arten): korrekt [2,3,1].
  Erklaerung: Einkaufsleiter=Artvollmacht(2), einmaliger Fahrzeugverkauf=Einzelvollmacht(3),
  Filialleiterin alle gewöhnlichen=allgemeine HV(1). **konsistent, kein Befund**.
- **wiso-lp-finanzierung-kreditsicherung-31** (Personal-/Realsicherheiten): korrekt [1,2,2].
  Erklaerung: Bürgschaft=Personalsicherheit(1), Grundschuld=Realsicherheit(2),
  Sicherungsübereignung=Realsicherheit(2). **konsistent, kein Befund**.
- **wiso-lp-konjunktur-indikatoren-30** (Arbeitslosigkeitsarten): korrekt [1,2,3,4].
  Erklaerung: Dachdecker Winter=saisonal(1), Möbelhersteller Rezession=konjunkturell(2),
  Kohlebergbau Strukturwandel=strukturell(3), Fachkraft Übergang=friktionell(4). **konsistent, kein Befund**.

### Positionsbezogene Formulierungen

Systematische Prüfung aller erklaerung/loesung-Felder aller 42 Zuordnungseinträge auf Muster
wie „Option X", „die erste/zweite Option", „die unterste/oberste Zeile": **0 Befunde**.

### Altproblem-Rest: Reihenfolge-Kodierung

Bekanntes Altproblem: 19 Einträge waren früher als Reihenfolge kodiert (korrekt-Array als Positionsfolge).
Nach der Zuordnungs-Runde (2026-09-08) sind diese korrekt als Ziffern-Zuordnung modelliert.
Geprüfte Reihenfolge-Einträge im aktuellen Bestand:
- wiso-2023w-a11, wiso-2019s-a5, wiso-2018s-a7: Ziffern-Legende 1–5 = Arbeitsschritte;
  korrekt-Werte = Schrittnummer (nicht Position) → korrekte Modellierung; lösbar und eindeutig.
  Alle drei PDF-bestätigt. **kein Rest des Altproblems gefunden**.

### Korrekturen

**Keine Korrekturen vorgenommen.** Alle 42 Zuordnungs-Einträge sind strukturell korrekt
(Strukturtest grün) und inhaltlich konsistent (loesung/erklaerung vs. korrekt-Ziffern
widerspruchsfrei; 32 von 42 Einträgen zusätzlich per Original-PDF verifiziert).

### Offene Punkte

- lernpaare/kbz.json, lernpaare/buchfuehrung.json, lernpaare/muendlich.json enthalten
  keine Zuordnungs-Einträge (geprüft, kein Befund).
- aufgaben/buchfuehrung.json, aufgaben/muendlich.json enthalten keine Zuordnungs-Einträge.
- 10 Lernpaar-Einträge ohne quellTermin: fachliche Prüfung via erklaerung durchgeführt,
  kein PDF-Abgleich möglich (generierte Einträge ohne Originaltermin). Inhaltlich plausibel.

## Verbesserungsrunde 2 (2026-09-16) — Inhaltsausbau WiSo-Lernzettel

Alle 11 WiSo-Themen (`public/data/themen/wiso.json`, nur Feld `lernzettel`) auf 6–7
gehaltvolle `##`-Abschnitte ausgebaut (Struktur je Abschnitt: Einordnung → Kernwissen
als Liste/Tabelle → durchgerechnetes Beispiel → **Merke:**). Bestehende Inhalte wurden
vertieft, nicht gelöscht; geschützte Registry-Titel wörtlich beibehalten. `npm test`
grün (257/257), Folienzerlegung an `/\n(?=## )/` stichprobenartig geprüft (markt-preisbildung,
berufsausbildung-arbeitsrecht) — jeder Abschnitt wird sauber zu einer Folie.

### Fachliche Entscheidungen / Vorbehalte

- **Sozialversicherungs-Beitragssätze (berufsausbildung-arbeitsrecht):** Tabelle mit
  „(2026, ca.)" gekennzeichnet. RV 18,6 %, AV 2,6 %, KV 14,6 % + Zusatzbeitrag sind seit
  Jahren stabil; **PV 3,6 %** und der kinderlosen-Zuschlag können sich ändern — bewusst als
  „ca." markiert statt „(Stand: prüfen)". Zahlenbeispiel (3.000 € × 18,6 % → je 279 €) ist
  rechnerisch unabhängig vom exakten Satz gültig.
- **KSchG-Schwellenwert „mehr als 10 Arbeitnehmer":** gilt für Neueinstellungen ab 2004;
  Alt-Betriebe haben teils die 5er-Grenze. Für Prüfungszwecke ist die 10er-Grenze der
  Standard und wurde übernommen.
- **Mindestlohn / konkrete Eurobeträge:** bewusst NICHT genannt (ändern sich), zeitlos
  formuliert (Mindestlohn nur als Beispiel für „Mindestpreis / Preisuntergrenze" in
  markt-preisbildung, ohne Betrag).
- **Zeichenumfang über Zielkorridor (2500–4500):** Die inhaltlich dichtesten Rechtsthemen
  liegen darüber — berufsausbildung-arbeitsrecht ~8.200, rechtsformen-vollmachten ~6.700,
  konjunktur-indikatoren ~5.100, finanzierung-kreditsicherung ~5.100. Bewusst akzeptiert:
  Diese Themen sind laut `aufgaben/wiso.json` mit Abstand am häufigsten geprüft (Arbeitsrecht
  86, Rechtsformen 68, Finanzierung 49 Aufgaben) und tragen mehrere geschützte Registry-Titel.
  Das Schema kennt kein `maxLength` für `lernzettel`; ein Abschnitt = eine Folie bleibt lesbar.
- **§-Verweise:** ausschließlich Kürzel aus der Task-6-Map verwendet (BGB, HGB, BBiG, BetrVG,
  JArbSchG). Grundgesetz durchgängig als „Art. 9 GG" (nicht „§ … GG"). SGB nicht verlinkt
  (im Sozialversicherungs-Abschnitt bewusst ohne §-Verweis ausformuliert).

## Verbesserungsrunde 2 (2026-09-16) — Inhaltsausbau KBZ-Lernzettel

Alle 6 KBZ-Themen (`public/data/themen/kbz.json`, nur Feld `lernzettel`) auf jeweils **7
gehaltvolle `##`-Abschnitte** ausgebaut (Struktur je Abschnitt: Einordnung → Kernwissen als
Liste/Tabelle → durchgerechnetes Beispiel → **Merke:**). Bestehende Abschnitte wurden vertieft
und um KBZ-Schwerpunkte ergänzt, nicht gelöscht. `npm test` grün (257/257). Folienzerlegung an
`/\n(?=## )/` stichprobenartig geprüft (rechnung-umsatzsteuer, buchfuehrung-kontierung) — je 7
saubere Folien.

Neu ergänzte, laut `aufgaben/kbz.json` stark geprüfte Schwerpunkte, die zuvor fehlten:
- **Bezugskalkulation** (Einstandspreis-Schema) in buchfuehrung-kontierung.
- **Skonto/USt-Korrektur** (§ 17 UStG) und **Kleinunternehmer** (§ 19 UStG) in rechnung-umsatzsteuer
  (rechnung 313, skonto 82, vorsteuer 66 Aufgaben).
- **Verzugszinsen** (§ 288 BGB, 9 %-Punkte B2B + 40 € Pauschale) und **Leistungsstörungs-Überblick**
  in kaufvertrag-stoerungen.
- **Vorwärts-/Rückwärtskalkulation** und **Zuschlagskalkulation mit Zahlen** in kostenrechnung.
- **Personalbedarfs-/Beschaffungsplanung** und **Brutto-Netto** in personalwirtschaft.
- **Kommunikationsmodell** und **DIN-5008-Schriftverkehr** in kundenkommunikation.

### Fachliche Entscheidungen / Vorbehalte

- **Geschützter Titel „Kaufvertrag und Leistungsstörungen":** liegt laut Grep in `wiso.json`,
  NICHT in `kbz.json` (dortiger Titel: „Kaufvertrag & Kaufvertragsstörungen"). In kbz.json somit
  kein Registry-Titel-Zwang; bestehende `##`-Titel wurden dennoch wörtlich beibehalten bzw. nur
  ergänzt, um Registry-/Snapshot-Tests nicht zu brechen.
- **Verzugszinssätze (§ 288 BGB):** 5 %-Punkte über Basiszins (Verbraucher) bzw. 9 %-Punkte (B2B)
  + 40 € Pauschale sind gesetzlich fixiert und zeitlos; der Basiszins im Rechenbeispiel (3,62 %)
  ist als Beispielwert gekennzeichnet, das Rechenverfahren gilt unabhängig davon.
- **SV-Beitrag (personalwirtschaft):** RV 18,6 % genannt; Zahlenbeispiel (3.000 € × 9,3 % AN-Anteil)
  ausdrücklich als „unabhängig vom exakten Satz" markiert. PV/KV-Zusatzbeitrag bewusst nicht beziffert.
- **Aufbewahrungsfrist:** durchgängig **8 Jahre** (Rechtsstand 2026) für Rechnungen/Belege.
- **Zeichenumfang:** 5 Themen liegen im/nahe am Korridor (3.493–4.415); kaufvertrag-stoerungen ~4.913,
  bewusst leicht darüber — mit 187 Aufgaben und Präsenz in **jeder** Prüfungssaison das mit Abstand
  häufigste KBZ-Thema. Schema kennt kein `maxLength`; ein Abschnitt = eine Folie bleibt lesbar.
- **§-Verweise:** nur Kürzel aus der Map (BGB, HGB, UStG). KBZ-typisch verlinkt: §§ 433 ff. BGB,
  § 145/437 BGB, § 377 HGB, § 286/288 BGB, § 14/17/19 UStG, § 195/212 BGB. SGB VII nur als Text.

## Verbesserungsrunde 2 (2026-09-16) — Inhaltsausbau BuFü-Lernzettel

Alle 6 Themen (`public/data/themen/buchfuehrung.json`, nur Feld `lernzettel`) auf **7–8
gehaltvolle `##`-Abschnitte** ausgebaut (Struktur je Abschnitt: Einordnung → Kernwissen als
Liste/Tabelle → durchgerechnetes Beispiel → **Merke:**). Jeder Abschnitt mit Rechenweg trägt
einen Buchungssatz „Soll an Haben" mit Beträgen. Bestehende Abschnitte wurden vertieft und um
Prüfungsschwerpunkte ergänzt, nicht gelöscht. `npm test` grün (257/257). Folienzerlegung an
`/\n(?=## )/` stichprobenartig geprüft (buchungssaetze-kontierung 8 Folien, zuschlagskalkulation
7 Folien) — alle Einzelfolien < 1.600 Zeichen, längste 1.102 Zeichen.

Neu ergänzte, laut `aufgaben/buchfuehrung.json` + den 18 abgeleiteten 2025W-Übungen stark
geprüfte Schwerpunkte, die zuvor fehlten:
- **Anlagevermögen aktivieren + lineare AfA** (Fuhrpark 0840, Anschaffungsnebenkosten, GWG,
  zeitanteilige AfA, Buchung 6520 an 0840) in buchungssaetze-kontierung — 2025W a9–a13.
- **Belege & Aufbewahrungsfristen** (§ 238 ff./257 HGB, § 147 AO, Rechtsstand 2026) neu.
- **Energie-Abschlag direkt gegen Bank** (6050, „noch nicht gebucht") in Standard-Buchungssätzen — 2025W a8.
- **Vorsteuerabzug-Voraussetzungen** (§ 14/15 UStG, Rechnungspflichtangaben, Kleinbetrag § 33 UStDV)
  und **Kleinunternehmerregelung** (§ 19 UStG) in umsatzsteuer.
- **Rückwärtskalkulation** (Angebotspreis 5 % über Selbstkosten → × 100 ÷ 105) und **Angebots-/
  Handelskalkulation** (Barverkaufs-/Ziel-/Listenverkaufspreis) in zuschlagskalkulation — 2025W a1–a4, a17/a18.
- **Kostenauflösung per Differenzenquotient** und **Beschäftigungsgrad/Leerkosten/Kostenremanenz**
  in stueckkosten-kostenrechnung.
- **Preisuntergrenze/Zusatzauftrag** und **Gesamt-DB/Betriebsergebnis** in deckungsbeitrag-breakeven.
- **Normalzuschlagssätze bilden** und **Nachkalkulation als Steuerungswert** in normalkosten-kostenabweichung.

### Fachliche Entscheidungen / Vorbehalte

- **Aufbewahrungsfristen (Rechtsstand 2026):** sauber differenziert — **Buchungsbelege 8 Jahre**
  (seit 2025, 4. Bürokratieentlastungsgesetz), **Handelsbücher/Inventare/Jahresabschlüsse 10 Jahre**,
  **Handels-/Geschäftsbriefe 6 Jahre** (§ 257 HGB, § 147 AO).
- **AfA-Beispiel (2025W):** AK je E-Transporter 60.498 € (Listenpreis − 12 % Rabatt + Anschaffungs-
  nebenkosten Kennzeichen/Zulassung), ND 6 Jahre → 10.083 €/Jahr, bei Kauf im November nur 2/12 =
  1.680,50 €; Sammelabschreibung 3 × = 5.041,50 € (6520 an 0840). Zahlen aus den abgeleiteten
  Übungen bufu-2025w-a9..a13 übernommen und rechnerisch nachvollzogen.
- **GWG-Grenzen:** netto 800 € Sofortabschreibung, Sammelposten 250–1.000 € (zeitlos, ohne Jahres-
  bezug genannt).
- **Kleinunternehmerregelung (§ 19 UStG):** Umsatzgrenzen bewusst NICHT beziffert (wurden zuletzt
  angehoben, änderungsanfällig) — sinngemäß „gesetzliche Grenze" formuliert.
- **Zeichenumfang:** 5 Themen im/nahe am Korridor (3.640–4.331). **buchungssaetze-kontierung ~5.828**,
  bewusst über 4.500 — mit 20 Basis- und 8 der 18 2025W-Aufgaben das mit Abstand am häufigsten
  geprüfte BuFü-Thema; trägt zusätzlich die neuen Pflichtinhalte AfA/Anlagevermögen und Aufbewahrung.
  Schema kennt kein `maxLength`; ein Abschnitt = eine Folie bleibt lesbar (längste 1.102 Zeichen).
- **§-Verweise:** nur Kürzel aus der `paragraphen.ts`-Map verlinkt (HGB, UStG, EStG, AO). BuFü-typisch:
  §§ 238 ff./253/257 HGB, § 147 AO, § 7 EStG, § 12/14/15/17/19 UStG. **§ 33 UStDV** bewusst als
  Klartext belassen (UStDV ist nicht in der Kürzel-Map; wird nicht verlinkt, bleibt aber korrekt).
- **Registry-Titel:** keine geschützten Titel in buchfuehrung.json (liegen laut Grep in wiso.json);
  bestehende `##`-Überschriften nur ergänzt/vertieft, das Feld `name` (Themen-Titel) unangetastet.
