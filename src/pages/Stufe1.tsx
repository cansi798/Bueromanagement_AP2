import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import MedienSlot from '../components/MedienSlot'
import { ladeThemen, useDaten } from '../lib/data'
import type { BereichId, Thema } from '../types'

function ThemaKarte({ thema }: { thema: Thema }) {
  const [offen, setOffen] = useState(false)
  const [checkOffen, setCheckOffen] = useState<number | null>(null)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOffen(!offen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div>
          <h2 className="font-bold text-slate-900">{thema.name}</h2>
          <p className="text-sm text-slate-500">{thema.beschreibung}</p>
        </div>
        <span className="ml-3 shrink-0 text-slate-400">{offen ? '▲' : '▼'}</span>
      </button>

      {offen && (
        <div className="border-t border-slate-100 p-4 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-6">
          <div>
            <Markdown text={thema.lernzettel} />

            {thema.selbstcheck.length > 0 && (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Selbstcheck – kannst du das beantworten?
                </p>
                <div className="space-y-2">
                  {thema.selbstcheck.map((frage, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCheckOffen(checkOffen === i ? null : i)}
                      className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm hover:border-sky-300"
                    >
                      {frage}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 space-y-4 lg:mt-0">
            {thema.eselsbruecken.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Eselsbrücken
                </p>
                <div className="space-y-2">
                  {thema.eselsbruecken.map((e, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                    >
                      💡 {e}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <MedienSlot medien={thema.medien} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Stufe1() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))

  return (
    <Layout titel="Stufe 1 · Auffrischung">
      <p className="-mt-2 mb-5 text-slate-600">
        Die wesentlichen Inhalte pro Thema – zum Verstehen und Erinnern.
      </p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}
      <div className="space-y-3">
        {themen?.map((t) => <ThemaKarte key={t.id} thema={t} />)}
      </div>
    </Layout>
  )
}
