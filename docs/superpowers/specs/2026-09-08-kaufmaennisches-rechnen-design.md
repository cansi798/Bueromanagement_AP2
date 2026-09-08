# Spec: Kachel „Kaufmännisches Rechnen"

Datum: 2026-09-08 · Status: entworfen, vom Nutzer abschnittsweise freigegeben

## Ziel

Eine neue Übungs-Kachel auf der Startseite, in der Schüler alle Rechenarten
trainieren, die in den WiSo-Prüfungen (AP Teil 2, KBM) vorkommen — plus die
dafür nötigen Grundlagen. Jedes Kapitel bietet eine Kurzerklärung mit Formel
und Mini-Beispiel, unbegrenzt generierte Übungsaufgaben mit Zahleneingabe und
Schritt-für-Schritt-Lösungsweg sowie die Original-Prüfungsaufgaben.

Grundlage der Kapitelauswahl: Analyse der 485 extrahierten WiSo-Aufgaben
(17 Termine 2017W–2025S), davon 36 echte Rechenaufgaben.

## Architektur-Entscheidung

Eigenständige Seite nach dem Glossar-Muster (Ansatz A):

- **Kein** 5. Bereich in `bereiche.json` — die Bereichs-Maschinerie (Stufen,
  Landkarte, Simulation, Karteikarten) passt nicht zum Rechenüben und müsste
  überall Sonderfälle bekommen.
- Neue Routen `#/rechnen` (Kapitelübersicht) und `#/rechnen/:kapitelId`
  (Übungsseite), neue Kachel auf Home neben „Begriffe & Formeln"
  (Farbe `rose`, hebt sich von den vier Bereichsfarben ab).

## Kapitel (10)

**Gruppe „grundlagen":**

1. `dreisatz` — gerader und ungerader Dreisatz
2. `prozentrechnung` — Grundwert, Prozentwert, Prozentsatz; vermehrter/
   verminderter Grundwert
3. `zinsrechnung` — Jahres-, Monats-, Tageszinsen (kaufmännische Methode
   30/360, wie in der Prüfung)

**Gruppe „pruefung" (aus den WiSo-Terminen abgeleitet):**

4. `kg-gewinnverteilung` — 4 % Kapitalverzinsung, Restgewinn nach Vertrag
   oder Köpfen (häufigster Rechentyp)
5. `gleichgewichtspreis-umsatz` — Markttabellen lesen, Umsatz = Preis × Menge,
   maximaler Umsatz
6. `darlehen` — Fälligkeits-, Tilgungs-, Annuitätendarlehen: Zinsen,
   Restschuld, Gesamtaufwand
7. `leasing` — Gesamtkosten über die Laufzeit (Sonderzahlung + Raten + Restwert)
8. `wirtschaftlichkeit-produktivitaet` — Ertrag/Aufwand, Output/Input
9. `konjunktur-indikatoren` — Inflationsrate, Arbeitslosenquote, prozentuale
   Veränderungen
10. `energie-betriebskosten` — Verbrauch × Preis, Einsparungen in € und %

Jedes Kapitel hat drei Bausteine: Kurzerklärung, Generator-Übung,
feste Prüfungsaufgaben (Kapitel der Gruppe „grundlagen" können 0 feste
Aufgaben haben, wenn kein Original existiert).

## Datenmodell

### `public/data/rechnen.json` (neu, schema-bewacht)

```jsonc
{
  "kapitel": [
    {
      "id": "kg-gewinnverteilung",
      "gruppe": "pruefung",            // oder "grundlagen"
      "titel": "KG-Gewinnverteilung",
      "kurz": "…",                      // Kartentext auf der Übersicht
      "erklaerung": "Markdown mit KaTeX: Formel + durchgerechnetes Mini-Beispiel",
      "aufgaben": [
        {
          "id": "rechnen-kg-01",
          "text": "Markdown",
          "loesungswert": 420000,       // Zahl (Punkt-Dezimal im JSON)
          "einheit": "€",              // "€" | "%" | "Stück" | "kWh" | "" …
          "toleranz": 0.01,             // absoluter Betrag; 0 erlaubt nur exakt
          "loesungsweg": "Markdown, Schritt für Schritt",
          "quelle": { "sammlung": 12, "aufgabe": "2" }   // optional (nur Originale)
        }
      ]
    }
  ]
}
```

