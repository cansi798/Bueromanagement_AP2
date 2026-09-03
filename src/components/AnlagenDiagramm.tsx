import { useMemo } from 'react'
import rough from 'roughjs'
import type { AnlagenDiagramm as DiagrammSpec } from '../types'

// Rendert Prüfungs-Schaubilder (Konjunkturkurven, Preis-Mengen-Diagramme,
// Balken-/Kreisgrafiken) aus strukturierten Daten als handgezeichnetes SVG.
// roughjs liefert Pfade, die hier als reine React-SVG-Elemente gerendert
// werden — fester seed, damit das Bild bei jedem Render identisch aussieht.

const FARBEN = ['#0369a1', '#b45309', '#047857', '#6d28d9', '#be123c']
const B = 560
const H = 340
const RAND = { oben: 24, rechts: 20, unten: 56, links: 64 }

interface Pfad {
  d: string
  stroke: string
  strokeWidth: number
  fill: string
}

function alsPfade(drawable: import('roughjs/bin/core').Drawable, gen: ReturnType<typeof rough.generator>): Pfad[] {
  return gen.toPaths(drawable).map((p) => ({
    d: p.d,
    stroke: p.stroke,
    strokeWidth: p.strokeWidth,
    fill: p.fill ?? 'none',
  }))
}

export default function AnlagenDiagramm({ diagramm }: { diagramm: DiagrammSpec }) {
  const inhalt = useMemo(() => baueDiagramm(diagramm), [diagramm])

  return (
    <div className="overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
        📊 {diagramm.titel}
      </div>
      <div className="p-2">
        <svg
          viewBox={`0 0 ${B} ${inhalt.hoehe ?? H}`}
          role="img"
          aria-label={diagramm.titel}
          className="h-auto w-full"
        >
          {inhalt.pfade.map((p, i) => (
            <path
              key={i}
              d={p.d}
              stroke={p.stroke}
              strokeWidth={p.strokeWidth}
              fill={p.fill}
            />
          ))}
          {inhalt.texte.map((t, i) => (
            <text
              key={i}
              x={t.x}
              y={t.y}
              fontSize={t.groesse ?? 12}
              fill={t.farbe ?? '#334155'}
              textAnchor={t.anker ?? 'middle'}
              transform={t.transform}
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {t.text}
            </text>
          ))}
        </svg>
        {diagramm.serien && (diagramm.serien.length > 1 || diagramm.typ === 'kreis') && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 px-2 pb-1 text-xs text-slate-600">
            {(diagramm.typ === 'kreis' ? diagramm.serien[0].punkte : diagramm.serien).map(
              (eintrag, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ backgroundColor: FARBEN[i % FARBEN.length] }}
                  />
                  {'name' in eintrag ? eintrag.name : eintrag.x}
                </span>
              ),
            )}
          </div>
        )}
        {diagramm.quelle && (
          <p className="px-2 pb-1 text-[11px] text-slate-400">Quelle: {diagramm.quelle}</p>
        )}
      </div>
    </div>
  )
}

interface TextElement {
  x: number
  y: number
  text: string
  groesse?: number
  farbe?: string
  anker?: 'start' | 'middle' | 'end'
  transform?: string
}

interface DiagrammInhalt {
  pfade: Pfad[]
  texte: TextElement[]
  hoehe?: number
}

function baueDiagramm(d: DiagrammSpec): DiagrammInhalt {
  const gen = rough.generator({ options: { seed: 7, roughness: 1.2, strokeWidth: 1.5 } })
  if (d.typ === 'kreis') return baueKreis(d, gen)
  if (d.typ === 'organigramm') return baueOrganigramm(d, gen)
  if (d.typ === 'schilder') return baueSchilder(d, gen)
  if (d.typ === 'kreislauf') return baueKreislauf(d, gen)
  return baueAchsenDiagramm(d, gen)
}

