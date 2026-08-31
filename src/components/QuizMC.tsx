import { useState } from 'react'
import type { Aufgabe } from '../types'
import { wertungMC } from '../lib/quiz'
import Markdown from './Markdown'
import OptionText from './OptionText'

export default function QuizMC({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: Aufgabe
  onErgebnis: (richtig: boolean) => void
}) {
  const [gewaehlt, setGewaehlt] = useState<number[]>([])
  const [abgegeben, setAbgegeben] = useState(false)
  const korrekt = aufgabe.korrekt ?? []
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

  return (
    <div>
      <Markdown text={aufgabe.text} />
      {mehrfach && <p className="mt-1 text-xs text-slate-500">Mehrere Antworten möglich.</p>}
      <div className="mt-3 space-y-2">
        {(aufgabe.optionen ?? []).map((opt, i) => {
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
          className="mt-3 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40"
        >
          Prüfen
        </button>
      ) : (
        <div className="mt-3">
          <p
            className={`font-semibold ${
              wertungMC(korrekt, gewaehlt) ? 'text-green-700' : 'text-red-700'
            }`}
          >
            {wertungMC(korrekt, gewaehlt) ? '✔ Richtig!' : '✘ Leider falsch.'}
          </p>
          {aufgabe.erklaerung && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3">
              <Markdown text={aufgabe.erklaerung} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
