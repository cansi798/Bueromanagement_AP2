import { useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import QuizOffen from '../components/QuizOffen'
import { ladeAufgaben, ladeThemen, useDaten } from '../lib/data'
import { heuteISO, merkeAufgabenErgebnis, merkeQuiz } from '../lib/progress'

type Kategorie = 'ablauf' | 'ueben'

export default function Muendlich() {
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen('muendlich'))
  const { daten: aufgaben } = useDaten(() => ladeAufgaben('muendlich'))
  const [kategorie, setKategorie] = useState<Kategorie>('ablauf')
  const [offenesThema, setOffenesThema] = useState<string | null>(null)

  return (
    <Layout titel="Mündliche Prüfung">
      <p className="-mt-2 mb-5 text-slate-600">
        Report, Fachaufgabe und Prüfungsgespräch – hier bereitest du dich gezielt auf das
        mündliche Format vor.
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {(
          [
            ['ablauf', '📋 Ablauf & Report'],
            ['ueben', '🗣️ Beispielprüfungen üben'],
          ] as [Kategorie, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setKategorie(k)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              kategorie === k ? 'bg-violet-600 text-white' : 'bg-white text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
        <Link
          to="/muendlich/karten"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          🃏 Karteikarten
        </Link>
        <Link
          to="/muendlich/quiz"
          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          🧠 Themen-Quiz
        </Link>
      </div>

      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      {kategorie === 'ablauf' && themen && (
        <div className="space-y-3">
          {themen.map((t) => (
            <div key={t.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => setOffenesThema(offenesThema === t.id ? null : t.id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <h2 className="font-bold text-slate-900">{t.name}</h2>
                  <p className="text-sm text-slate-500">{t.beschreibung}</p>
                </div>
                <span className="ml-3 text-slate-400">{offenesThema === t.id ? '▲' : '▼'}</span>
              </button>
              {offenesThema === t.id && (
                <div className="border-t border-slate-100 p-4">
                  <Markdown text={t.lernzettel} />
                  {t.eselsbruecken.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {t.eselsbruecken.map((e, i) => (
                        <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          💡 {e}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {kategorie === 'ueben' && aufgaben && (
        <div className="space-y-4">
          {aufgaben.map((a, i) => (
            <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="mb-2 text-sm font-semibold text-slate-500">Prüfungsfrage {i + 1}</p>
              <QuizOffen
                aufgabe={a}
                onErgebnis={(richtig) => {
                  merkeAufgabenErgebnis(a.id, richtig, heuteISO())
                  merkeQuiz(a.themaId, richtig ? 1 : 0, 1, heuteISO())
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Layout>
  )
}
