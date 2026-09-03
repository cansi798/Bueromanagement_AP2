import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import { ladeBereiche, ladeFormeln, ladeGlossar, useDaten } from '../lib/data'
import type { BereichId } from '../types'

// Kachel „Begriffe & Formeln": Glossar (A–Z) und Formelsammlung (nach
// Kategorie), beides nach Bereich filterbar, mit PDF-Download.
export default function Glossar() {
  const { daten: eintraege, fehler, laedt } = useDaten(ladeGlossar)
  const { daten: formeln } = useDaten(ladeFormeln)
  const { daten: bereiche } = useDaten(ladeBereiche)
  const [filter, setFilter] = useState<BereichId | null>(null)
  const [tab, setTab] = useState<'begriffe' | 'formeln'>('begriffe')

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

  const kategorien = useMemo(() => {
    const sichtbar = (formeln ?? []).filter((f) => (filter ? f.bereiche.includes(filter) : true))
    const map = new Map<string, typeof sichtbar>()
    for (const f of sichtbar) {
      map.set(f.kategorie, [...(map.get(f.kategorie) ?? []), f])
    }
    return [...map.entries()]
  }, [formeln, filter])

  return (
    <Layout titel="Begriffe & Formeln">
      <div className="-mt-2 mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-600">Fachbegriffe und alle Prüfungsformeln zum Nachschlagen.</p>
        <div className="flex gap-2">
          <a
            href="./downloads/begriffe-formeln.pdf"
            download
            className="rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-sky-400"
          >
            ⬇️ PDF
          </a>
          <Link
            to="/nachschlagewerk"
            className="rounded-lg border-2 border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:border-sky-400"
          >
            🖨️ Druckansicht
          </Link>
        </div>
      </div>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      <div className="mb-4 flex gap-2">
        {(
          [
            ['begriffe', '📖 Begriffe'],
            ['formeln', '🧮 Formeln'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-xl px-4 py-2 font-semibold ${
              tab === id ? 'bg-sky-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

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

      {tab === 'begriffe' ? (
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
      ) : (
        <div className="space-y-6">
          {kategorien.map(([kategorie, liste]) => (
            <div key={kategorie}>
              <h2 className="mb-2 text-sm font-bold text-slate-400">{kategorie}</h2>
              <div className="grid gap-2 lg:grid-cols-2">
                {liste.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="font-semibold text-slate-900">{f.titel}</p>
                    <Markdown text={f.formel} />
                    {f.erklaerung && <p className="mt-1 text-sm text-slate-600">{f.erklaerung}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