function baueAchsenDiagramm(
  d: DiagrammSpec,
  gen: ReturnType<typeof rough.generator>,
): { pfade: Pfad[]; texte: TextElement[] } {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const links = RAND.links
  const rechts = B - RAND.rechts
  const oben = RAND.oben
  const unten = H - RAND.unten
  const breite = rechts - links
  const hoehe = unten - oben

  const serien = d.serien ?? []
  if (serien.length === 0) return { pfade, texte }
  const labels = serien[0].punkte.map((p) => p.x)
  const werte = serien.flatMap((s) => s.punkte.map((p) => p.y))
  let min = Math.min(0, ...werte)
  let max = Math.max(0, ...werte)
  if (min === max) max = min + 1
  const spanne = max - min
  const yPos = (w: number) => unten - ((w - min) / spanne) * hoehe

  // Achsen
  pfade.push(...alsPfade(gen.line(links, oben - 6, links, unten), gen))
  pfade.push(...alsPfade(gen.line(links, unten, rechts + 6, unten), gen))
  if (min < 0) {
    pfade.push(
      ...alsPfade(gen.line(links, yPos(0), rechts, yPos(0), { strokeWidth: 1, stroke: '#94a3b8' }), gen),
    )
  }

  // Y-Ticks mit dezenten Gitterlinien
  const tickAnzahl = 4
  for (let i = 0; i <= tickAnzahl; i++) {
    const wert = min + (spanne / tickAnzahl) * i
    const y = yPos(wert)
    pfade.push(
      ...alsPfade(
        gen.line(links, y, rechts, y, { stroke: '#e2e8f0', strokeWidth: 0.8, roughness: 0.6 }),
        gen,
      ),
    )
    texte.push({
      x: links - 8,
      y: y + 4,
      text: formatiereZahl(wert),
      anker: 'end',
      groesse: 11,
      farbe: '#64748b',
    })
  }

  // X-Labels (bei vielen Punkten schräg stellen)
  const schraeg = labels.length > 6 || labels.some((l) => l.length > 6)
  labels.forEach((label, i) => {
    const x =
      d.typ === 'balken'
        ? links + (breite / labels.length) * (i + 0.5)
        : links + (labels.length > 1 ? (breite / (labels.length - 1)) * i : breite / 2)
    texte.push({
      x,
      y: unten + 18,
      text: label,
      groesse: 11,
      farbe: '#475569',
      anker: schraeg ? 'end' : 'middle',
      transform: schraeg ? `rotate(-35 ${x} ${unten + 18})` : undefined,
    })
  })

  // Achsentitel
  if (d.xAchse) texte.push({ x: (links + rechts) / 2, y: H - 6, text: d.xAchse, groesse: 12 })
  if (d.yAchse) {
    const beschriftung =
      d.einheit && !d.yAchse.includes(d.einheit) ? `${d.yAchse} (${d.einheit})` : d.yAchse
    texte.push({
      x: 14,
      y: (oben + unten) / 2,
      text: beschriftung,
      groesse: 12,
      transform: `rotate(-90 14 ${(oben + unten) / 2})`,
    })
  }

  if (d.typ === 'linie') {
    serien.forEach((serie, si) => {
      const farbeSerie = FARBEN[si % FARBEN.length]
      const punkte: [number, number][] = serie.punkte.map((p, i) => [
        links + (serie.punkte.length > 1 ? (breite / (serie.punkte.length - 1)) * i : breite / 2),
        yPos(p.y),
      ])
      if (punkte.length > 1) {
        pfade.push(
          ...alsPfade(gen.linearPath(punkte, { stroke: farbeSerie, strokeWidth: 2 }), gen),
        )
      }
      for (const [x, y] of punkte) {
        pfade.push(
          ...alsPfade(
            gen.circle(x, y, 7, { stroke: farbeSerie, fill: farbeSerie, fillStyle: 'solid' }),
            gen,
          ),
        )
      }
    })
  } else {
    // Balken: Gruppen je X-Label, Serien nebeneinander
    const gruppenBreite = breite / labels.length
    const balkenBreite = Math.min(46, (gruppenBreite * 0.7) / serien.length)
    serien.forEach((serie, si) => {
      const farbeSerie = FARBEN[si % FARBEN.length]
      serie.punkte.forEach((p, i) => {
        const gruppeMitte = links + gruppenBreite * (i + 0.5)
        const x =
          gruppeMitte - (balkenBreite * serien.length) / 2 + si * balkenBreite
        const y0 = yPos(0)
        const y1 = yPos(p.y)
        pfade.push(
          ...alsPfade(
            gen.rectangle(x, Math.min(y0, y1), balkenBreite, Math.abs(y0 - y1) || 1, {
              stroke: farbeSerie,
              fill: farbeSerie,
              fillStyle: 'hachure',
              hachureGap: 5,
            }),
            gen,
          ),
        )
      })
    })
  }

  return { pfade, texte }
}

