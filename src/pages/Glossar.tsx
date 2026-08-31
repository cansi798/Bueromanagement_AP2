import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { ladeBereiche, ladeGlossar, useDaten } from '../lib/data'
import type { BereichId } from '../types'

export default function Glossar() {
  const { daten: eintraege, fehler, laedt } = useDaten(ladeGlossar)
  const { daten: bereiche } = useDaten(ladeBereiche)
  const [filter, setFilter] = useState<BereichId | null>(null)

  const gruppen = useMemo(() => {
    const sichtbar = (eintraege ?? [])
      .filter((e) => (filter ? e.bereiche.includes(filter) : true))
      .sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
    const map = new Map<string, typeof sichtbar>()
    for (const e of sichtbar) {
      const buchstabe = e.begriff[0].toUpperCase()
      map.set(buchstabe, [...(map.get(buchstabe) ?? []), e])
    }
    return [...map.entries()]
  }, [eintraege, filter])

  return (
    <Layout titel="Glossar">
      <p className="-mt-2 mb-5 text-slate-600">Die wichtigsten Fachbegriffe kurz erklärt.</p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      {bereiche && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setFilter(null)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              filter === null ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
            }`}
          >
            Alle
          </button>
          {bereiche.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setFilter(filter === b.id ? null : b.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                filter === b.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
              }`}
            >
              {b.kurz}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {gruppen.map(([buchstabe, liste]) => (
          <div key={buchstabe}>
            <h2 className="mb-2 text-sm font-bold text-slate-400">{buchstabe}</h2>
            <div className="space-y-2">
              {liste.map((e) => (
                <div key={e.begriff} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="font-semibold text-slate-900">{e.begriff}</p>
                  <p className="text-sm text-slate-600">{e.definition}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}
