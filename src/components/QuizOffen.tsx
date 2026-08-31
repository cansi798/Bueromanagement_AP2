import { useState } from 'react'
import type { Aufgabe } from '../types'
import Markdown from './Markdown'

export default function QuizOffen({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: Aufgabe
  onErgebnis: (richtig: boolean) => void
}) {
  const [zeigeLoesung, setZeigeLoesung] = useState(false)
  const [bewertet, setBewertet] = useState(false)

  return (
    <div>
      <Markdown text={aufgabe.text} />
      {aufgabe.punkte !== undefined && (
        <p className="mt-1 text-xs text-slate-500">{aufgabe.punkte} Punkte</p>
      )}
      {!zeigeLoesung ? (
        <button
          type="button"
          onClick={() => setZeigeLoesung(true)}
          className="mt-3 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-700"
        >
          Lösung anzeigen
        </button>
      ) : (
        <div className="mt-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
              Musterlösung
            </p>
            <Markdown text={aufgabe.loesung} />
          </div>
          {aufgabe.erklaerung && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {aufgabe.typ === 'rechnen' ? 'Rechenweg' : 'Erklärung'}
              </p>
              <Markdown text={aufgabe.erklaerung} />
            </div>
          )}
          {!bewertet ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBewertet(true)
                  onErgebnis(true)
                }}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
              >
                Wusste ich ✔
              </button>
              <button
                type="button"
                onClick={() => {
                  setBewertet(true)
                  onErgebnis(false)
                }}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2.5 font-semibold text-white hover:bg-red-600"
              >
                Wusste ich nicht ✘
              </button>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-slate-500">Selbsteinschätzung gespeichert.</p>
          )}
        </div>
      )}
    </div>
  )
}
