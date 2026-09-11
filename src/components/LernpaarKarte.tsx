import { useState } from 'react'
import type { Lernpaar } from '../types'
import { wertungMC } from '../lib/quiz'
import { alleAusgefuellt, wertungZuordnung } from '../lib/zuordnung'
import type { SelbstWertung } from '../lib/lernquiz'
import Markdown from './Markdown'
import OptionText from './OptionText'
import ZuordnungFelder from './ZuordnungFelder'

// Eine Quizfrage im Leitner-Modus (MC oder Ziffern-Zuordnung): nach dem
// Prüfen erscheint die Erklärung und der Weiter-Button — Wertung meldet
// die Seite ans Leitner-System.
export default function LernpaarKarte({
  paar,
  optionen,
  korrekt,
  fach,
  modus = 'auswahl',
  onErgebnis,
  onSelbst,
  onWeiter,
}: {
  paar: Lernpaar
  optionen: string[]
  korrekt: number[]
  fach: number | null // aktuelles Leitner-Fach, null = neue Frage
  modus?: 'auswahl' | 'freitext'
  onErgebnis: (richtig: boolean) => void
  onSelbst?: (wertung: SelbstWertung) => void
  onWeiter: () => void
}) {
  const [gewaehlt, setGewaehlt] = useState<number[]>([])
  const [antworten, setAntworten] = useState<Record<string, string>>({})
  const [abgegeben, setAbgegeben] = useState(false)
  const [text, setText] = useState('')
  const [selbstGewertet, setSelbstGewertet] = useState<SelbstWertung | null>(null)
  const zuordnung = paar.typ === 'zuordnung' ? paar.zuordnung : undefined
  const mehrfach = !zuordnung && korrekt.length > 1
  const freitext = modus === 'freitext' && !zuordnung

  function toggle(i: number) {
    if (abgegeben) return
    setGewaehlt((g) =>
      mehrfach ? (g.includes(i) ? g.filter((x) => x !== i) : [...g, i]) : [i],
    )
  }

  const richtig = zuordnung
    ? wertungZuordnung(zuordnung, antworten).richtig
    : wertungMC(korrekt, gewaehlt)
  const pruefenGesperrt = freitext
    ? text.trim().length === 0
    : zuordnung
      ? !alleAusgefuellt(zuordnung, antworten)
      : gewaehlt.length === 0

  function abgeben() {
    setAbgegeben(true)
    if (!freitext) onErgebnis(richtig)
  }

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

      {zuordnung ? (
        <ZuordnungFelder
          zuordnung={zuordnung}
          antworten={antworten}
          onAntwort={(label, wert) =>
            setAntworten((alt) => ({ ...alt, [label]: wert }))
          }
          abgegeben={abgegeben}
        />
      ) : freitext && !abgegeben ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="✍️ Formuliere die Antwort in eigenen Worten …"
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white p-3 text-[15px] focus:border-sky-500 focus:outline-none"
        />
      ) : freitext && abgegeben ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-sky-700">✍️ Deine Antwort</p>
            <p className="whitespace-pre-wrap text-[15px] text-slate-800">{text}</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-green-700">Musterlösung</p>
            <ul className="list-disc pl-4 text-[15px] text-slate-800">
              {korrekt.map((i) => (
                <li key={i}><OptionText text={optionen[i]} /></li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
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
      )}

      {!abgegeben ? (
        <button
          type="button"
          onClick={abgeben}
          disabled={pruefenGesperrt}
          className="mt-4 min-h-12 w-full rounded-xl bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 disabled:opacity-40 sm:w-auto sm:px-8"
        >
          Prüfen
        </button>
      ) : freitext ? (
        <>
          <div className="mt-2 rounded-lg bg-slate-50 p-3">
            <Markdown text={paar.erklaerung} />
          </div>
          {selbstGewertet === null ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                ['gewusst', '✔ Gewusst', 'bg-green-600 hover:bg-green-700'],
                ['teilweise', '≈ Teilweise', 'bg-amber-500 hover:bg-amber-600'],
                ['nicht', '✘ Nicht gewusst', 'bg-red-500 hover:bg-red-600'],
              ] as const).map(([wertung, label, stil]) => (
                <button key={wertung} type="button"
                  onClick={() => { setSelbstGewertet(wertung); onSelbst?.(wertung) }}
                  className={`min-h-12 rounded-xl px-2 text-sm font-semibold text-white ${stil}`}>
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <button type="button" onClick={onWeiter}
              className="mt-4 min-h-12 w-full rounded-xl bg-slate-900 px-4 font-semibold text-white hover:bg-slate-800 sm:w-auto sm:px-8">
              Weiter →
            </button>
          )}
        </>
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
