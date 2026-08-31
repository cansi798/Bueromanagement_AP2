// Erzeugt bearbeitbare .excalidraw-Dateien der App-Diagramme nach
// public/downloads/excalidraw/. Die Lehrkraft kann sie auf excalidraw.com
// öffnen, anpassen und neu exportieren — ganz ohne API oder Account.
// Aufruf: node content-pipeline/excalidraw-export.mjs
import fs from 'node:fs'

let z = 0
const uid = () => `el${++z}`
const basis = (o) => ({
  id: uid(), angle: 0, strokeColor: '#1e293b', backgroundColor: 'transparent',
  fillStyle: 'solid', strokeWidth: 2, strokeStyle: 'solid', roughness: 1,
  opacity: 100, seed: z * 997 + 13, version: 1, versionNonce: z, isDeleted: false,
  groupIds: [], frameId: null, boundElements: null, updated: 1, link: null,
  locked: false, ...o,
})
const rect = (x, y, w, h, bg = '#ffffff') =>
  basis({ type: 'rectangle', x, y, width: w, height: h, backgroundColor: bg, roundness: { type: 3 } })
const zeilen = (t) => t.split('\n')
const txt = (cx, y, text, fs = 16, color = '#1e293b') => {
  const l = zeilen(text)
  const breite = Math.max(...l.map((s) => s.length)) * fs * 0.6
  return basis({
    type: 'text', x: cx - breite / 2, y, width: breite, height: fs * 1.25 * l.length,
    text, fontSize: fs, fontFamily: 1, textAlign: 'center', verticalAlign: 'top',
    containerId: null, originalText: text, lineHeight: 1.25, strokeColor: color, roundness: null,
  })
}
const box = (x, y, w, h, text, bg = '#ffffff', fs = 16) => [
  rect(x, y, w, h, bg),
  txt(x + w / 2, y + h / 2 - (fs * 1.25 * zeilen(text).length) / 2, text, fs),
]
const pfeil = (x1, y1, x2, y2, dash = false) =>
  basis({
    type: 'arrow', x: x1, y: y1, width: x2 - x1, height: y2 - y1,
    points: [[0, 0], [x2 - x1, y2 - y1]], startBinding: null, endBinding: null,
    startArrowhead: null, endArrowhead: 'arrow', lastCommittedPoint: null,
    roundness: { type: 2 }, strokeStyle: dash ? 'dashed' : 'solid',
  })
const linie = (punkte, color = '#1e293b', w = 2, dash = false) =>
  basis({
    type: 'line', x: punkte[0][0], y: punkte[0][1],
    width: Math.max(...punkte.map((p) => p[0])) - punkte[0][0],
    height: Math.max(...punkte.map((p) => p[1])) - punkte[0][1],
    points: punkte.map(([x, y]) => [x - punkte[0][0], y - punkte[0][1]]),
    startBinding: null, endBinding: null, startArrowhead: null, endArrowhead: null,
    lastCommittedPoint: null, roundness: null, strokeColor: color, strokeWidth: w,
    strokeStyle: dash ? 'dashed' : 'solid',
  })

