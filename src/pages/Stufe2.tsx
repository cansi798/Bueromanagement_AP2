import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import AufgabenKarte from '../components/AufgabenKarte'
import { ladeAufgaben, ladeThemen, useDaten } from '../lib/data'
import { ladeFortschritt } from '../lib/progress'
import type { BereichId } from '../types'

export default function Stufe2() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: themen } = useDaten(() => ladeThemen(bereichId!))
  const { daten: aufgaben, fehler, laedt } = useDaten(() => ladeAufgaben(bereichId!))
  const [suchParams] = useSearchParams()
  const [themaId, setThemaId] = useState<string | null>(suchParams.get('thema'))
  const [nurOffene, setNurOffene] = useState(false)
  const erledigte = useMemo(() => new Set(ladeFortschritt().erledigteAufgaben), [])

  const sichtbar = useMemo(() => {
    if (!aufgaben) return []
    return aufgaben
      .filter((a) => (themaId ? a.themaId === themaId : true))
      .filter((a) => (nurOffene ? !erledigte.has(a.id) : true))
  }, [aufgaben, themaId, nurOffene, erledigte])

  return (
    <Layout titel="Stufe 2 · Themen-Training">
      <p className="-mt-2 mb-2 text-slate-600">
        Aufgaben nach Themen sortiert – wähle ein Thema und leg los.
      </p>
      <p className="mb-5 text-xs text-slate-500">
        <span className="mr-1 rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">Aufgabensammlung N</span>
        Aufgabe aus einer kompletten Sammlung ·{' '}
        <span className="mx-1 rounded-full bg-teal-100 px-2 py-0.5 font-medium text-teal-800">Variante</span>
        abgewandelte Aufgabe ·{' '}
        <span className="mx-1 rounded-full bg-slate-200 px-2 py-0.5 font-medium text-slate-700">Training</span>
        zusätzliche Übungsaufgabe
      </p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      {themen && aufgaben && (
        <>
          {/* Themen-Filter: mobil als wischbare Leiste, ab md als Raster */}
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Thema wählen
            </p>
            <button
              type="button"
              onClick={() => setNurOffene(!nurOffene)}
              aria-pressed={nurOffene}
              className={`min-h-9 rounded-full border-2 px-3 text-xs font-semibold transition ${
                nurOffene
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-400'
              }`}
            >
              {nurOffene ? '✔ Nur ungeübte' : 'Nur ungeübte'}
            </button>
          </div>
          <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            <button
              type="button"
              onClick={() => setThemaId(null)}
              className={`min-h-11 shrink-0 rounded-xl border-2 px-4 text-sm font-semibold transition ${
                themaId === null
                  ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              Alle Themen
            </button>
            {themen.map((t) => {
              const anzahl = aufgaben.filter((a) => a.themaId === t.id).length
              if (anzahl === 0) return null
              const aktivChip = themaId === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemaId(aktivChip ? null : t.id)}
                  className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border-2 px-4 text-sm font-semibold transition ${
                    aktivChip
                      ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}
                >
                  <span className="max-w-48 truncate sm:max-w-none">{t.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      aktivChip ? 'bg-white/20 text-white' : 'bg-sky-100 text-sky-800'
                    }`}
                  >
                    {anzahl}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-4">
            {sichtbar.map((a) => (
              <AufgabenKarte key={a.id} aufgabe={a} erledigt={erledigte.has(a.id)} />
            ))}
            {sichtbar.length === 0 && (
              <p className="rounded-lg bg-white p-6 text-center text-slate-500">
                Keine Aufgaben in dieser Auswahl. 🎉
              </p>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
