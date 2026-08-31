import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import QuelleBadge from '../components/QuelleBadge'
import QuizMC from '../components/QuizMC'
import QuizOffen from '../components/QuizOffen'
import { ladeAufgaben, ladeThemen, useDaten } from '../lib/data'
import { heuteISO, ladeFortschritt, merkeErledigt, merkeQuiz } from '../lib/progress'
import type { Aufgabe, BereichId } from '../types'

function AufgabenKarte({ aufgabe, erledigt }: { aufgabe: Aufgabe; erledigt: boolean }) {
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
            <div
              className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${
                zeigeAnlage ? '' : 'hidden lg:block'
              }`}
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Anlage
              </p>
              <Markdown text={aufgabe.anlagenText} />
            </div>
          </div>
        </div>
      ) : (
        quiz
      )}
    </div>
  )
}

export default function Stufe2() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: themen } = useDaten(() => ladeThemen(bereichId!))
  const { daten: aufgaben, fehler, laedt } = useDaten(() => ladeAufgaben(bereichId!))
  const [themaId, setThemaId] = useState<string | null>(null)
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
