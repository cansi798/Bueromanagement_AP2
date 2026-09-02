import { useState } from 'react'
import type { Lernpaar } from '../types'
import { wertungMC } from '../lib/quiz'
import Markdown from './Markdown'
import OptionText from './OptionText'

// Eine MC-Quizfrage im Leitner-Modus: nach dem Prüfen erscheint die
// Erklärung und der Weiter-Button — Wertung meldet die Seite ans Leitner-System.
export default function LernpaarKarte({
  paar,
  optionen,
  korrekt,
  fach,
  onErgebnis,
  onWeiter,
}: {
  paar: Lernpaar
  optionen: string[]
  korrekt: number[]
  fach: number | null // aktuelles Leitner-Fach, null = neue Frage
  onErgebnis: (richtig: boolean) => void
  onWeiter: () => void
}) {
  const [gewaehlt, setGewaehlt] = useState<number[]>([])
  const [abgegeben, setAbgegeben] = useState(false)
  const mehrfach = korrekt.length > 1

  function toggle(i: number) {
    if (abgegeben) return
    setGewaehlt((g) =>
      mehrfach ? (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]) : [i],
    )
  }

  function abgeben() {
    setAbgegeben(true)
    onErgebnis(wertungMC(korrekt, gewaehlt))
  }

  const richtig = wertungMC(korrekt, gewaehlt)

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="rounded-full bg-slate-100 px-2 py-0.5">
          {fach === null ? '✨ Neue Frage' : `📦 Fach ${fach} von 5`}
        </span>
        {paar.schwierigkeit && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            {'★'.repeat(paar.schwierigkeit)}
            {'☆'.repeat(3 - paar.schwierigkeit)}
          </span>
        )}
        {paar.quellTermin && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            angelehnt an Prüfung
          </span>
        )}
      </div>

      <Markdown text={paar.frage} />
      {mehrfach && (
        <p className="mt-1 text-xs font-medium text-slate-500">Mehrere Antworten möglich.</p>
      )}

      <div className="mt-3 space-y-2">
        {optionen.map((opt, i) => {
          let stil = 'border-slate-300 bg-white hover:border-sky-400'
          if (abgegeben) {
            if (korrekt.includes(i)) stil = 'border-green-500 bg-green-50'
            else if (gewaehlt.includes(i)) stil = 'border-red-400 bg-red-50'
            else stil = 'border-slate-200 bg-white opacity-60'
          } else if (gewaehlt.includes(i)) {
            stil = 'border-sky-500 bg-sky-50'
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`block min-h-12 w-full rounded-lg border-2 px-3 py-2 text-left text-[15px] transition ${stil}`}
            >
              <OptionText text={opt} />
            </button>
          )
        })}
      </div>

      {!abgegeben ? (
        <button
          type="button"
          onClick={abgeben}
          disabled={gewaehlt.length === 0}
          className="mt-4 min-h-12 w-full rounded-xl bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-40 sm:w-auto sm:px-8"
        >
          Prüfen
        </button>
      ) : (
        <div className="mt-4">
          <p className={`font-semibold ${richtig ? 'text-green-700' : 'text-red-700'}`}>
            {richtig
              ? `✔ Richtig! ${fach === null ? 'Ab in Fach 2.' : fach < 5 ? `Fach ${fach} → ${fach + 1}.` : 'Fach 5 bleibt gemeistert.'}`
              : `✘ Leider falsch. ${fach && fach > 1 ? `Zurück in Fach 1.` : 'Die Frage kommt bald wieder.'}`}
          </p>
          <div className="mt-2 rounded-lg bg-slate-50 p-3">
            <Markdown text={paar.erklaerung} />
          </div>
          <button
            type="button"
            onClick={onWeiter}
            className="mt-4 min-h-12 w-full rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800 sm:w-auto sm:px-8"
          >
            Weiter →
          </button>
        </div>
      )}
    </div>
  )
}
