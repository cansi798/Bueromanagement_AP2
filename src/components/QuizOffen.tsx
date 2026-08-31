import { useState } from 'react'
import type { Aufgabe } from '../types'
import Markdown from './Markdown'
import KIBewertung from './KIBewertung'

export default function QuizOffen({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: Aufgabe
  onErgebnis: (richtig: boolean) => void
}) {
  const [zeigeLoesung, setZeigeLoesung] = useState(false)
  const [bewertet, setBewertet] = useState(false)
  const [antwort, setAntwort] = useState('')

  return (
    <div>
      <Markdown text={aufgabe.text} />
      {aufgabe.punkte !== undefined && (
        <p className="mt-1 text-xs text-slate-500">{aufgabe.punkte} Punkte</p>
      )}

      {!zeigeLoesung ? (
        <div className="mt-3">
          <textarea
            value={antwort}
            onChange={(e) => setAntwort(e.target.value)}
            placeholder="✍️ Schreibe hier deine Antwort — danach kannst du sie mit der Musterlösung vergleichen …"
            rows={4}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-[15px] focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setZeigeLoesung(true)}
            className="mt-2 min-h-11 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white hover:bg-sky-700"
          >
            Lösung anzeigen & vergleichen
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <div className={antwort.trim() ? 'grid gap-2 sm:grid-cols-2' : ''}>
            {antwort.trim() && (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
                  ✍️ Deine Antwort
                </p>
                <p className="whitespace-pre-wrap text-[15px] text-slate-800">{antwort}</p>
              </div>
            )}
            <div className="rounded-lg border border-green-200 bg-green-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                ✅ Musterlösung
              </p>
              <Markdown text={aufgabe.loesung} />
            </div>
          </div>

          {aufgabe.erklaerung && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {aufgabe.typ === 'rechnen' ? 'Rechenweg' : 'Erklärung'}
              </p>
              <Markdown text={aufgabe.erklaerung} />
            </div>
          )}

          <KIBewertung frage={aufgabe.text} loesung={aufgabe.loesung} antwort={antwort} />

          {!bewertet ? (
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setBewertet(true)
                  onErgebnis(true)
                }}
                className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2.5 font-semibold text-white hover:bg-green-700"
              >
                Wusste ich ✔
              </button>
              <button
                type="button"
                onClick={() => {
                  setBewertet(true)
                  onErgebnis(false)
                }}
                className="min-h-11 flex-1 rounded-lg bg-red-500 px-4 py-2.5 font-semibold text-white hover:bg-red-600"
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
