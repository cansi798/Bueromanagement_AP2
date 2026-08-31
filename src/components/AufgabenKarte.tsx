import { useState } from 'react'
import Anlage from './Anlage'
import QuelleBadge from './QuelleBadge'
import QuizMC from './QuizMC'
import QuizOffen from './QuizOffen'
import { heuteISO, merkeErledigt, merkeQuiz } from '../lib/progress'
import type { Aufgabe } from '../types'

export default function AufgabenKarte({
  aufgabe,
  erledigt,
}: {
  aufgabe: Aufgabe
  erledigt: boolean
}) {
  const [zeigeAnlage, setZeigeAnlage] = useState(false)
  const [istErledigt, setIstErledigt] = useState(erledigt)

  function ergebnis(richtig: boolean) {
    merkeErledigt(aufgabe.id, heuteISO())
    merkeQuiz(aufgabe.themaId, richtig ? 1 : 0, 1, heuteISO())
    setIstErledigt(true)
  }

  const quiz =
    aufgabe.typ === 'mc' ? (
      <QuizMC aufgabe={aufgabe} onErgebnis={ergebnis} />
    ) : (
      <QuizOffen aufgabe={aufgabe} onErgebnis={ergebnis} />
    )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <QuelleBadge quelle={aufgabe.quelle} termin={aufgabe.termin} />
        {istErledigt && <span className="text-sm text-green-600">✔ geübt</span>}
      </div>

      {aufgabe.anlagenText ? (
        <div className="lg:grid lg:grid-cols-2 lg:gap-5">
          <div>{quiz}</div>
          <div className="mt-3 lg:mt-0">
            <button
              type="button"
              onClick={() => setZeigeAnlage(!zeigeAnlage)}
              className="mb-2 text-sm font-medium text-sky-700 lg:hidden"
            >
              {zeigeAnlage ? 'Anlage ausblenden ▲' : 'Anlage anzeigen ▼'}
            </button>
            <div className={zeigeAnlage ? '' : 'hidden lg:block'}>
              <Anlage text={aufgabe.anlagenText} />
            </div>
          </div>
        </div>
      ) : (
        quiz
      )}
    </div>
  )
}