const ZEICHEN_FARBEN: Record<string, { fuellung: string; schrift: string }> = {
  gruen: { fuellung: '#16a34a', schrift: '#ffffff' },
  rot: { fuellung: '#dc2626', schrift: '#ffffff' },
  gelb: { fuellung: '#facc15', schrift: '#1e293b' },
  blau: { fuellung: '#2563eb', schrift: '#ffffff' },
  grau: { fuellung: '#64748b', schrift: '#ffffff' },
  weiss: { fuellung: '#ffffff', schrift: '#1e293b' },
}

// Schilder/Symbole (Sicherheitszeichen, EPK-Operatoren) als Raster.
function baueSchilder(d: DiagrammSpec, gen: ReturnType<typeof rough.generator>): DiagrammInhalt {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const zeichen = d.zeichen ?? []
  const proZeile = Math.min(5, Math.max(1, zeichen.length))
  const zeilenHoehe = 168
  const slot = B / proZeile

  zeichen.forEach((z, i) => {
    const zeile = Math.floor(i / proZeile)
    const mx = slot * (i % proZeile) + slot / 2
    const oben = zeile * zeilenHoehe + 30
    const farbe = ZEICHEN_FARBEN[z.farbe ?? 'weiss']
    const opt = { stroke: '#1e293b', fill: farbe.fuellung, fillStyle: 'solid' as const }
    const g = 66 // Grundmaß der Form
    const my = oben + 44

    texte.push({ x: mx, y: oben, text: z.nr, groesse: 13, farbe: '#334155' })
    if (z.form === 'kreis') {
      pfade.push(...alsPfade(gen.circle(mx, my, g, opt), gen))
    } else if (z.form === 'quadrat') {
      pfade.push(...alsPfade(gen.rectangle(mx - g / 2, my - g / 2, g, g, opt), gen))
    } else if (z.form === 'rechteck') {
      pfade.push(...alsPfade(gen.rectangle(mx - g * 0.7, my - g * 0.36, g * 1.4, g * 0.72, opt), gen))
    } else if (z.form === 'dreieck') {
      pfade.push(
        ...alsPfade(
          gen.polygon([[mx, my - g / 2], [mx + g / 2 + 6, my + g / 2 - 6], [mx - g / 2 - 6, my + g / 2 - 6]], opt),
          gen,
        ),
      )
    } else if (z.form === 'raute') {
      pfade.push(
        ...alsPfade(
          gen.polygon([[mx, my - g / 2 - 4], [mx + g / 2 + 4, my], [mx, my + g / 2 + 4], [mx - g / 2 - 4, my]], opt),
          gen,
        ),
      )
    } else {
      // Sechseck
      const r = g / 2 + 4
      const punkte: [number, number][] = []
      for (let k = 0; k < 6; k++) {
        const w = (Math.PI / 3) * k + Math.PI / 6
        punkte.push([mx + r * Math.cos(w), my + r * Math.sin(w)])
      }
      pfade.push(...alsPfade(gen.polygon(punkte, opt), gen))
    }
    if (z.innen) {
      texte.push({ x: mx, y: my + 5, text: z.innen, groesse: 15, farbe: farbe.schrift })
    }
    // Beschreibungstext unter der Form, \n-getrennt
    ;(z.text ?? '').split('\n').forEach((zeileText, j) => {
      texte.push({ x: mx, y: my + g / 2 + 24 + j * 14, text: zeileText, groesse: 10.5, farbe: '#475569' })
    })
  })

  return { pfade, texte, hoehe: Math.ceil(zeichen.length / proZeile) * zeilenHoehe + 16 }
}

