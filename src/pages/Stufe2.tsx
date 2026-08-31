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
          {/* Themenwahl als Dropdown + Filter-Toggle */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="themawahl">
              Thema wählen
            </label>
            <select
              id="themawahl"
              value={themaId ?? ''}
              onChange={(e) => setThemaId(e.target.value || null)}
              className="min-h-12 min-w-0 flex-1 cursor-pointer appearance-none rounded-xl border-2 border-slate-300 bg-white bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%2364748b%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M8%2011L3%206h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.75rem_center] bg-no-repeat px-3 pr-9 text-[15px] font-semibold text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none"
            >
              <option value="">📚 Alle Themen ({aufgaben.length} Aufgaben)</option>
              {themen.map((t) => {
                const anzahl = aufgaben.filter((a) => a.themaId === t.id).length
                if (anzahl === 0) return null
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({anzahl})
                  </option>
                )
              })}
            </select>
            <button
              type="button"
              onClick={() => setNurOffene(!nurOffene)}
              aria-pressed={nurOffene}
              className={`min-h-12 shrink-0 rounded-xl border-2 px-4 text-sm font-semibold transition ${
                nurOffene
                  ? 'border-green-600 bg-green-600 text-white'
                  : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
              }`}
            >
              {nurOffene ? '✔ Nur ungeübte' : 'Nur ungeübte'}
            </button>
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