const DIAGRAMME = {
  kaufvertrag: [
    ...box(40, 30, 170, 56, 'Antrag\n(Angebot)', '#e0f2fe'),
    ...box(320, 30, 170, 56, 'Annahme\n(Bestellung)', '#e0f2fe'),
    ...box(590, 22, 180, 70, 'KAUFVERTRAG\n§ 433 BGB', '#dcfce7'),
    pfeil(210, 58, 318, 58), pfeil(490, 58, 588, 58),
    txt(400, 140, 'Störungen des Kaufvertrags', 18),
    ...box(35, 185, 175, 78, 'Lieferungs-\nverzug', '#fee2e2', 14),
    ...box(225, 185, 175, 78, 'Sachmangel\n(Mängelrüge!)', '#fee2e2', 14),
    ...box(415, 185, 175, 78, 'Zahlungs-\nverzug', '#fee2e2', 14),
    ...box(605, 185, 165, 78, 'Annahme-\nverzug', '#fee2e2', 14),
    txt(122, 285, 'Mahnung → Nachfrist:\nRücktritt/Schadensersatz', 12, '#475569'),
    txt(312, 285, '1. Nacherfüllung, dann\nMinderung/Rücktritt', 12, '#475569'),
    txt(502, 285, 'Mahnverfahren →\nVollstreckungsbescheid', 12, '#475569'),
    txt(687, 285, 'Hinterlegung/\nSelbsthilfeverkauf', 12, '#475569'),
    txt(400, 350, 'Merke: Kaufleute müssen unverzüglich prüfen und rügen (§ 377 HGB)!', 14, '#b45309'),
  ],
  umsatzsteuer: [
    ...box(40, 60, 170, 64, 'Lieferant', '#f1f5f9'),
    ...box(315, 60, 170, 64, 'Unser\nUnternehmen', '#e0f2fe', 15),
    ...box(590, 60, 170, 64, 'Kunde', '#f1f5f9'),
    pfeil(210, 80, 313, 80), pfeil(485, 80, 588, 80),
    txt(262, 105, 'zahlt Vorsteuer (2600)', 12, '#0369a1'),
    txt(536, 105, 'kassiert USt (4800)', 12, '#b45309'),
    ...box(315, 220, 170, 64, 'Finanzamt', '#fef9c3'),
    pfeil(400, 126, 400, 218),
    txt(610, 245, 'Zahllast = USt − Vorsteuer\nUSt > VSt → zahlen\nVSt > USt → Erstattung', 14),
    txt(400, 330, 'Voranmeldung bis zum 10. des Folgemonats · 19 % / ermäßigt 7 %', 13, '#475569'),
  ],
  buchungssatz: [
    txt(220, 25, 'SOLL', 18), txt(580, 25, 'HABEN', 18),
    linie([[100, 60], [340, 60]]), linie([[220, 60], [220, 180]]),
    linie([[460, 60], [700, 60]]), linie([[580, 60], [580, 180]]),
    txt(160, 85, 'Zugang bei\nAktivkonten', 13, '#475569'),
    txt(280, 85, 'Abgang', 13, '#475569'),
    txt(520, 85, 'Abgang', 13, '#475569'),
    txt(640, 85, 'Zugang bei\nPassivkonten', 13, '#475569'),
    ...box(150, 215, 500, 54, 'Büromaterial (6080) an Bank (2800)  238,00 €', '#dcfce7', 15),
    txt(400, 295, 'Frage-Trick: 1. Welche Konten? 2. Aktiv/Passiv? 3. Zugang/Abgang?', 14, '#b45309'),
  ],
  zuschlagskalkulation: [
    ...box(60, 330, 310, 48, 'Materialeinzel- + Materialgemeinkosten', '#e0f2fe', 13),
    ...box(60, 272, 310, 48, '+ Fertigungslöhne + Fertigungsgemeinkosten', '#e0f2fe', 13),
    ...box(110, 214, 260, 48, '= HERSTELLKOSTEN', '#bae6fd', 14),
    ...box(110, 156, 260, 48, '+ Verwaltungsgemeinkosten (auf HK)', '#fde68a', 13),
    ...box(110, 98, 260, 48, '+ Vertriebsgemeinkosten (auf HK)', '#fde68a', 13),
    ...box(160, 35, 210, 52, '= SELBSTKOSTEN', '#bbf7d0', 15),
    pfeil(430, 354, 430, 60),
    txt(590, 200, 'Gemeinkosten als %-Zuschlag:\nMGK → Materialeinzelkosten\nFGK → Fertigungslöhne\nVwGK/VtGK → Herstellkosten', 13, '#0369a1'),
    txt(590, 330, '„Mein Fleißiger Hund\nVerdient Viel Geld“', 13, '#b45309'),
  ],
  breakeven: [
    linie([[80, 330], [740, 330]]), linie([[80, 330], [80, 40]]),
    txt(720, 340, 'Menge', 13, '#475569'), txt(60, 40, '€', 14),
    linie([[80, 250], [700, 250]], '#94a3b8', 2, true),
    txt(660, 232, 'Fixkosten', 13, '#64748b'),
    linie([[80, 250], [700, 120]], '#dc2626', 3), txt(700, 100, 'Gesamtkosten', 13, '#dc2626'),
    linie([[80, 330], [700, 60]], '#16a34a', 3), txt(700, 40, 'Erlöse', 13, '#16a34a'),
    pfeil(419, 310, 419, 196, true),
    txt(419, 345, 'Break-even-Menge', 13),
    txt(250, 290, 'VERLUST', 16, '#dc2626'), txt(590, 110, 'GEWINN', 16, '#16a34a'),
    txt(400, 10, 'BEP = Fixkosten ÷ (Preis − variable Kosten je Stück)', 14),
  ],
  marktpreis: [
    linie([[90, 330], [730, 330]]), linie([[90, 330], [90, 40]]),
    txt(710, 342, 'Menge', 13, '#475569'), txt(68, 40, 'Preis', 13, '#475569'),
    linie([[130, 300], [690, 80]], '#0284c7', 3), txt(725, 75, 'Angebot', 14, '#0284c7'),
    linie([[130, 80], [690, 300]], '#d97706', 3), txt(730, 300, 'Nachfrage', 14, '#d97706'),
    pfeil(410, 310, 410, 203, true), pfeil(110, 190, 397, 190, true),
    txt(410, 345, 'Gleichgewichtsmenge', 13), txt(205, 165, 'Gleichgewichtspreis', 13),
  ],
  dualessystem: [
    txt(400, 20, 'Zwei Lernorte – ein Ziel: die IHK-Abschlussprüfung', 15),
    ...box(60, 70, 230, 110, 'BETRIEB\nPraxis · Vergütung\nBBiG + Ausbildungsordnung', '#e0f2fe', 14),
    ...box(510, 70, 230, 110, 'BERUFSSCHULE\nTheorie · Lernfelder\nSchulgesetze der Länder', '#fde68a', 14),
    ...box(300, 230, 200, 70, 'AZUBI', '#dcfce7', 18),
    pfeil(200, 182, 340, 228), pfeil(600, 182, 460, 228),
    txt(400, 320, 'Probezeit 1–4 Monate · Vertrag schriftlich vor Beginn · JArbSchG unter 18', 12, '#475569'),
  ],
  konjunktur: [
    linie([[60, 300], [750, 300]]), txt(730, 312, 'Zeit', 13, '#475569'),
    linie([[60, 240], [160, 230], [215, 160], [275, 90], [340, 95], [400, 105], [455, 185], [505, 258], [565, 262], [640, 265], [730, 150]], '#0284c7', 3),
    txt(140, 190, 'Aufschwung', 14, '#16a34a'),
    txt(330, 50, 'Hochkonjunktur (Boom)', 14, '#b45309'),
    txt(478, 145, 'Abschwung (Rezession)', 14, '#dc2626'),
    txt(590, 320, 'Tiefphase (Depression)', 14, '#64748b'),
    txt(400, 355, 'Indikatoren: BIP + Auftragseingänge (früh) · Beschäftigung (spät)', 13, '#475569'),
  ],
  muendlichablauf: [
    ...box(40, 60, 160, 90, 'REPORT\nmax. 3 Seiten', '#e0f2fe', 14),
    ...box(250, 60, 160, 90, 'Prüfer lesen +\nbereiten Fragen vor', '#f1f5f9', 13),
    ...box(460, 60, 160, 90, 'FACHGESPRÄCH\nca. 20 Minuten', '#fde68a', 13),
    ...box(670, 60, 100, 90, 'Note', '#dcfce7', 15),
    pfeil(200, 105, 248, 105), pfeil(410, 105, 458, 105), pfeil(620, 105, 668, 105),
    txt(400, 190, 'Es zählt: Fachwissen zur Wahlqualifikation, Entscheidungen\nbegründen, Prozesse erklären — kein auswendig gelernter Text!', 14),
    txt(400, 260, 'Tipp: laut üben + W-Fragen trainieren (Warum so? Alternativen?)', 13, '#b45309'),
  ],
}

fs.mkdirSync('public/downloads/excalidraw', { recursive: true })
for (const [name, elements] of Object.entries(DIAGRAMME)) {
  const datei = {
    type: 'excalidraw',
    version: 2,
    source: 'kbm-pruefungscoach',
    elements,
    appState: { viewBackgroundColor: '#ffffff', gridSize: null },
    files: {},
  }
  fs.writeFileSync(`public/downloads/excalidraw/${name}.excalidraw`, JSON.stringify(datei, null, 1))
  console.log(`✓ ${name}.excalidraw (${elements.length} Elemente)`)
}
