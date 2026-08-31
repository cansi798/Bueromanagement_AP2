import { useState } from 'react'
import Markdown from './Markdown'
import { bewerteAntwort, kiGeladen, kiVerfuegbar, KI_MODELL_NAME } from '../lib/ki'

type Status = 'idle' | 'laedt' | 'fertig' | 'fehler'

// Bewertet eine Schülerantwort gegen die Musterlösung — lokal im Browser.
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
        <div>
          <button
            type="button"
            onClick={starten}
            className="min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
          >
            🤖 Mit KI bewerten lassen
          </button>
          {!kiGeladen() && (
            <p className="mt-1.5 text-xs text-slate-400">
              Beim ersten Mal lädt dein Browser {KI_MODELL_NAME} herunter (~1,4 GB, einmalig —
              bleibt gespeichert). Am besten im WLAN.
            </p>
          )}
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
            🤖 KI-Feedback ({KI_MODELL_NAME})
          </p>
          <Markdown text={feedback} />
          <p className="mt-2 text-xs text-slate-400">
            Hinweis: KI kann sich irren — im Zweifel gilt die Musterlösung.
          </p>
        </div>
      )}
      {status === 'fehler' && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Die KI-Bewertung hat leider nicht geklappt (Modell konnte nicht geladen werden).
          <button type="button" onClick={starten} className="ml-2 font-semibold underline">
            Nochmal versuchen
          </button>
        </div>
      )}
    </div>
  )
}
