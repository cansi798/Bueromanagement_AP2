// Einmalskript (2026-09): trägt die im PDF-Vollaudit gefundenen fehlenden
// Anlagen-Darstellungen als anlagenDiagramm (Rough.js-Typen linie/balken/
// organigramm/schilder/kreislauf) bzw. verbesserte anlagenText ein.
// Quelle je Eintrag: Original-PDF des Termins (Ablesung dokumentiert im
// audit-report). Idempotent: vorhandene anlagenDiagramm werden nicht ersetzt.
// Aufruf: node content-pipeline/merge-anlagen-diagramme.mjs
import fs from 'node:fs'

const KREISLAUF_STROEME = (ka, kg, al, ek) => [
  { text: 'Geldstrom: Konsumausgaben', richtung: ka },
  { text: 'Güterstrom: Konsumgüter', richtung: kg },
  { text: 'Güterstrom: Arbeitsleistungen', richtung: al },
  { text: 'Geldstrom: Einkommen', richtung: ek },
]

// x-Werte 0..3000 für die Kostenrechnungs-Geraden (kbz-2025s-a6-5)
const X6 = ['0', '500', '1000', '1500', '2000', '2500', '3000']
const punkte = (xs, fn) => xs.map((x) => ({ x, y: fn(Number(x)) }))
const X5 = ['0', '100', '200', '300', '400', '500', '600', '700', '800']

