import { useState } from 'react'
import type { Aufgabe } from '../types'
import { alleAusgefuellt, wertungZuordnung } from '../lib/zuordnung'
import Markdown from './Markdown'
import ZuordnungFelder from './ZuordnungFelder'

// Selbständige Zuordnungs-Übung mit Sofort-Prüfung — Gegenstück zu QuizMC
// für den Übungsmodus (Stufe 2/3, Unterricht). Die Simulation nutzt
// ZuordnungFelder direkt, weil dort erst bei der Gesamtabgabe geprüft wird.
export default function ZuordnungQuiz({
  aufgabe,
  onErgebnis,
}: {
  aufgabe: Aufgabe
  onErgebnis: (richtig: boolean) => void
}) {
  const [antworten, setAntworten] = useState<Record<string, string>>({})
  const [abgegeben, setAbgegeben] = useState(false)
  const zuordnung = aufgabe.zuordnung
  if (!zuordnung) return null

  const richtig = wertungZuordnung(zuordnung, antworten).richtig

  function abgeben() {
    setAbgegeben(true)
    onErgebnis(richtig)
  }

  return (
    <div>
      <Markdown text={aufgabe.text} />
      <ZuordnungFelder
        zuordnung={zuordnung}
        antworten={antworten}
        onAntwort={(label, wert) => setAntworten((alt) => ({ ...alt, [label]: wert }))}
        abgegeben={abgegeben}
      />
      {!abgegeben ? (
        <button
          type="button"
          onClick={abgeben}
          disabled={!alleAusgefuellt(zuordnung, antworten)}
          className="mt-3 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white disabled:opacity-40"
        >
          Prüfen
        </button>
      ) : (
        <div className="mt-3">
          <p className={`font-semibold ${richtig ? 'text-green-700' : 'text-red-700'}`}>
            {richtig ? '✔ Richtig!' : '✘ Leider falsch.'}
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