// Organigramm: Baum aus Knoten; Stabstellen hängen seitlich mit gestrichelter Linie.
function baueOrganigramm(d: DiagrammSpec, gen: ReturnType<typeof rough.generator>): DiagrammInhalt {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const knoten = d.knoten ?? []
  const linie = knoten.filter((k) => !k.stab)
  const staebe = knoten.filter((k) => k.stab)

  // Ebenen über die unter-Verweise bestimmen.
  const ebene = new Map<string, number>()
  const tiefeVon = (k: (typeof knoten)[number]): number => {
    if (ebene.has(k.id)) return ebene.get(k.id)!
    const eltern = k.unter ? knoten.find((e) => e.id === k.unter) : undefined
    const t = eltern ? tiefeVon(eltern) + (eltern.stab ? 0 : 1) : 0
    ebene.set(k.id, t)
    return t
  }
  linie.forEach(tiefeVon)

  const maxTiefe = Math.max(0, ...linie.map((k) => ebene.get(k.id) ?? 0))
  const ebenenHoehe = 82
  const boxH = 46
  const pos = new Map<string, { x: number; y: number; w: number }>()

  for (let t = 0; t <= maxTiefe; t++) {
    const inEbene = linie.filter((k) => ebene.get(k.id) === t)
    const w = Math.min(150, (B - 20) / inEbene.length - 10)
    inEbene.forEach((k, i) => {
      const x = 10 + ((B - 20) / inEbene.length) * (i + 0.5) - w / 2
      const y = 14 + t * ebenenHoehe
      pos.set(k.id, { x, y, w })
      pfade.push(...alsPfade(gen.rectangle(x, y, w, boxH, { stroke: '#1e293b', fill: '#f8fafc', fillStyle: 'solid' }), gen))
      k.text.split('\n').forEach((z, j, arr) => {
        texte.push({
          x: x + w / 2,
          y: y + boxH / 2 + (j - (arr.length - 1) / 2) * 13 + 4,
          text: z,
          groesse: 10.5,
          farbe: '#1e293b',
        })
      })
    })
  }

  // Verbindungen Eltern → Kind
  for (const k of linie) {
    if (!k.unter) continue
    const eltern = pos.get(k.unter)
    const kind = pos.get(k.id)
    if (!eltern || !kind) continue
    pfade.push(
      ...alsPfade(
        gen.line(eltern.x + eltern.w / 2, eltern.y + boxH, kind.x + kind.w / 2, kind.y, {
          stroke: '#475569',
          strokeWidth: 1.2,
        }),
        gen,
      ),
    )
  }

  // Stabstellen: seitlich neben dem Bezugsknoten, gestrichelt angebunden.
  for (const s of staebe) {
    const eltern = s.unter ? pos.get(s.unter) : undefined
    if (!eltern) continue
    const w = 132
    const x = eltern.x + eltern.w + 40 + w > B ? eltern.x - w - 40 : eltern.x + eltern.w + 40
    const y = eltern.y + 8
    pfade.push(...alsPfade(gen.rectangle(x, y, w, boxH - 6, { stroke: '#1e293b', fill: '#fef9c3', fillStyle: 'solid' }), gen))
    pfade.push(
      ...alsPfade(
        gen.line(
          x < eltern.x ? eltern.x : eltern.x + eltern.w,
          eltern.y + boxH / 2,
          x < eltern.x ? x + w : x,
          y + (boxH - 6) / 2,
          { stroke: '#475569', strokeWidth: 1.2, strokeLineDash: [5, 4] },
        ),
        gen,
      ),
    )
    s.text.split('\n').forEach((z, j, arr) => {
      texte.push({
        x: x + w / 2,
        y: y + (boxH - 6) / 2 + (j - (arr.length - 1) / 2) * 12 + 4,
        text: z,
        groesse: 10,
        farbe: '#1e293b',
      })
    })
  }

  return { pfade, texte, hoehe: (maxTiefe + 1) * ebenenHoehe + 24 }
}

