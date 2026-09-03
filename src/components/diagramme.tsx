import type { ReactNode } from 'react'
import rough from 'roughjs'
import type { Drawable } from 'roughjs/bin/core'

// Handgezeichnet wirkende SVG-Diagramme (Excalidraw-Stil) für zentrale Themen.
// Bewusst ohne externe Dienste: funktioniert offline, auf jedem Host und im PDF.

const INK = '#1e293b'

function B({
  x, y, w, h, t, f = '#ffffff', s = INK, fs = 15, rot = 0, fett = true,
}: {
  x: number; y: number; w: number; h: number; t: string
  f?: string; s?: string; fs?: number; rot?: number; fett?: boolean
}) {
  const zeilen = t.split('\n')
  return (
    <g transform={rot ? `rotate(${rot} ${x + w / 2} ${y + h / 2})` : undefined}>
      <rect x={x} y={y} width={w} height={h} rx={10} fill={f} stroke={s} strokeWidth={2.2} />
      {zeilen.map((z, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 + (i - (zeilen.length - 1) / 2) * (fs + 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fontWeight={fett ? 600 : 400}
          fill={INK}
        >
          {z}
        </text>
      ))}
    </g>
  )
}

function Pfeil({ x1, y1, x2, y2, s = INK, dash = false }: {
  x1: number; y1: number; x2: number; y2: number; s?: string; dash?: boolean
}) {
  const wink = Math.atan2(y2 - y1, x2 - x1)
  const l = 10
  const p1x = x2 - l * Math.cos(wink - 0.4)
  const p1y = y2 - l * Math.sin(wink - 0.4)
  const p2x = x2 - l * Math.cos(wink + 0.4)
  const p2y = y2 - l * Math.sin(wink + 0.4)
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={s} strokeWidth={2.4} strokeDasharray={dash ? '6 5' : undefined} />
      <polygon points={`${x2},${y2} ${p1x},${p1y} ${p2x},${p2y}`} fill={s} />
    </g>
  )
}

function T({ x, y, t, fs = 14, fill = '#475569', anchor = 'middle', fett = false }: {
  x: number; y: number; t: string; fs?: number; fill?: string; anchor?: 'middle' | 'start' | 'end'; fett?: boolean
}) {
  return (
    <text x={x} y={y} fontSize={fs} fill={fill} textAnchor={anchor} fontWeight={fett ? 700 : 400}>
      {t}
    </text>
  )
}

function Dia({ titel, viewBox, children }: { titel: string; viewBox: string; children: ReactNode }) {
  return (
    <figure className="my-4 rounded-2xl border-2 border-slate-200 bg-white p-3 print:break-inside-avoid">
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label={titel}>
        {children}
      </svg>
      <figcaption className="mt-1 text-center text-xs text-slate-500">{titel}</figcaption>
    </figure>
  )
}

/* ---------- Die Diagramme ---------- */

const Kaufvertrag = () => (
  <Dia titel="So kommt ein Kaufvertrag zustande – und diese Störungen gibt es" viewBox="0 0 800 400">
    <B x={40} y={30} w={170} h={56} t={'Antrag\n(Angebot)'} f="#e0f2fe" rot={-1} />
    <B x={320} y={30} w={170} h={56} t={'Annahme\n(Bestellung)'} f="#e0f2fe" rot={1} />
    <B x={590} y={22} w={180} h={70} t={'KAUFVERTRAG\n§ 433 BGB'} f="#dcfce7" fs={16} />
    <Pfeil x1={210} y1={58} x2={318} y2={58} />
    <Pfeil x1={490} y1={58} x2={588} y2={58} />
    <T x={264} y={44} t="übereinstimmend" fs={12} />
    <Pfeil x1={680} y1={92} x2={680} y2={135} />
    <T x={680} y={155} t="Störungen des Kaufvertrags" fs={16} fill={INK} fett />
    <B x={35} y={185} w={175} h={78} t={'Lieferungs-\nverzug'} f="#fee2e2" rot={-1} />
    <B x={225} y={185} w={175} h={78} t={'Sachmangel\n(Mängelrüge!)'} f="#fee2e2" rot={1} />
    <B x={415} y={185} w={175} h={78} t={'Zahlungs-\nverzug'} f="#fee2e2" rot={-1} />
    <B x={605} y={185} w={165} h={78} t={'Annahme-\nverzug'} f="#fee2e2" rot={1} />
    <T x={122} y={295} t="Mahnung → Nachfrist:" fs={12} />
    <T x={122} y={312} t="Rücktritt / Schadensersatz" fs={12} />
    <T x={312} y={295} t="1. Nacherfüllung, dann" fs={12} />
    <T x={312} y={312} t="Minderung / Rücktritt" fs={12} />
    <T x={502} y={295} t="Mahnverfahren →" fs={12} />
    <T x={502} y={312} t="Vollstreckungsbescheid" fs={12} />
    <T x={687} y={295} t="Hinterlegung /" fs={12} />
    <T x={687} y={312} t="Selbsthilfeverkauf" fs={12} />
    <T x={400} y={370} t="Merke: Kaufleute müssen Ware unverzüglich prüfen und rügen (§ 377 HGB)!" fs={14} fill="#b45309" fett />
  </Dia>
)