Die 36 Original-Rechenaufgaben werden aus `public/data/aufgaben/wiso.json`
**kopiert** und ins Zahleneingabe-Format umgeformt (Lösungswert + Lösungsweg
aus der vorhandenen `loesung`/`erklaerung` abgeleitet). `aufgaben/wiso.json`
bleibt unverändert — Themen-Quiz und Simulationen dürfen sich nicht ändern.
Quellenangabe nur anonymisiert über die Sammlungsnummer (`termine.ts`-Regel).

Übernahmeregeln für Originale:

- Nur Aufgaben mit eindeutigem Zahlenergebnis werden übernommen (reine
  Wissensfragen wie „Mindeststammkapital der GmbH" bleiben draußen).
- Aufgaben mit Markttabellen-Anlage betten die Tabelle als GFM-Tabelle in
  den Aufgabentext ein.
- Reine Schaubild-Ablese-Aufgaben ohne tabellarisch darstellbare Daten
  werden ausgelassen und im `content-pipeline/audit-report.md` dokumentiert.
  Die Zahl „36" ist daher eine Obergrenze, nicht das Soll.

### `src/lib/rechnen.ts` (neu)

Pro Kapitel eine Generator-Funktion. Signatur einheitlich:

```ts
type GenerierteAufgabe = {
  text: string          // Markdown
  loesungswert: number
  einheit: string
  toleranz: number
  loesungsweg: string   // Markdown, aus denselben Zwischenwerten aufgebaut
}
type Generator = () => GenerierteAufgabe
export const GENERATOREN: Record<string, Generator>  // Schlüssel = kapitel.id
```

Regeln für Generatoren:

- „Glatte", prüfungstypische Werte (z. B. Kapitaleinlagen in
  10.000-€-Schritten, Zinssätze in 0,25-%-Schritten).
- Lösungsweg und Lösungswert entstehen aus denselben Zwischenvariablen —
  sie können nie auseinanderlaufen.
- Keine negativen oder unsinnigen Zwischenergebnisse (z. B. Restgewinn ≥ 0).
- Jedes Kapitel hat genau einen Generator; Varianten (z. B. Darlehensart)
  würfelt der Generator intern.

## UI

### Home

Neue Kachel „Kaufmännisches Rechnen" im selben Kachel-Muster wie
„Begriffe & Formeln", Link auf `#/rechnen`.

### `#/rechnen` — Kapitelübersicht (`src/pages/Rechnen.tsx`)

Zwei Gruppen-Überschriften („Grundlagen", „Prüfungstypen WiSo"), darunter
Karten-Grid. Jede Karte: Titel, Kurztext, Fortschritt („12 von 15 richtig"
für feste Aufgaben + Zähler der Übungsrunden).

### `#/rechnen/:kapitelId` — Übungsseite (`src/pages/RechnenKapitel.tsx`)

Drei Tabs:

1. **Erklärung** — `erklaerung`-Markdown über die bestehende Pipeline
   (remark-math + rehype-katex + remark-gfm).
2. **Üben** — Generator-Modus: Aufgabe anzeigen → Zahleneingabe → „Prüfen" →
   richtig/falsch → Lösungsweg klappt auf → „Neue Aufgabe" würfelt frische
   Werte.
3. **Prüfungsaufgaben** — feste Aufgaben nacheinander, gleiche Mechanik,
   Quellenhinweis „Aufgabensammlung N, Aufgabe X". Gelöste Aufgaben sind
   markiert und können erneut geübt werden.

### `src/components/RechnenAufgabe.tsx` (eine Komponente für beide Tabs)

Props: Aufgabe (generiert oder fest) + Callback `onErgebnis(richtig)`.
Verhalten:

- Zahleneingabe akzeptiert deutsches Format: `1.234,56`, `1234,56`, `1234.56`
  (Fallback), führende/folgende Leerzeichen, optionales Einheitszeichen wird
  ignoriert.
- Leere oder unparsebare Eingabe → Hinweis „Bitte eine Zahl eingeben",
  zählt NICHT als falsch.
- |Eingabe − Lösungswert| ≤ Toleranz → richtig.
- Knapp daneben (innerhalb 10 × Toleranz bzw. bei Toleranz 0 innerhalb 1 %
  des Lösungswerts) → falsch, aber mit Hinweis „Knapp daneben — prüfe deine
  Rundung".
