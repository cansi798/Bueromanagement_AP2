import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeBereiche, useDaten } from '../lib/data'
import { farbe } from '../lib/farben'
import type { BereichId } from '../types'

const STUFEN = [
  {
    nr: 1,
    pfad: 'stufe1',
    name: 'Auffrischung',
    text: 'Lernzettel, Eselsbrücken und Selbstchecks – den Stoff verstehen.',
    icon: '📚',
  },
  {
    nr: 2,
    pfad: 'stufe2',
    name: 'Themen-Training',
    text: 'Prüfungsaufgaben nach Themen sortiert gezielt üben.',
    icon: '🎯',
  },
  {
    nr: 3,
    pfad: 'stufe3',
    name: 'Prüfungsjahre',
    text: 'Komplette Prüfungen durcharbeiten – auch als Simulation mit Timer.',
    icon: '🏁',
  },
]

export default function Bereich() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: bereiche, fehler, laedt } = useDaten(ladeBereiche)
  const bereich = bereiche?.find((b) => b.id === bereichId)

  if (laedt) return <Layout><p className="text-slate-500">Lade …</p></Layout>
  if (fehler || !bereich)
    return (
      <Layout titel="Lernbereich">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          {fehler ?? 'Diesen Lernbereich gibt es nicht.'}
        </p>
      </Layout>
    )

  const f = farbe(bereich.farbe)

  return (
    <Layout titel={bereich.name}>
      <p className="-mt-2 mb-6 text-slate-600">{bereich.beschreibung}</p>
      <div className="space-y-3">
        {STUFEN.map((s) => (
          <Link
            key={s.nr}
            to={`/${bereich.id}/${s.pfad}`}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}
          >
            <span className="text-3xl">{s.icon}</span>
            <div>
              <h2 className="font-bold text-slate-900">
                Stufe {s.nr} · {s.name}
              </h2>
              <p className="text-sm text-slate-600">{s.text}</p>
            </div>
          </Link>
        ))}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to={`/${bereich.id}/karten`}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}
          >
            <span className="text-3xl">🃏</span>
            <div>
              <h2 className="font-bold text-slate-900">Karteikarten</h2>
              <p className="text-sm text-slate-600">Täglich wiederholen mit System.</p>
            </div>
          </Link>
          <Link
            to={`/landkarte/${bereich.id}`}
            className={`flex items-center gap-4 rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}
          >
            <span className="text-3xl">🗺️</span>
            <div>
              <h2 className="font-bold text-slate-900">Themen-Landkarte</h2>
              <p className="text-sm text-slate-600">Was kommt wie oft dran?</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  )
}