const Umsatzsteuer = () => (
  <Dia titel="Umsatzsteuer-Kreislauf: Zahllast = Umsatzsteuer − Vorsteuer" viewBox="0 0 800 380">
    <B x={40} y={60} w={170} h={64} t={'Lieferant'} f="#f1f5f9" rot={-1} />
    <B x={315} y={60} w={170} h={64} t={'Unser\nUnternehmen'} f="#e0f2fe" />
    <B x={590} y={60} w={170} h={64} t={'Kunde'} f="#f1f5f9" rot={1} />
    <Pfeil x1={210} y1={80} x2={313} y2={80} />
    <T x={262} y={66} t="Einkauf" fs={12} />
    <T x={262} y={110} t="zahlt Vorsteuer (2600)" fs={12} fill="#0369a1" fett />
    <Pfeil x1={485} y1={80} x2={588} y2={80} />
    <T x={536} y={66} t="Verkauf" fs={12} />
    <T x={536} y={110} t="kassiert USt (4800)" fs={12} fill="#b45309" fett />
    <B x={315} y={220} w={170} h={64} t={'Finanzamt'} f="#fef9c3" />
    <Pfeil x1={400} y1={126} x2={400} y2={218} />
    <T x={520} y={250} t="Zahllast = USt − Vorsteuer" fs={15} fill={INK} fett anchor="start" />
    <T x={520} y={274} t="USt > VSt → zahlen" fs={13} anchor="start" />
    <T x={520} y={294} t="VSt > USt → Erstattung" fs={13} anchor="start" />
    <T x={400} y={345} t="Voranmeldung bis zum 10. des Folgemonats · Regelsatz 19 %, ermäßigt 7 %" fs={13} fill="#475569" />
  </Dia>
)

const Buchungssatz = () => (
  <Dia titel="Buchungssatz: immer „Soll an Haben“" viewBox="0 0 800 360">
    <T x={220} y={40} t="SOLL" fs={18} fill={INK} fett />
    <T x={580} y={40} t="HABEN" fs={18} fill={INK} fett />
    <line x1={100} y1={60} x2={340} y2={60} stroke={INK} strokeWidth={2.5} />
    <line x1={220} y1={60} x2={220} y2={180} stroke={INK} strokeWidth={2.5} />
    <line x1={460} y1={60} x2={700} y2={60} stroke={INK} strokeWidth={2.5} />
    <line x1={580} y1={60} x2={580} y2={180} stroke={INK} strokeWidth={2.5} />
    <T x={160} y={90} t="Zugang bei" fs={13} />
    <T x={160} y={108} t="Aktivkonten" fs={13} fett />
    <T x={280} y={90} t="Abgang" fs={13} />
    <T x={520} y={90} t="Abgang" fs={13} />
    <T x={640} y={90} t="Zugang bei" fs={13} />
    <T x={640} y={108} t="Passivkonten" fs={13} fett />
    <B x={150} y={215} w={500} h={54} t={'Büromaterial (6080)  an  Bank (2800)   238,00 €'} f="#dcfce7" fs={15} />
    <T x={400} y={305} t="Frage-Trick: 1. Welche Konten? 2. Aktiv oder Passiv? 3. Zugang oder Abgang?" fs={14} fill="#b45309" fett />
    <T x={400} y={330} t="Erst das Soll-Konto nennen, dann „an“, dann das Haben-Konto." fs={13} />
  </Dia>
)

