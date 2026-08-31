import { useState } from 'react'
import Markdown from './Markdown'
import {
  aktuellesModell,
  bewerteAntwort,
  bewertePruefungsAufgabe,
  kiGeladen,
  kiVerfuegbar,
  KI_MODELLE,
  waehleModell,
} from '../lib/ki'

type Status = 'idle' | 'laedt' | 'fertig' | 'fehler'

// Bewertet eine Schülerantwort gegen die Musterlösung — lokal im Browser,
// mit wählbarem Modell (Blitz / Standard / Beste Qualität).
// Hat die Aufgabe eine Punktzahl, korrigiert die KI wie ein Prüfer und
// nennt die erreichten Punkte; sonst gibt sie eine Noten-Einschätzung.
export default function KIBewertung({
  frage,
  loesung,
  antwort,
  punkte,
}: {
  frage: string
  loesung: string
  antwort: string
  punkte?: number
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [fortschritt, setFortschritt] = useState('')
  const [feedback, setFeedback] = useState('')
  const [erreicht, setErreicht] = useState<number | null>(null)
  const [modellId, setModellId] = useState(() => aktuellesModell().id)
  const modell = KI_MODELLE.find((m) => m.id === modellId) ?? KI_MODELLE[1]

  if (!kiVerfuegbar()) {
    return (
      <p className="mt-2 text-xs text-slate-400">
        🤖 KI-Bewertung braucht einen Browser mit WebGPU (aktuelles Chrome oder Edge).
      </p>
    )
  }
  if (antwort.trim().length < 3) {
    return (
      <p className="mt-2 text-xs text-slate-400">
        🤖 Schreibe zuerst deine Antwort ins Textfeld, dann kann die KI sie bewerten.
      </p>
    )
  }

  async function starten() {
    setStatus('laedt')
    setFortschritt(kiGeladen() ? 'Bewerte …' : 'Modell wird geladen …')
    const fortschrittCb = (text: string, prozent: number) =>
      setFortschritt(`Modell lädt: ${prozent} % — ${text.slice(0, 60)}`)
    try {
      if (punkte !== undefined && punkte > 0) {
        const r = await bewertePruefungsAufgabe(frage, loesung, antwort, punkte, fortschrittCb)
        setErreicht(r.punkte)
        setFeedback(r.feedback)
      } else {
        setErreicht(null)
        setFeedback(await bewerteAntwort(frage, loesung, antwort, fortschrittCb))
      }
      setStatus('fertig')
    } catch {
      setStatus('fehler')
    }
  }

  return (
    <div className="mt-3">
      {status === 'idle' && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={starten}
              className="min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              🤖 Mit KI bewerten lassen
            </button>
            <select
              value={modellId}
              onChange={(e) => {
                setModellId(e.target.value)
                waehleModell(e.target.value)
              }}
              aria-label="KI-Modell wählen"
              className="min-h-11 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
            >
              {KI_MODELLE.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · {m.groesse}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            {modell.hinweis}
            {!kiGeladen() &&
              ` Download einmalig (${modell.groesse}), bleibt im Browser gespeichert — am besten im WLAN.`}
          </p>
        </div>
      )}
      {status === 'laedt' && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
          <p className="text-sm font-medium text-violet-800">⏳ {fortschritt}</p>
        </div>
      )}
      {status === 'fertig' && (
        <div className="rounded-lg border border-violet-200 bg-violet-50 p-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-700">
            🤖 KI-Feedback ({modell.name})
          </p>
          {erreicht !== null && punkte !== undefined && (
            <p className="mb-2 text-2xl font-black text-slate-900">
              {erreicht} <span className="text-base font-bold text-slate-500">/ {punkte} Punkte</span>
              {erreicht >= punkte && <span className="ml-2">🎉</span>}
            </p>
          )}
          <Markdown text={feedback} />
          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              KI kann sich irren — im Zweifel gilt die Musterlösung.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="shrink-0 text-xs font-semibold text-violet-700 underline"
            >
              Neu bewerten
            </button>
          </div>
        </div>
      )}
      {status === 'fehler' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Die KI-Bewertung hat nicht geklappt (Modell zu groß für dein Gerät oder Download
          unterbrochen). Tipp: kleineres Modell wählen.
          <button
            type="button"
            onClick={() => setStatus('idle')}
            className="ml-2 font-semibold underline"
          >
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
