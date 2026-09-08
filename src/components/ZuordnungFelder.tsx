import type { Zuordnung } from '../types'
import { wertungZuordnung } from '../lib/zuordnung'
import Markdown from './Markdown'

// Ziffern-Zuordnung wie auf dem IHK-Antwortbogen: Legende oben, pro Teil-
// aufgabe ein Ziffernfeld. Zustand hält der Aufrufer (Quiz prüft sofort,
// die Simulation erst bei der Gesamtabgabe).
export default function ZuordnungFelder({
  zuordnung,
  antworten,
  onAntwort,
  abgegeben,
}: {
  zuordnung: Zuordnung
  antworten: Record<string, string>
  onAntwort: (label: string, wert: string) => void
  abgegeben: boolean
}) {
  const wertung = abgegeben ? wertungZuordnung(zuordnung, antworten) : null

  return (
    <div className="mt-3">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ziffern
        </p>
        <ul className="space-y-0.5 text-[15px] text-slate-800">
          {zuordnung.ziffern.map((z) => (
            <li key={z.nr}>
              <span className="font-semibold">{z.nr}</span> {z.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-2 space-y-2">
        {zuordnung.items.map((item) => {
          const zeileRichtig = wertung?.proItem[item.label]
          let rahmen = 'border-slate-300 bg-white'
          if (wertung) {
            rahmen = zeileRichtig ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
          }
          return (
            <div
              key={item.label}
              className={`flex items-center gap-3 rounded-lg border-2 px-3 py-2 ${rahmen}`}
            >
              <span className="shrink-0 font-bold text-slate-700">{item.label})</span>
              <div className="min-w-0 flex-1 text-[15px]">
                <Markdown text={item.text} />
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={antworten[item.label] ?? ''}
                onChange={(e) => onAntwort(item.label, e.target.value)}
                disabled={abgegeben}
                aria-label={`Ziffer für ${item.label})`}
                className="h-11 w-12 shrink-0 rounded-lg border-2 border-slate-300 bg-white text-center text-lg font-bold focus:border-sky-500 focus:outline-none disabled:opacity-70"
              />
              {wertung && !zeileRichtig && (
                <span className="shrink-0 text-sm font-semibold text-green-700">
                  richtig: {item.korrekt}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