const Zuschlagskalkulation = () => (
  <Dia titel="Zuschlagskalkulation: von den Einzelkosten zu den Selbstkosten" viewBox="0 0 800 420">
    <B x={60} y={330} w={310} h={48} t={'Materialeinzelkosten + Materialgemeinkosten'} f="#e0f2fe" fs={13} />
    <B x={60} y={272} w={310} h={48} t={'+ Fertigungslöhne + Fertigungsgemeinkosten'} f="#e0f2fe" fs={13} />
    <B x={110} y={214} w={260} h={48} t={'= HERSTELLKOSTEN'} f="#bae6fd" fs={14} />
    <B x={110} y={156} w={260} h={48} t={'+ Verwaltungsgemeinkosten (auf HK)'} f="#fde68a" fs={13} />
    <B x={110} y={98} w={260} h={48} t={'+ Vertriebsgemeinkosten (auf HK)'} f="#fde68a" fs={13} />
    <B x={160} y={35} w={210} h={52} t={'= SELBSTKOSTEN'} f="#bbf7d0" fs={15} />
    <Pfeil x1={430} y1={354} x2={430} y2={60} />
    <T x={455} y={200} t="Gemeinkosten werden als %-Zuschlag" fs={13} anchor="start" />
    <T x={455} y={220} t="auf ihre Basis gerechnet:" fs={13} anchor="start" />
    <T x={455} y={248} t="MGK-Satz → auf Materialeinzelkosten" fs={13} anchor="start" fill="#0369a1" />
    <T x={455} y={272} t="FGK-Satz → auf Fertigungslöhne" fs={13} anchor="start" fill="#0369a1" />
    <T x={455} y={296} t="VwGK/VtGK-Satz → auf Herstellkosten" fs={13} anchor="start" fill="#0369a1" />
    <T x={455} y={340} t="Eselsbrücke: „Mein Fleißiger Hund" fs={13} anchor="start" fill="#b45309" fett />
    <T x={455} y={360} t="Verdient Viel Geld“ (M-F-H-Vw-Vt)" fs={13} anchor="start" fill="#b45309" fett />
  </Dia>
)

const BreakEven = () => (
  <Dia titel="Break-even-Punkt: Ab dieser Menge machst du Gewinn" viewBox="0 0 800 400">
    <line x1={80} y1={330} x2={740} y2={330} stroke={INK} strokeWidth={2.4} />
    <line x1={80} y1={330} x2={80} y2={40} stroke={INK} strokeWidth={2.4} />
    <T x={745} y={348} t="Menge" fs={13} anchor="end" />
    <T x={60} y={45} t="€" fs={14} />
    <line x1={80} y1={250} x2={700} y2={250} stroke="#94a3b8" strokeWidth={2} strokeDasharray="7 5" />
    <T x={695} y={238} t="Fixkosten" fs={13} anchor="end" fill="#64748b" />
    <line x1={80} y1={250} x2={700} y2={120} stroke="#dc2626" strokeWidth={2.6} />
    <T x={705} y={118} t="Gesamtkosten" fs={13} anchor="start" fill="#dc2626" />
    <line x1={80} y1={330} x2={700} y2={60} stroke="#16a34a" strokeWidth={2.6} />
    <T x={705} y={62} t="Erlöse" fs={13} anchor="start" fill="#16a34a" />
    <circle cx={419} cy={183} r={9} fill="#fbbf24" stroke={INK} strokeWidth={2.2} />
    <Pfeil x1={419} y1={310} x2={419} y2={196} dash />
    <T x={419} y={352} t="Break-even-Menge" fs={13} fett fill={INK} />
    <T x={250} y={300} t="VERLUST" fs={16} fill="#dc2626" fett />
    <T x={590} y={120} t="GEWINN" fs={16} fill="#16a34a" fett />
    <T x={400} y={30} t="Break-even-Menge = Fixkosten ÷ Deckungsbeitrag je Stück (db = Preis − variable Kosten)" fs={13.5} fill={INK} fett />
  </Dia>
)

