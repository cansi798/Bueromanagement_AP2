import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import QuelleBadge from '../components/QuelleBadge'
import QuizMC from '../components/QuizMC'
import QuizOffen from '../components/QuizOffen'
import { ladeAufgaben, ladePruefungen, useDaten } from '../lib/data'
import { heuteISO, merkeErledigt } from '../lib/progress'
import { sammlungsNummer, terminAnzeige } from '../lib/termine'
import type { BereichId, Pruefung } from '../types'

function PruefungsKarte({ pruefung, bereichId }: { pruefung: Pruefung; bereichId: BereichId }) {
  const [uebenOffen, setUebenOffen] = useState(false)
  const { daten: aufgaben } = useDaten(() => ladeAufgaben(bereichId))
  const liste = aufgaben
    ? pruefung.aufgabenIds
        .map((id) => aufgaben.find((a) => a.id === id))
        .filter((a): a is NonNullable<typeof a> => Boolean(a))
    : []

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-900">{terminAnzeige(pruefung.termin)}</h2>
          <p className="text-sm text-slate-500">
            {pruefung.name} · {pruefung.zeitMinuten} Min · {pruefung.punkteGesamt} Punkte ·{' '}
            {pruefung.aufgabenIds.length} Aufgaben
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUebenOffen(!uebenOffen)}
            className="min-h-11 rounded-lg border-2 border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-slate-500"
          >
            {uebenOffen ? 'Schließen' : 'Üben'}
          </button>
          {sammlungsNummer(pruefung.termin) !== null && (
            <Link
              to={`/${bereichId}/simulation/${sammlungsNummer(pruefung.termin)}`}
              className="min-h-11 rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700"
            >
              Simulation ⏱
            </Link>
          )}
        </div>
      </div>

      {uebenOffen && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
          {liste.map((a, i) => (
            <div key={a.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold">Aufgabe {i + 1}</span>
                <QuelleBadge quelle={a.quelle} termin={a.termin} />
              </div>
              {a.typ === 'mc' ? (
                <QuizMC aufgabe={a} onErgebnis={() => merkeErledigt(a.id, heuteISO())} />
              ) : (
                <QuizOffen aufgabe={a} onErgebnis={() => merkeErledigt(a.id, heuteISO())} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Stufe3() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: pruefungen, fehler, laedt } = useDaten(ladePruefungen)
  const eigene = pruefungen?.filter((p) => p.bereich === bereichId) ?? []

  return (
    <Layout titel="Stufe 3 · Aufgabensammlungen">
      <p className="-mt-2 mb-5 text-slate-600">
        Komplette Aufgabensammlungen im Prüfungsformat durcharbeiten – im Übungsmodus mit
        Lösungen oder als Simulation unter echten Bedingungen.
      </p>
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}
      <div className="space-y-4">
        {eigene
          .sort((a, b) => (sammlungsNummer(a.termin) ?? 0) - (sammlungsNummer(b.termin) ?? 0))
          .map((p) => (
            <PruefungsKarte key={p.termin + p.bereich} pruefung={p} bereichId={bereichId!} />
          ))}
        {!laedt && !fehler && eigene.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-center text-slate-500">
            Für diesen Bereich sind noch keine Aufgabensammlungen hinterlegt.
          </p>
        )}
      </div>
    </Layout>
  )
}
