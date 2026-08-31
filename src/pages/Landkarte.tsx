import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { ladeThemen, useDaten } from '../lib/data'
import type { BereichId } from '../types'

export default function Landkarte() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))

  const sortiert = [...(themen ?? [])].sort(
    (a, b) => b.haeufigkeit.length - a.haeufigkeit.length,
  )
  const max = Math.max(1, ...sortiert.map((t) => t.haeufigkeit.length))

  return (
    <Layout titel="Themen-Landkarte">
      <p className="-mt-2 mb-5 text-slate-600">
        Welche Themen kommen wie oft in den Prüfungen dran? Übe zuerst, was am
        wahrscheinlichsten geprüft wird.
      </p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      <div className="space-y-3">
        {sortiert.map((t) => (
          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-bold text-slate-900">{t.name}</h2>
              <span className="shrink-0 text-sm font-semibold text-slate-500">
                {t.haeufigkeit.length}× geprüft
              </span>
            </div>
            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-sky-500"
                style={{ width: `${(t.haeufigkeit.length / max) * 100}%` }}
              />
            </div>
            <div className="mt-3 flex gap-3 text-sm font-medium">
              <Link to={`/${bereichId}/stufe1`} className="text-sky-700 hover:underline">
                📚 Auffrischen
              </Link>
              <Link
                to={`/${bereichId}/stufe2?thema=${t.id}`}
                className="text-sky-700 hover:underline"
              >
                🎯 Üben
              </Link>
              <Link
                to={`/unterricht/${bereichId}/${t.id}`}
                className="text-sky-700 hover:underline"
              >
                🧑‍🏫 Session
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