const MarktPreis = () => (
  <Dia titel="Preisbildung am Markt: Wo Angebot und Nachfrage sich treffen" viewBox="0 0 800 400">
    <line x1={90} y1={330} x2={730} y2={330} stroke={INK} strokeWidth={2.4} />
    <line x1={90} y1={330} x2={90} y2={40} stroke={INK} strokeWidth={2.4} />
    <T x={735} y={348} t="Menge" fs={13} anchor="end" />
    <T x={68} y={45} t="Preis" fs={13} />
    <line x1={130} y1={300} x2={690} y2={80} stroke="#0284c7" strokeWidth={2.6} />
    <T x={700} y={80} t="Angebot" fs={14} anchor="start" fill="#0284c7" fett />
    <line x1={130} y1={80} x2={690} y2={300} stroke="#d97706" strokeWidth={2.6} />
    <T x={700} y={305} t="Nachfrage" fs={14} anchor="start" fill="#d97706" fett />
    <circle cx={410} cy={190} r={9} fill="#fbbf24" stroke={INK} strokeWidth={2.2} />
    <Pfeil x1={410} y1={310} x2={410} y2={203} dash />
    <Pfeil x1={110} y1={190} x2={397} y2={190} dash />
    <T x={410} y={352} t="Gleichgewichtsmenge" fs={13} fett />
    <T x={205} y={178} t="Gleichgewichtspreis" fs={13} fett />
    <T x={400} y={30} t="Preis über Gleichgewicht → Angebotsüberhang · Preis darunter → Nachfrageüberhang" fs={13.5} fill={INK} fett />
  </Dia>
)

const DualesSystem = () => (
  <Dia titel="Das duale System der Berufsausbildung" viewBox="0 0 800 360">
    <B x={60} y={70} w={230} h={110} t={'BETRIEB\n\nPraxis · Vergütung\nBBiG + Ausbildungsordnung'} f="#e0f2fe" fs={14} rot={-1} />
    <B x={510} y={70} w={230} h={110} t={'BERUFSSCHULE\n\nTheorie · Lernfelder\nSchulgesetze der Länder'} f="#fde68a" fs={14} rot={1} />
    <B x={300} y={230} w={200} h={70} t={'AZUBI'} f="#dcfce7" fs={18} />
    <Pfeil x1={200} y1={182} x2={340} y2={228} />
    <Pfeil x1={600} y1={182} x2={460} y2={228} />
    <T x={400} y={60} t="zwei Lernorte – ein Ziel: die Abschlussprüfung vor der IHK" fs={14} fill={INK} fett />
    <T x={400} y={330} t="Probezeit 1–4 Monate · Ausbildungsvertrag schriftlich vor Beginn · JArbSchG schützt unter 18" fs={12.5} />
  </Dia>
)

const Konjunktur = () => (
  <Dia titel="Der Konjunkturzyklus" viewBox="0 0 800 380">
    <line x1={60} y1={300} x2={750} y2={300} stroke={INK} strokeWidth={2.2} />
    <T x={748} y={318} t="Zeit" fs={13} anchor="end" />
    <path
      d="M 60 240 Q 155 235 215 160 Q 275 85 340 95 Q 400 105 455 185 Q 505 258 565 262 Q 640 265 730 150"
      fill="none"
      stroke="#0284c7"
      strokeWidth={3}
    />
    <T x={140} y={200} t="Aufschwung" fs={14} fett fill="#16a34a" />
    <T x={150} y={222} t="(Expansion)" fs={12} />
    <T x={330} y={62} t="Hochkonjunktur" fs={14} fett fill="#b45309" />
    <T x={330} y={82} t="(Boom)" fs={12} />
    <T x={475} y={150} t="Abschwung" fs={14} fett fill="#dc2626" />
    <T x={475} y={170} t="(Rezession)" fs={12} />
    <T x={590} y={330} t="Tiefphase (Depression)" fs={14} fett fill="#64748b" />
    <T x={400} y={360} t="Indikatoren: BIP, Auftragseingänge (Früh-) · Beschäftigung (Spät-) · Preise, Zinsen" fs={13} />
  </Dia>
)

const MuendlichAblauf = () => (
  <Dia titel="So läuft die mündliche Prüfung ab" viewBox="0 0 800 330">
    <B x={40} y={60} w={160} h={90} t={'REPORT\nmax. 3 Seiten\nzur Fachaufgabe'} f="#e0f2fe" fs={13} rot={-1} />
    <B x={250} y={60} w={160} h={90} t={'Prüfer lesen\n+ bereiten\nFragen vor'} f="#f1f5f9" fs={13} rot={1} />
    <B x={460} y={60} w={160} h={90} t={'FACHGESPRÄCH\nca. 20 Minuten'} f="#fde68a" fs={13} rot={-1} />
    <B x={670} y={60} w={100} h={90} t={'Note'} f="#dcfce7" fs={15} rot={1} />
    <Pfeil x1={200} y1={105} x2={248} y2={105} />
    <Pfeil x1={410} y1={105} x2={458} y2={105} />
    <Pfeil x1={620} y1={105} x2={668} y2={105} />
    <T x={400} y={200} t="Im Gespräch zählt: Fachwissen zur Wahlqualifikation, Begründen von" fs={13.5} />
    <T x={400} y={222} t="Entscheidungen, Prozesse erklären — nicht auswendig gelernter Text!" fs={13.5} />
    <T x={400} y={270} t="Tipp: Beim Üben laut antworten und die W-Fragen trainieren (Warum so? Welche Alternativen?)" fs={13} fill="#b45309" fett />
  </Dia>
)

