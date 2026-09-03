import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import BereichKachel from '../components/BereichKachel'
import { ladeAufgaben, ladeBereiche, useDaten } from '../lib/data'
import { bereichsFortschritt, ladeFortschritt } from '../lib/progress'
import type { Aufgabe, BereichId } from '../types'

export default function Home() {
  const { daten: bereiche, fehler, laedt } = useDaten(ladeBereiche)
  const [fortschritte, setFortschritte] = useState<Partial<Record<BereichId, number>>>({})

  useEffect(() => {
    if (!bereiche) return
    const f = ladeFortschritt()
    Promise.all(
      bereiche.map(async (b) => {
        // Bereiche ohne Contentdatei zählen einfach als 0 % — kein Fehler.
        const aufgaben: Aufgabe[] = await ladeAufgaben(b.id).catch(() => [])
        return [b.id, bereichsFortschritt(f, aufgaben)] as const
      }),
    ).then((paare) => setFortschritte(Object.fromEntries(paare)))
  }, [bereiche])

  const streak = ladeFortschritt().streak

  return (
    <Layout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Willkommen im Prüfungscoach</h1>
          <p className="mt-1 text-slate-600">
            Für Unterricht und Selbstlernen: Wähle einen Lernbereich – mit
            Unterrichts-Sessions, Auffrischung, Themen-Training und Aufgabensammlungen im
            Prüfungsformat.
          </p>
        </div>
        {streak.tage > 0 && (
          <div className="shrink-0 rounded-xl bg-orange-100 px-3 py-2 text-center">
            <div className="text-xl">🔥</div>
            <div className="text-xs font-semibold text-orange-800">{streak.tage} Tage</div>
          </div>
        )}
      </div>
      {laedt && <p className="text-slate-500">Lade Inhalte …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}
      {bereiche && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bereiche.map((b) => (
            <BereichKachel key={b.id} bereich={b} fortschritt={fortschritte[b.id] ?? 0} />
          ))}
          <Link
            to="/glossar"
            className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm transition hover:border-sky-400 hover:shadow-md sm:col-span-2"
          >
            <span className="text-3xl">📖</span>
            <span>
              <span className="block font-bold text-slate-900">Begriffe & Formeln</span>
              <span className="block text-sm text-slate-600">
                Alle Fachbegriffe und Prüfungsformeln zum Nachschlagen — mit PDF-Download.
              </span>
            </span>
          </Link>
        </div>
      )}
    </Layout>
  )
}