const DIAGRAMME = {
  // ---------- WiSo ----------
  'wiso-2019s-a10': {
    typ: 'kreislauf',
    titel: 'Abbildung zur Aufgabe: fünf Skizzen des Wirtschaftskreislaufs',
    varianten: [
      { name: 'Skizze 1', stroeme: KREISLAUF_STROEME('links', 'links', 'rechts', 'rechts') },
      { name: 'Skizze 2', stroeme: KREISLAUF_STROEME('links', 'rechts', 'rechts', 'links') },
      { name: 'Skizze 3', stroeme: KREISLAUF_STROEME('rechts', 'rechts', 'links', 'links') },
      { name: 'Skizze 4', stroeme: KREISLAUF_STROEME('links', 'rechts', 'links', 'rechts') },
      { name: 'Skizze 5', stroeme: KREISLAUF_STROEME('rechts', 'links', 'rechts', 'links') },
    ],
  },
  'wiso-2019w-a17': {
    typ: 'schilder',
    titel: 'Die fünf abgebildeten Sicherheitszeichen',
    zeichen: [
      { nr: 'Zeichen 1', form: 'quadrat', farbe: 'gruen', innen: '+', text: 'grün/weiß:\nKreuz' },
      { nr: 'Zeichen 2', form: 'dreieck', farbe: 'gelb', innen: '!', text: 'gelb/schwarz:\nAusrufezeichen' },
      { nr: 'Zeichen 3', form: 'kreis', farbe: 'rot', innen: '⃠', text: 'rot/weiß: Kreis\nmit Querbalken' },
      { nr: 'Zeichen 4', form: 'quadrat', farbe: 'rot', text: 'rot/weiß: Hand mit\nFlamme (Löschgerät)' },
      { nr: 'Zeichen 5', form: 'kreis', farbe: 'blau', text: 'blau/weiß: Hand\nmit Handschuh' },
    ],
  },
  'wiso-2019w-a22': {
    typ: 'schilder',
    titel: 'Die fünf abgebildeten EPK-Symbole',
    zeichen: [
      { nr: 'Symbol 1', form: 'sechseck', farbe: 'grau' },
      { nr: 'Symbol 2', form: 'raute', farbe: 'weiss' },
      { nr: 'Symbol 3', form: 'kreis', farbe: 'weiss', innen: 'V' },
      { nr: 'Symbol 4', form: 'kreis', farbe: 'weiss', innen: 'XOR' },
      { nr: 'Symbol 5', form: 'kreis', farbe: 'weiss', innen: '∧' },
    ],
  },
  'wiso-2019w-a18': {
    typ: 'organigramm',
    titel: 'Organigramm des neuen Unternehmens',
    knoten: [
      { id: 'gf', text: 'Geschäftsführung\nChristoph Beier' },
      { id: 'orgit', text: 'Organisation/IT\nJan Fischer', unter: 'gf', stab: true },
      { id: 'einkauf', text: 'Einkauf\nNatalie Fröhlich', unter: 'gf' },
      { id: 'marketing', text: 'Online-Marketing\nSaskia Clark', unter: 'gf' },
      { id: 'vertrieb', text: 'Online-Vertrieb\nPhillip Schwan', unter: 'gf' },
    ],
  },
  'wiso-2020w-a11': {
    typ: 'linie',
    titel: 'Nachfrage und Angebot auf dem Büromöbelmarkt',
    xAchse: 'Menge in Stück',
    yAchse: 'Preis',
    einheit: 'EUR',
    serien: [
      {
        name: 'Nachfragekurve',
        punkte: ['50.000', '60.000', '70.000', '80.000', '90.000', '100.000'].map((x, i) => ({
          x,
          y: [3000, 2800, 2600, 2400, 2200, 2000][i],
        })),
      },
      {
        name: 'Angebotskurve',
        punkte: ['50.000', '60.000', '70.000', '80.000', '90.000', '100.000'].map((x, i) => ({
          x,
          y: [2000, 2200, 2400, 2600, 2800, 3000][i],
        })),
      },
    ],
  },
  'wiso-2020w-a24': {
    typ: 'schilder',
    titel: 'Die fünf abgebildeten Sicherheitsschilder',
    zeichen: [
      { nr: 'Schild 1', form: 'kreis', farbe: 'rot', innen: '⃠', text: 'weiß/rot: rund,\nroter Querbalken' },
      { nr: 'Schild 2', form: 'dreieck', farbe: 'gelb', text: 'gelb/schwarz:\nDreieck' },
      { nr: 'Schild 3', form: 'quadrat', farbe: 'gruen', text: 'grün/weiß: laufende\nPerson mit Pfeil' },
      { nr: 'Schild 4', form: 'quadrat', farbe: 'rot', text: 'rot/weiß:\nFlamme' },
      { nr: 'Schild 5', form: 'raute', farbe: 'weiss', text: 'weiß/rot/schwarz:\nGefahrstoff-Raute' },
    ],
  },
  'wiso-2021w-a28': {
    typ: 'schilder',
    titel: 'Das abgebildete Sicherheitsschild',
    zeichen: [
      {
        nr: 'Schild',
        form: 'quadrat',
        farbe: 'gruen',
        text: 'grünes Quadrat: vier Personen,\nPfeile aus den Ecken nach innen',
      },
    ],
  },
  'wiso-2022w-a7': {
    typ: 'organigramm',
    titel: 'Geplante Tochtergesellschaft (Belgien)',
    knoten: [
      { id: 'gf', text: 'Geschäftsführung\nMax Wolf' },
      { id: 'markt', text: 'Marktanalyse\nInsa Bader (extern)', unter: 'gf', stab: true },
      { id: 'einkauf', text: 'Einkauf\nIngo Waldeck', unter: 'gf' },
      { id: 'verwaltung', text: 'Verwaltung\nArnold Roter', unter: 'gf' },
      { id: 'vertrieb', text: 'Vertrieb\nBettina Scholz', unter: 'gf' },
    ],
  },
  'wiso-2025s-a27': {
    typ: 'schilder',
    titel: 'Sicherheitszeichen im Fluchtwegplan',
    zeichen: [
      { nr: 'Zeichen 1', form: 'quadrat', farbe: 'gruen', text: 'vier Personen,\nPfeile nach innen' },
      { nr: 'Zeichen 2', form: 'quadrat', farbe: 'gruen', text: 'Telefonhörer\nmit Kreuz' },
      { nr: 'Zeichen 3', form: 'quadrat', farbe: 'rot', text: 'Hand drückt\nauf Punkt' },
      { nr: 'Zeichen 4', form: 'kreis', farbe: 'rot', innen: '⃠', text: 'durchgestrichene\nFlamme' },
      { nr: 'Zeichen 5', form: 'quadrat', farbe: 'rot', text: 'Flamme mit\nLöschgerät' },
    ],
  },
  'wiso-2023w-a13': {
    typ: 'kreislauf',
    titel: 'Abbildung zur Aufgabe: fünf Skizzen des Wirtschaftskreislaufs',
    varianten: [
      { name: 'Skizze 1', stroeme: KREISLAUF_STROEME('links', 'links', 'rechts', 'rechts') },
      { name: 'Skizze 2', stroeme: KREISLAUF_STROEME('links', 'rechts', 'rechts', 'links') },
      { name: 'Skizze 3', stroeme: KREISLAUF_STROEME('rechts', 'rechts', 'links', 'links') },
      { name: 'Skizze 4', stroeme: KREISLAUF_STROEME('links', 'rechts', 'links', 'rechts') },
      { name: 'Skizze 5', stroeme: KREISLAUF_STROEME('rechts', 'links', 'rechts', 'links') },
    ],
  },
  'wiso-2024s-a31': {
    typ: 'organigramm',
    titel: 'EPK-Ausschnitt: Ablauf des Zahlungsverkehrs (beim ? fehlt ein Symbol)',
    knoten: [
      { id: 'e1', text: 'Zahlung ist eingegangen\n(Sechseck = Ereignis)' },
      { id: 'f1', text: 'Prüfen des Betrages\n(Rechteck = Funktion)', unter: 'e1' },
      { id: 'frage', text: '?', unter: 'f1' },
      { id: 'e2', text: 'Betrag stimmt\n(Ereignis)', unter: 'frage' },
      { id: 'e3', text: 'Betrag stimmt nicht\n(Ereignis)', unter: 'frage' },
    ],
  },
  'wiso-2023s-a9': {
    typ: 'organigramm',
    titel: 'Organigramm der Jana Loft KG (obere Ebenen; vollständige Struktur siehe Anlage)',
    knoten: [
      { id: 'gl', text: 'Geschäftsleitung\nJana Loft' },
      { id: 'pr', text: 'Public Relations\nSabine Marx', unter: 'gl', stab: true },
      { id: 'orgit', text: 'Organisation/IT\nKlaus Klein', unter: 'gl', stab: true },
      { id: 'einkauf', text: 'Einkauf\nManfred Bast', unter: 'gl' },
      { id: 'produktion', text: 'Produktion\nRalf Obert', unter: 'gl' },
      { id: 'verkauf', text: 'Verkauf\nSilke Beier', unter: 'gl' },
      { id: 'marketing', text: 'Marketing\nSusanne Hausmann', unter: 'gl' },
      { id: 'personal', text: 'Personal\nAnne Ohlsen', unter: 'gl' },
      { id: 'finanzen', text: 'Finanzen\nWerner Fitschen', unter: 'gl' },
      { id: 'verwaltung', text: 'Verwaltung\nMargot Erler', unter: 'gl' },
    ],
  },
  // ---------- KBZ ----------
  'kbz-2025s-a6-5': {
    typ: 'linie',
    titel: 'Entwicklung der Kosten und Erlöse — Schubladensystem „Berlin"',
    xAchse: 'Stückzahl',
    yAchse: 'Wert',
    einheit: 'EUR',
    serien: [
      { name: 'A (steilste Gerade ab 0)', punkte: punkte(X6, (x) => x * 50) },
      { name: 'B (untere Gerade ab 0)', punkte: punkte(X6, (x) => Math.round(x * 33.33)) },
      { name: 'weitere Gerade (beginnt über 0)', punkte: punkte(X6, (x) => 20000 + Math.round(x * 33.33)) },
    ],
  },
  'kbz-2025w-a5-2': {
    typ: 'linie',
    titel: 'Kosten- und Erlössituation des Schreibtisches „Labora"',
    xAchse: 'Menge in Stück',
    yAchse: 'Kosten/Erlöse',
    einheit: 'EUR',
    serien: [
      { name: 'Kennziffer 1', punkte: punkte(X5, (x) => Math.round(x * 695.5)) },
      { name: 'Kennziffer 2', punkte: punkte(X5, (x) => 136650 + x * 240) },
      { name: 'Kennziffer 4', punkte: punkte(X5, () => 136650) },
    ],
  },
  'kbz-2025w-a3-5': {
    typ: 'balken',
    titel: 'Bewertung des Bewerbungsverfahrens der Jana Loft KG',
    xAchse: 'Aussage',
    yAchse: 'Anteil',
    einheit: '%',
    serien: [
      {
        name: 'Ja',
        punkte: [
          { x: 'Keine Absage', y: 63 },
          { x: 'Verfahren umständlich', y: 42 },
          { x: 'Ansprechpartner fehlt', y: 15 },
          { x: 'Keine Rückmeldung', y: 18 },
          { x: 'Zu langsam', y: 35 },
        ],
      },
      {
        name: 'Vielleicht',
        punkte: [
          { x: 'Keine Absage', y: 0 },
          { x: 'Verfahren umständlich', y: 35 },
          { x: 'Ansprechpartner fehlt', y: 41 },
          { x: 'Keine Rückmeldung', y: 72 },
          { x: 'Zu langsam', y: 53 },
        ],
      },
      {
        name: 'Nein',
        punkte: [
          { x: 'Keine Absage', y: 37 },
          { x: 'Verfahren umständlich', y: 23 },
          { x: 'Ansprechpartner fehlt', y: 44 },
          { x: 'Keine Rückmeldung', y: 10 },
          { x: 'Zu langsam', y: 12 },
        ],
      },
    ],
  },
}