/* ---------- Rough.js-Helfer: echte Skizzen-Optik für neue Diagramme ---------- */

// Fester seed wie in AnlagenDiagramm, damit jedes Rendering identisch aussieht.
const rgen = rough.generator({ options: { seed: 7, roughness: 1.3, strokeWidth: 2 } })

function Skizze({ zeichnung }: { zeichnung: Drawable }) {
  return (
    <>
      {rgen.toPaths(zeichnung).map((p, i) => (
        <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.strokeWidth} fill={p.fill ?? 'none'} />
      ))}
    </>
  )
}

// Rough-Kasten mit mehrzeiligem, zentriertem Text (\n trennt Zeilen).
function RB({ x, y, w, h, t, f = '#ffffff', fs = 14, fett = true }: {
  x: number; y: number; w: number; h: number; t: string; f?: string; fs?: number; fett?: boolean
}) {
  const zeilen = t.split('\n')
  return (
    <g>
      <Skizze zeichnung={rgen.rectangle(x, y, w, h, { stroke: INK, fill: f, fillStyle: 'solid' })} />
      {zeilen.map((z, i) => (
        <text
          key={i}
          x={x + w / 2}
          y={y + h / 2 + (i - (zeilen.length - 1) / 2) * (fs + 4)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fs}
          fontWeight={fett ? 600 : 400}
          fill={INK}
        >
          {z}
        </text>
      ))}
    </g>
  )
}

function RPfeil({ x1, y1, x2, y2, s = INK }: {
  x1: number; y1: number; x2: number; y2: number; s?: string
}) {
  const wink = Math.atan2(y2 - y1, x2 - x1)
  const l = 11
  return (
    <g>
      <Skizze zeichnung={rgen.line(x1, y1, x2, y2, { stroke: s, strokeWidth: 2.2 })} />
      <polygon
        points={`${x2},${y2} ${x2 - l * Math.cos(wink - 0.4)},${y2 - l * Math.sin(wink - 0.4)} ${x2 - l * Math.cos(wink + 0.4)},${y2 - l * Math.sin(wink + 0.4)}`}
        fill={s}
      />
    </g>
  )
}

/* ---------- Rough.js-Diagramme für die neuen WiSo-Abschnitte ---------- */

const Sozialversicherung = () => (
  <Dia titel="Die fünf Säulen der Sozialversicherung" viewBox="0 0 800 400">
    <RB x={40} y={40} w={430} h={44} t={'Beiträge: Arbeitgeber + Arbeitnehmer je zur Hälfte (paritätisch)'} f="#e0f2fe" fs={13.5} />
    <RB x={560} y={40} w={210} h={44} t={'Ausnahme: zahlt der\nArbeitgeber allein!'} f="#fee2e2" fs={13} />
    <RPfeil x1={255} y1={84} x2={255} y2={128} />
    <RPfeil x1={665} y1={84} x2={665} y2={128} s="#be123c" />
    <RB x={40} y={130} w={135} h={130} t={'Kranken-\nversicherung\n14,6 %\n+ Zusatzbeitrag'} f="#dcfce7" fs={12.5} />
    <RB x={192} y={130} w={135} h={130} t={'Pflege-\nversicherung\n3,6 %\n(Kinderlose mehr)'} f="#dcfce7" fs={12.5} />
    <RB x={344} y={130} w={135} h={130} t={'Renten-\nversicherung\n18,6 %'} f="#dcfce7" fs={12.5} />
    <RB x={496} y={130} w={135} h={130} t={'Arbeitslosen-\nversicherung\n2,6 %'} f="#dcfce7" fs={12.5} />
    <RB x={648} y={130} w={122} h={130} t={'Unfall-\nversicherung\nBerufs-\ngenossenschaft'} f="#fee2e2" fs={12.5} />
    <RB x={40} y={300} w={730} h={46} t={'Sozialversicherung — Schutz vor den großen Lebensrisiken'} f="#fef9c3" fs={15} />
    <T x={400} y={382} t="Merke: KV · PV · RV · AV · UV — nur die Unfallversicherung ist allein Sache des Arbeitgebers (auch Wegeunfälle!)" fs={13} fill="#b45309" fett />
  </Dia>
)

