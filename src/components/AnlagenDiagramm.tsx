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
          viewBox={`0 0 ${B} ${H}`}
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
        {(diagramm.serien.length > 1 || diagramm.typ === 'kreis') && (
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

function baueDiagramm(d: DiagrammSpec): { pfade: Pfad[]; texte: TextElement[] } {
  const gen = rough.generator({ options: { seed: 7, roughness: 1.2, strokeWidth: 1.5 } })
  if (d.typ === 'kreis') return baueKreis(d, gen)
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

  const labels = d.serien[0].punkte.map((p) => p.x)
  const werte = d.serien.flatMap((s) => s.punkte.map((p) => p.y))
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
    const beschriftung = d.einheit ? `${d.yAchse} (${d.einheit})` : d.yAchse
    texte.push({
      x: 14,
      y: (oben + unten) / 2,
      text: beschriftung,
      groesse: 12,
      transform: `rotate(-90 14 ${(oben + unten) / 2})`,
    })
  }

  if (d.typ === 'linie') {
    d.serien.forEach((serie, si) => {
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
    const balkenBreite = Math.min(46, (gruppenBreite * 0.7) / d.serien.length)
    d.serien.forEach((serie, si) => {
      const farbeSerie = FARBEN[si % FARBEN.length]
      serie.punkte.forEach((p, i) => {
        const gruppeMitte = links + gruppenBreite * (i + 0.5)
        const x =
          gruppeMitte - (balkenBreite * d.serien.length) / 2 + si * balkenBreite
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

function baueKreis(
  d: DiagrammSpec,
  gen: ReturnType<typeof rough.generator>,
): { pfade: Pfad[]; texte: TextElement[] } {
  const pfade: Pfad[] = []
  const texte: TextElement[] = []
  const punkte = d.serien[0].punkte
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
