import { useState } from 'react'
import { bewerteEingabe, type EingabeWertung } from '../lib/zahl'
import Markdown from './Markdown'

// Eine Rechenaufgabe mit Zahleneingabe: prüft mit Toleranz, klappt danach
// den Lösungsweg auf. onErgebnis feuert nur bei der ersten echten Abgabe —
// leere/unlesbare Eingaben erzeugen nur einen Hinweis.
export default function RechnenAufgabe({
  aufgabe,
  onErgebnis,
  onWeiter,
  weiterText,
  quelleHinweis,
}: {
  aufgabe: { text: string; loesungswert: number; einheit: string; toleranz: number; loesungsweg: string }
  onErgebnis: (richtig: boolean) => void
  onWeiter: () => void
  weiterText: string
  quelleHinweis?: string
}) {
  const [eingabe, setEingabe] = useState('')
  const [wertung, setWertung] = useState<EingabeWertung | null>(null)
  const abgegeben = wertung === 'richtig' || wertung === 'knapp' || wertung === 'falsch'

  function pruefen() {
    if (abgegeben) return
    const w = bewerteEingabe(eingabe, aufgabe.loesungswert, aufgabe.toleranz)
    setWertung(w)
    if (w === 'richtig' || w === 'knapp' || w === 'falsch') onErgebnis(w === 'richtig')
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 sm:p-6">
      {quelleHinweis && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
          {quelleHinweis}
        </p>
      )}
      <Markdown text={aufgabe.text} />
      <div className="mt-3 flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && pruefen()}
          disabled={abgegeben}
          placeholder="Ergebnis"
          aria-label="Ergebnis"
          className="h-12 w-40 rounded-lg border-2 border-slate-300 bg-white px-3 text-right text-lg font-bold focus:border-sky-500 focus:outline-none disabled:opacity-70 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        />
        <span className="font-semibold text-slate-600 dark:text-slate-300">{aufgabe.einheit}</span>
        {!abgegeben && (
          <button
            type="button"
            onClick={pruefen}
            className="ml-2 rounded-lg bg-sky-600 px-4 py-2.5 font-semibold text-white"
          >
            Prüfen
          </button>
        )}
      </div>
      {wertung === 'leer' && <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">Bitte eine Zahl eingeben.</p>}
      {wertung === 'ungueltig' && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
          Das ist keine lesbare Zahl — Format z. B. „1.234,56".
        </p>
      )}
      {abgegeben && (
        <div className="mt-3">
          <p className={`font-semibold ${wertung === 'richtig' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
            {wertung === 'richtig' && '✔ Richtig!'}
            {wertung === 'knapp' && '✘ Knapp daneben — prüfe deine Rundung.'}
            {wertung === 'falsch' && '✘ Leider falsch.'}
          </p>
          <div className="mt-2 rounded-lg bg-slate-50 p-3">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">Lösungsweg</p>
            <Markdown text={aufgabe.loesungsweg} />
          </div>
          <button
            type="button"
            onClick={onWeiter}
            className="mt-3 min-h-11 rounded-xl bg-slate-900 px-6 font-semibold text-white hover:bg-slate-800"
          >
            {weiterText} →
          </button>
        </div>
      )}
    </div>
  )
}