const Kuendigung = () => (
  <Dia titel="Kündigung und Kündigungsschutz auf einen Blick" viewBox="0 0 800 410">
    <RB x={280} y={20} w={240} h={46} t={'Kündigung = immer\nSchriftform (§ 623 BGB)'} f="#fef9c3" fs={13} />
    <RPfeil x1={330} y1={66} x2={190} y2={110} />
    <RPfeil x1={470} y1={66} x2={610} y2={110} />
    <RB x={55} y={112} w={280} h={64} t={'Ordentlich: mit Frist (§ 622)\nGrundfrist 4 Wochen zum\n15. oder Monatsende'} f="#e0f2fe" fs={12.5} />
    <RB x={465} y={112} w={280} h={64} t={'Außerordentlich: fristlos (§ 626)\nwichtiger Grund nötig,\nnur binnen 2 Wochen'} f="#fee2e2" fs={12.5} />
    <RB x={55} y={210} w={690} h={40} t={'Kündigungsschutzgesetz: Betrieb > 10 Arbeitnehmer und > 6 Monate beschäftigt'} f="#f3e8ff" fs={13.5} />
    <RPfeil x1={175} y1={250} x2={175} y2={288} />
    <RPfeil x1={400} y1={250} x2={400} y2={288} />
    <RPfeil x1={625} y1={250} x2={625} y2={288} />
    <RB x={55} y={290} w={240} h={62} t={'personenbedingt\nz. B. dauerhafte\nKrankheit'} f="#ffffff" fs={12.5} />
    <RB x={310} y={290} w={240} h={62} t={'verhaltensbedingt\nvorher Abmahnung\nnötig!'} f="#ffffff" fs={12.5} />
    <RB x={565} y={290} w={180} h={62} t={'betriebsbedingt\nmit Sozialauswahl'} f="#ffffff" fs={12.5} />
    <T x={400} y={390} t="Dagegen wehren: Kündigungsschutzklage beim Arbeitsgericht — innerhalb von 3 Wochen!" fs={13.5} fill="#b45309" fett />
  </Dia>
)

const TarifBetriebsrat = () => (
  <Dia titel="Tarifpartner und die gestuften Rechte des Betriebsrats" viewBox="0 0 800 400">
    <RB x={40} y={30} w={200} h={52} t={'Gewerkschaft'} f="#e0f2fe" />
    <RB x={560} y={30} w={200} h={52} t={'Arbeitgeberverband\noder Arbeitgeber'} f="#e0f2fe" fs={13} />
    <RPfeil x1={240} y1={56} x2={558} y2={56} />
    <RPfeil x1={558} y1={70} x2={242} y2={70} />
    <RB x={300} y={100} w={200} h={50} t={'Tarifvertrag'} f="#dcfce7" fs={15} />
    <RPfeil x1={400} y1={82} x2={400} y2={98} />
    <T x={140} y={110} t="Tarifautonomie (Art. 9 GG)" fs={12} />
    <T x={655} y={110} t="Friedenspflicht während" fs={12} />
    <T x={655} y={126} t="der Laufzeit" fs={12} />
    <T x={400} y={175} t="Günstigkeitsprinzip: Abweichung nur zugunsten des Arbeitnehmers" fs={12.5} fill="#0369a1" fett />
    <RB x={40} y={200} w={720} h={40} t={'Betriebsrat: ab 5 wahlberechtigten Arbeitnehmern · Wahl alle 4 Jahre'} f="#fef9c3" fs={13.5} />
    <RB x={70} y={260} w={210} h={80} t={'Mitbestimmung\nsoziale Angelegenheiten\n(§ 87 BetrVG): Arbeitszeit,\nUrlaubsgrundsätze'} f="#dcfce7" fs={11.5} />
    <RB x={295} y={260} w={210} h={80} t={'Mitwirkung/Anhörung\npersonelle Angelegenheiten:\nAnhörung vor jeder\nKündigung!'} f="#e0f2fe" fs={11.5} />
    <RB x={520} y={260} w={210} h={80} t={'Information\nwirtschaftliche\nAngelegenheiten\n(Wirtschaftsausschuss)'} f="#f1f5f9" fs={11.5} />
    <T x={400} y={378} t="Ohne Anhörung des Betriebsrats ist eine Kündigung unwirksam (§ 102 BetrVG)." fs={13} fill="#b45309" fett />
  </Dia>
)

