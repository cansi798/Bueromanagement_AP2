import { useState } from 'react'
import Markdown from './Markdown'
import {
  aktuellesModell,
  bewerteAntwort,
  kiGeladen,
  kiVerfuegbar,
  KI_MODELLE,
  waehleModell,
} from '../lib/ki'

type Status = 'idle' | 'laedt' | 'fertig' | 'fehler'

// Bewertet eine Schülerantwort gegen die Musterlösung — lokal im Browser,
// mit wählbarem Modell (Blitz / Standard / Beste Qualität).
export default function KIBewertung({
  frage,
  loesung,
  antwort,
}: {
  frage: string
  loesung: string
  antwort: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const [fortschritt, setFortschritt] = useState('')
  const [feedback, setFeedback] = useState('')
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
    try {
      const ergebnis = await bewerteAntwort(frage, loesung, antwort, (text, prozent) =>
        setFortschritt(`Modell lädt: ${prozent} % — ${text.slice(0, 60)}`),
      )
      setFeedback(ergebnis)
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