// Ergänzende/ersetzende anlagenText-Einträge (Kalender als Markdown-Tabelle).
const ANLAGEN_TEXTE = {
  'wiso-2023w-a22': `**Zahlen zur wirtschaftlichen Situation des Landes:**

| Indikatoren | 1. Quartal in % | 2. Quartal in % | 3. Quartal in % | Prognose 4. Quartal in % |
|---|---|---|---|---|
| Inflationsrate | 1,2 | 2 | 2 | 2 |
| Arbeitslosenquote | 10 | 11 | 12 | 12,5 |
| Wirtschaftswachstum | 1 | −1,1 | −1,5 | −2 |`,
  'wiso-2023s-a9': `**Vollständige Struktur des Organigramms:**

- **Geschäftsleitung: Jana Loft** — Stabsstellen: Public Relations (Sabine Marx), Organisation/IT (Klaus Klein)
- **Einkauf (Manfred Bast):** Werkstoffe (Egon Kunze) · Handelswaren (Petra Krämer)
- **Produktion (Ralf Obert):** Produktgruppe 1 (Ole Petersen) · Produktgruppe 2 (Kurt Haufe) · Lager (Ahmet Yildiz)
- **Verkauf (Silke Beier):** Auftragsbearbeitung (Vera Schulze) · Kundendienst (Wolfgang Bremer) · Handelswaren (Laura Schneider) · Eigene Erzeugnisse (Frank Berger) · Dienstleistungen (Kai Dabler)
- **Marketing (Susanne Hausmann):** keine unterstellten Stellen
- **Personal (Anne Ohlsen):** Personalverwaltung (Sarah Wegner) · Entgeltabrechnung (Yilmaz Öztürk) · Aus- und Fortbildung (Stefan Dahlmann)
- **Finanzen (Werner Fitschen):** Debitoren (Katharina Schwabe) · Kreditoren (Fritz Tietgen) · Kostenrechnung/Controlling (Corinna Meyer)
- **Verwaltung (Margot Erler):** Gebäude/Anlagen/Fuhrpark (Petra Spengler) · Post (Klaus Wende)`,
  'kbz-2025s-a3-5': `**Kalenderauszug November/Dezember 2024:**

| KW | Mo | Di | Mi | Do | Fr | Sa | So |
|---|---|---|---|---|---|---|---|
| 44 | | | | | 1.11. | 2.11. | 3.11. |
| 45 | 4.11. | 5.11. | 6.11. | 7.11. | 8.11. | 9.11. | 10.11. |
| 46 | 11.11. | 12.11. | 13.11. | 14.11. | 15.11. | 16.11. | 17.11. |
| 47 | 18.11. | 19.11. | 20.11. | 21.11. | 22.11. | 23.11. | 24.11. |
| 48 | 25.11. | 26.11. | 27.11. | 28.11. | 29.11. | 30.11. | 1.12. |
| 49 | 2.12. | 3.12. | 4.12. | 5.12. | 6.12. | 7.12. | 8.12. |
| 50 | 9.12. | 10.12. | 11.12. | 12.12. | 13.12. | 14.12. | 15.12. |
| 51 | 16.12. | 17.12. | 18.12. | 19.12. | 20.12. | 21.12. | 22.12. |
| 52 | 23.12. | 24.12. | 25.12. | 26.12. | 27.12. | 28.12. | 29.12. |
| 1 | 30.12. | 31.12. | | | | | |

Rechnung vom 26.11.2024, Zahlungsziel 30 Tage ab Rechnungsdatum.`,
}