const EzbGeldpolitik = () => (
  <Dia titel="Wirkungskette der EZB-Geldpolitik" viewBox="0 0 800 380">
    <RB x={300} y={20} w={200} h={56} t={'EZB\nZiel: Preisstabilität ~ 2 %'} f="#fef9c3" fs={13} />
    <RPfeil x1={340} y1={76} x2={200} y2={120} />
    <RPfeil x1={460} y1={76} x2={600} y2={120} />
    <T x={150} y={108} t="restriktiv (gegen Inflation)" fs={12.5} fill="#be123c" fett />
    <T x={655} y={108} t="expansiv (gegen Rezession)" fs={12.5} fill="#047857" fett />
    <RB x={90} y={122} w={220} h={44} t={'Leitzins erhöhen ↑'} f="#fee2e2" fs={13.5} />
    <RB x={490} y={122} w={220} h={44} t={'Leitzins senken ↓'} f="#dcfce7" fs={13.5} />
    <RPfeil x1={200} y1={166} x2={200} y2={196} s="#be123c" />
    <RPfeil x1={600} y1={166} x2={600} y2={196} s="#047857" />
    <RB x={90} y={198} w={220} h={44} t={'Kredite werden teurer'} f="#fee2e2" fs={13} />
    <RB x={490} y={198} w={220} h={44} t={'Kredite werden billiger'} f="#dcfce7" fs={13} />
    <RPfeil x1={200} y1={242} x2={200} y2={272} s="#be123c" />
    <RPfeil x1={600} y1={242} x2={600} y2={272} s="#047857" />
    <RB x={90} y={274} w={220} h={56} t={'Konsum + Investitionen ↓\n→ Inflation sinkt'} f="#fee2e2" fs={13} />
    <RB x={490} y={274} w={220} h={56} t={'Konsum + Investitionen ↑\n→ Konjunktur zieht an'} f="#dcfce7" fs={13} />
    <T x={400} y={362} t="Inflation: Preisniveau steigt, Geldwert sinkt · Gewinner: Schuldner · Verlierer: Sparer" fs={13} fill="#b45309" fett />
  </Dia>
)

const RechtsformenBaum = () => (
  <Dia titel="Rechtsformen: Haftung entscheidet" viewBox="0 0 800 400">
    <RB x={290} y={20} w={220} h={46} t={'Rechtsformen'} f="#fef9c3" fs={15} />
    <RPfeil x1={330} y1={66} x2={140} y2={108} />
    <RPfeil x1={400} y1={66} x2={400} y2={108} />
    <RPfeil x1={470} y1={66} x2={660} y2={108} />
    <RB x={40} y={110} w={200} h={50} t={'Einzelunternehmen\n(e. K.)'} f="#e0f2fe" fs={12.5} />
    <RB x={300} y={110} w={200} h={50} t={'Personen-\ngesellschaften'} f="#e0f2fe" fs={12.5} />
    <RB x={560} y={110} w={200} h={50} t={'Kapital-\ngesellschaften'} f="#e0f2fe" fs={12.5} />
    <T x={140} y={185} t="eine Person, haftet" fs={12} />
    <T x={140} y={201} t="unbeschränkt privat" fs={12} />
    <RPfeil x1={355} y1={160} x2={310} y2={198} />
    <RPfeil x1={445} y1={160} x2={490} y2={198} />
    <RB x={225} y={200} w={165} h={70} t={'OHG\nalle haften\nunbeschränkt'} f="#fee2e2" fs={12} />
    <RB x={410} y={200} w={165} h={70} t={'KG\nKomplementär: voll\nKommanditist: Einlage'} f="#fee2e2" fs={11.5} />
    <RPfeil x1={615} y1={160} x2={615} y2={198} />
    <RPfeil x1={700} y1={160} x2={700} y2={198} />
    <RB x={595} y={200} w={92} h={70} t={'GmbH\n25.000 €\nStammkapital'} f="#dcfce7" fs={11.5} />
    <RB x={697} y={200} w={92} h={70} t={'AG\n50.000 €\nGrundkapital'} f="#dcfce7" fs={11.5} />
    <T x={640} y={295} t="Haftung beschränkt auf Gesellschaftsvermögen" fs={12} />
    <T x={640} y={311} t="AG-Organe: Vorstand · Aufsichtsrat · Hauptversammlung" fs={12} />
    <T x={220} y={295} t="mind. ein Gesellschafter haftet persönlich," fs={12} />
    <T x={220} y={311} t="dafür kein Mindestkapital" fs={12} />
    <T x={400} y={370} t="Merke: Personengesellschaft = persönliche Haftung · Kapitalgesellschaft = Mindestkapital + Formalitäten" fs={13} fill="#b45309" fett />
  </Dia>
)