// Wirtschaftskreislauf-Skizzen: je Variante zwei Randboxen + beschriftete Pfeile.
function baueKreislauf(d: DiagrammSpec, gen: ReturnType<typeof rough.generator>): DiagrammInhalt {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const varianten = d.varianten ?? []
  const links = d.linksBox ?? 'Unternehmen'
  const rechts = d.rechtsBox ?? 'Haushalte'
  const blockH = 26
  let y = 8

  for (const v of varianten) {
    const anzahl = v.stroeme.length
    const innenH = anzahl * (blockH + 8) + 10
    texte.push({ x: 14, y: y + 14, text: v.name, groesse: 12.5, farbe: '#0f172a', anker: 'start' })
    const oben = y + 24
    // Randboxen mit vertikalem Text
    pfade.push(...alsPfade(gen.rectangle(40, oben, 36, innenH, { stroke: '#1e293b', fill: '#e0f2fe', fillStyle: 'solid' }), gen))
    pfade.push(...alsPfade(gen.rectangle(B - 76, oben, 36, innenH, { stroke: '#1e293b', fill: '#e0f2fe', fillStyle: 'solid' }), gen))
    texte.push({ x: 58, y: oben + innenH / 2, text: links, groesse: 11, transform: `rotate(-90 58 ${oben + innenH / 2})` })
    texte.push({ x: B - 58, y: oben + innenH / 2, text: rechts, groesse: 11, transform: `rotate(-90 ${B - 58} ${oben + innenH / 2})` })

    v.stroeme.forEach((s, i) => {
      const sy = oben + 10 + i * (blockH + 8)
      pfade.push(...alsPfade(gen.rectangle(110, sy, B - 220, blockH, { stroke: '#475569', fill: '#ffffff', fillStyle: 'solid' }), gen))
      texte.push({ x: 118, y: sy + blockH / 2 + 4, text: s.text, groesse: 11, anker: 'start', farbe: '#1e293b' })
      const mitte = sy + blockH / 2
      if (s.richtung === 'links') {
        pfade.push(...alsPfade(gen.line(110, mitte, 82, mitte, { strokeWidth: 1.8 }), gen))
        pfade.push(...alsPfade(gen.polygon([[80, mitte], [92, mitte - 5], [92, mitte + 5]], { stroke: '#1e293b', fill: '#1e293b', fillStyle: 'solid' }), gen))
      } else {
        pfade.push(...alsPfade(gen.line(B - 110, mitte, B - 82, mitte, { strokeWidth: 1.8 }), gen))
        pfade.push(...alsPfade(gen.polygon([[B - 80, mitte], [B - 92, mitte - 5], [B - 92, mitte + 5]], { stroke: '#1e293b', fill: '#1e293b', fillStyle: 'solid' }), gen))
      }
    })
    y = oben + innenH + 14
  }

  return { pfade, texte, hoehe: y + 4 }
}

function baueKreis(
  d: DiagrammSpec,
  gen: ReturnType<typeof rough.generator>,
): { pfade: Pfad[]; texte: TextElement[] } {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const punkte = d.serien?.[0]?.punkte ?? []
  const summe = punkte.reduce((s, p) => s + Math.max(0, p.y), 0) || 1
  const mx = B / 2
  const my = (H - 20) / 2 + 10
  const dm = Math.min(B, H) - 90

  let winkel = -Math.PI / 2
  punkte.forEach((p, i) => {
    const anteil = Math.max(0, p.y) / summe
    const ende = winkel + anteil * Math.PI * 2
    pfade.push(
      ...alsPfade(
        gen.arc(mx, my, dm, dm, winkel, ende, true, {
          stroke: FARBEN[i % FARBEN.length],
          fill: FARBEN[i % FARBEN.length],
          fillStyle: 'hachure',
          hachureGap: 5,
        }),
        gen,
      ),
    )
    // Prozent-Label auf halbem Winkel
    const mitte = (winkel + ende) / 2
    texte.push({
      x: mx + Math.cos(mitte) * (dm / 2 + 26),
      y: my + Math.sin(mitte) * (dm / 2 + 26) + 4,
      text: `${Math.round(anteil * 100)} %`,
      groesse: 12,
      farbe: '#334155',
    })
    winkel = ende
  })

  return { pfade, texte }
}

function formatiereZahl(w: number): string {
  const gerundet = Math.abs(w) >= 100 ? Math.round(w) : Math.round(w * 10) / 10
  return gerundet.toLocaleString('de-DE')
}