// wiso-2017w-a16 übernimmt das Schaubild von a17, aber mit neutralen
// Serien-Namen (die Original-Namen würden die Zuordnungsaufgabe verraten).
function ergaenzeMarktdiagramm2017(aufgaben) {
  const a16 = aufgaben.find((a) => a.id === 'wiso-2017w-a16')
  const a17 = aufgaben.find((a) => a.id === 'wiso-2017w-a17')
  if (!a16 || !a17?.anlagenDiagramm || a16.anlagenDiagramm) return 0
  const neutral = ['Kurve 1 (fallend)', 'Kurve 2 (steigend)']
  a16.anlagenDiagramm = {
    ...a17.anlagenDiagramm,
    serien: a17.anlagenDiagramm.serien.map((s, i) => ({ ...s, name: neutral[i] ?? s.name })),
  }
  return 1
}

let anzahl = 0
for (const datei of ['wiso', 'kbz']) {
  const pfad = new URL(`../public/data/aufgaben/${datei}.json`, import.meta.url)
  const aufgaben = JSON.parse(fs.readFileSync(pfad, 'utf8'))
  for (const a of aufgaben) {
    if (DIAGRAMME[a.id] && !a.anlagenDiagramm) {
      a.anlagenDiagramm = DIAGRAMME[a.id]
      anzahl++
    }
    if (ANLAGEN_TEXTE[a.id]) {
      a.anlagenText = ANLAGEN_TEXTE[a.id]
      anzahl++
    }
  }
  if (datei === 'wiso') anzahl += ergaenzeMarktdiagramm2017(aufgaben)
  fs.writeFileSync(pfad, JSON.stringify(aufgaben, null, 2) + '\n')
}
console.log(`Fertig: ${anzahl} Einträge ergänzt.`)
