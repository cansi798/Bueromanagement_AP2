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
      <p className="-mt-2 mb-5 text-slate-600">
        Aufgaben nach Themen sortiert – Originale, Varianten und Übungsaufgaben.
      </p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      {themen && aufgaben && (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setThemaId(null)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                themaId === null ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
              }`}
            >
              Alle Themen
            </button>
            {themen.map((t) => {
              const anzahl = aufgaben.filter((a) => a.themaId === t.id).length
              if (anzahl === 0) return null
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setThemaId(themaId === t.id ? null : t.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    themaId === t.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'
                  }`}
                >
                  {t.name}
                  {t.haeufigkeit.length > 0 && (
                    <span className="ml-1 opacity-60">{t.haeufigkeit.length}×</span>
                  )}
                </button>
              )
            })}
            <label className="ml-auto flex items-center gap-1.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={nurOffene}
                onChange={(e) => setNurOffene(e.target.checked)}
              />
              Nur offene
            </label>
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