/* ---------- Registry: themaId → Diagramm ---------- */

export const DIAGRAMME: Record<string, () => ReactNode> = {
  // KBZ
  'kaufvertrag-stoerungen': Kaufvertrag,
  'rechnung-umsatzsteuer': Umsatzsteuer,
  'buchfuehrung-kontierung': Buchungssatz,
  'kostenrechnung': Zuschlagskalkulation,
  // Buchführung
  'umsatzsteuer': Umsatzsteuer,
  'buchungssaetze-kontierung': Buchungssatz,
  'zuschlagskalkulation': Zuschlagskalkulation,
  'deckungsbeitrag-breakeven': BreakEven,
  // WiSo
  'markt-preisbildung': MarktPreis,
  'berufsausbildung-arbeitsrecht': DualesSystem,
  'konjunktur-indikatoren': Konjunktur,
  // Mündlich
  'ablauf-fachaufgabe': MuendlichAblauf,
}

// Bearbeitbare Excalidraw-Versionen (public/downloads/excalidraw/, erzeugt von
// content-pipeline/excalidraw-export.mjs) — Datei auf excalidraw.com öffnen.
const EXCALIDRAW_DATEI: Record<string, string> = {
  'kaufvertrag-stoerungen': 'kaufvertrag',
  'rechnung-umsatzsteuer': 'umsatzsteuer',
  'buchfuehrung-kontierung': 'buchungssatz',
  'kostenrechnung': 'zuschlagskalkulation',
  'umsatzsteuer': 'umsatzsteuer',
  'buchungssaetze-kontierung': 'buchungssatz',
  'zuschlagskalkulation': 'zuschlagskalkulation',
  'deckungsbeitrag-breakeven': 'breakeven',
  'markt-preisbildung': 'marktpreis',
  'berufsausbildung-arbeitsrecht': 'dualessystem',
  'konjunktur-indikatoren': 'konjunktur',
  'ablauf-fachaufgabe': 'muendlichablauf',
}

export function hatDiagramm(themaId: string): boolean {
  return themaId in DIAGRAMME
}

// Diagramme für einzelne Lernzettel-Abschnitte: Schlüssel ist der exakte
// „##"-Folientitel. Wird auf der jeweiligen Inhaltsfolie mitgerendert.
const FOLIEN_DIAGRAMME: Record<string, Record<string, () => ReactNode>> = {
  'berufsausbildung-arbeitsrecht': {
    'Kündigung und Kündigungsschutz': Kuendigung,
    'Tarifvertrag, Betriebsrat und Mitbestimmung': TarifBetriebsrat,
    'Sozialversicherung: die fünf Säulen': Sozialversicherung,
  },
  'konjunktur-indikatoren': {
    'Geldpolitik der EZB, Inflation und Deflation': EzbGeldpolitik,
  },
  'rechtsformen-vollmachten': {
    'Rechtsformen im Überblick': RechtsformenBaum,
    'Kaufvertrag und Leistungsstörungen': Kaufvertrag,
  },
}

export function FolienDiagramm({ themaId, titel }: { themaId: string; titel: string }) {
  const D = FOLIEN_DIAGRAMME[themaId]?.[titel]
  return D ? <>{D()}</> : null
}

export default function ThemaDiagramm({ themaId }: { themaId: string }) {
  const D = DIAGRAMME[themaId]
  if (!D) return null
  const excaliDatei = EXCALIDRAW_DATEI[themaId]
  return (
    <div>
      {D()}
      {excaliDatei && (
        <p className="-mt-2 mb-3 text-right text-xs print:hidden">
          <a
            href={`./downloads/excalidraw/${excaliDatei}.excalidraw`}
            download
            className="text-slate-400 hover:text-sky-600"
          >
            ✏️ Als Excalidraw-Datei (bearbeitbar)
          </a>
        </p>
      )}
    </div>
  )
}