- Nach dem Prüfen: Lösungsweg (Markdown/KaTeX) aufgeklappt, Eingabe gesperrt
  bis „Neue Aufgabe"/„Weiter".

## Fortschritt & Sync

Neuer Storage-Key `kbm.v1.rechnen` (über `storage.ts`-Muster):

```jsonc
{
  "kapitel": {
    "kg-gewinnverteilung": {
      "richtig": 14, "falsch": 3,          // Generator-Übungen kumuliert
      "geloest": ["rechnen-kg-01", "…"]   // feste Aufgaben, einmal richtig
    }
  }
}
```

- Sync läuft automatisch über den bestehenden `sync.ts`-Push mit
  (der synct alle `kbm.v1.*`-Keys); am Backend keine Änderung nötig.
  Prüfen: `statistik.php` entpackt nur `kbm.v1.fortschritt` — der neue Key
  wird gespeichert, aber nicht ausgewertet; Lehrer-Auswertung des
  Rechnen-Fortschritts ist bewusst NICHT Teil dieser Spec.
- **Lernstand** (`Lernstand.tsx`): neuer Block „Kaufmännisches Rechnen" mit
  einem Balken pro Kapitel (Anteil richtig an allen Versuchen + gelöste
  feste Aufgaben).

## Tests (Vitest)

1. **Schema-Audit** — `rechnen.json` gegen erweitertes
   `schema/content.schema.json` (neue Definition `rechnenKapitel`); prüft
   u. a.: IDs eindeutig, `gruppe` gültig, `toleranz ≥ 0`, `quelle.sammlung`
   existiert in der SAMMLUNGEN-Map.
2. **Generator-Tests** — pro Generator ≥ 200 Durchläufe: Wert endlich und im
   plausiblen Bereich, keine negativen Zwischenwerte, Lösungsweg enthält den
   formatierten Endwert, Einheit gesetzt.
3. **Eingabe-Parser** — deutsches Zahlenformat inkl. Randfälle (leer,
   Buchstaben, doppeltes Komma, Tausenderpunkte).
4. **Fortschritts-Logik** — richtig/falsch-Zählung, `geloest`-Markierung
   idempotent.
5. **Render-Smoke** — Übersicht und Kapitelseite rendern mit echten Daten.

## Nicht in dieser Spec (bewusst ausgeklammert)

- Lehrer-Panel-Auswertung des Rechnen-Fortschritts (`statistik.php`).
- Leitner-Wiederholung für Rechenaufgaben (Generator macht Wiederholung
  über frische Werte ohnehin sinnvoller).
- KI-Bewertung der Lösungswege.
- Kalkulation/Handelskalkulation (bereits im BuFü-Bereich abgedeckt) sowie
  Währungs-/Verteilungs-/Durchschnittsrechnung (kommen in WiSo nicht vor).

## Teilauftrag 2 (blockiert): 2025 Winter WiSo nachtragen

Das WiSo-PDF für 2025 Winter existiert nirgends im Share (geprüft am
2026-09-08; in `2025 Winter/` liegen nur KBZ-Prüfung und Lösungsbogen).
Sobald der Nutzer die Datei ablegt (z. B. `2025 Winter/…WiSo….pdf`):
Extraktion nach `content-pipeline/EXTRAKTION.md` (Staging → merge-staging.mjs),
Sammlungsnummer in `termine.ts` + `termine-intern.md` ergänzen (neue Nummer,
nie umverteilen), Vorbehalte in `audit-report.md` dokumentieren. Danach
prüfen, ob neue Rechenaufgaben für die Rechnen-Kachel dabei sind.

## Umsetzungsreihenfolge (Grobplan für writing-plans)

1. Schema + `rechnen.json`-Gerüst (Kapitel ohne Aufgaben) + Audit-Test
2. Eingabe-Parser + `RechnenAufgabe.tsx` (TDD)
3. Generatoren Kapitel für Kapitel (TDD, Grundlagen zuerst)
4. Seiten + Routen + Home-Kachel
5. Original-Aufgaben umformen und einpflegen
6. Fortschritt + Lernstand-Block
7. Erklärungen ausformulieren, PDFs/dist unberührt lassen (kein neuer
   Download in dieser Runde)
