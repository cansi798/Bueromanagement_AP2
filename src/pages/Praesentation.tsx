import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import { ladeBereiche, ladeThemen, useDaten } from '../lib/data'
import { folienAusThema, type Folie } from '../lib/folien'
import type { BereichId } from '../types'

// Vollbild-Präsentation für den Unterricht. Steuerung: Pfeiltasten, Leertaste,
// Klick/Touch auf ‹ ›. Drucken gibt eine Folie pro Seite aus (→ PDF).
export default function Praesentation() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId?: string }>()
  const navigate = useNavigate()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const [aktiv, setAktiv] = useState(0)

  const bereich = bereiche?.find((b) => b.id === bereichId)
  const folien: Folie[] = useMemo(() => {
    if (!themen) return []
    const auswahl = themaId ? themen.filter((t) => t.id === themaId) : themen
    return auswahl.flatMap(folienAusThema)
  }, [themen, themaId])

  useEffect(() => {
    function taste(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        setAktiv((a) => Math.min(a + 1, folien.length - 1))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setAktiv((a) => Math.max(a - 1, 0))
      } else if (e.key === 'Escape') {
        navigate(-1)
      }
    }
    window.addEventListener('keydown', taste)
    return () => window.removeEventListener('keydown', taste)
  }, [folien.length, navigate])

  if (laedt) return <p className="p-6 text-slate-500">Lade Präsentation …</p>
  if (fehler || folien.length === 0)
    return <p className="p-6 text-red-600">{fehler ?? 'Keine Folien vorhanden.'}</p>

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-900 print:static print:block print:bg-white">
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } }`}</style>
      {/* Folien: am Bildschirm nur die aktive, im Druck alle */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8 print:block print:overflow-visible print:p-0">
        {folien.map((f, i) => (
          <div
            key={`${f.themaId}-${i}`}
            className={`${i === aktiv ? 'flex' : 'hidden'} h-full w-full max-w-4xl flex-col justify-center print:flex print:h-[100vh] print:max-w-none print:break-after-page print:p-12`}
          >
            {f.art === 'titel' ? (
              <div className="text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky-400 print:text-sky-700">
                  {bereich?.name}
                </p>
                <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl print:text-slate-900">
                  {f.titel}
                </h1>
                {f.markdown && (
                  <p className="mx-auto mt-6 max-w-xl text-lg text-slate-300 print:text-slate-600">
                    {f.markdown}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-6 shadow-2xl sm:p-10 print:rounded-none print:p-0 print:shadow-none">
                <h2
                  className={`text-2xl font-bold sm:text-3xl ${
                    f.art === 'esel' ? 'text-amber-700' : f.art === 'check' ? 'text-green-700' : 'text-slate-900'
                  }`}
                >
                  {f.titel}
                </h2>
                <div className="mt-5 max-h-[60vh] overflow-y-auto text-lg print:max-h-none print:overflow-visible">
                  {f.markdown && <Markdown text={f.markdown} />}
                  {f.punkte && (
                    <ul className="space-y-3">
                      {f.punkte.map((p, j) => (
                        <li
                          key={j}
                          className={`rounded-xl p-3 ${
                            f.art === 'esel'
                              ? 'border border-amber-200 bg-amber-50 text-amber-900'
                              : 'border border-slate-200 bg-slate-50 text-slate-800'
                          }`}
                        >
                          {f.art === 'esel' ? '💡 ' : '❓ '}
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Steuerleiste — nicht im Druck */}
      <div className="flex items-center justify-between gap-3 border-t border-slate-700 bg-slate-800 px-4 py-3 print:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
        >
          ✕ Beenden
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAktiv((a) => Math.max(a - 1, 0))}
            disabled={aktiv === 0}
            aria-label="Vorherige Folie"
            className="min-h-11 min-w-14 rounded-xl bg-slate-700 text-xl font-bold text-white disabled:opacity-30"
          >
            ‹
          </button>
          <span className="min-w-16 text-center font-mono text-sm text-slate-300">
            {aktiv + 1} / {folien.length}
          </span>
          <button
            type="button"
            onClick={() => setAktiv((a) => Math.min(a + 1, folien.length - 1))}
            disabled={aktiv === folien.length - 1}
            aria-label="Nächste Folie"
            className="min-h-11 min-w-14 rounded-xl bg-sky-600 text-xl font-bold text-white disabled:opacity-30"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 sm:block"
        >
          🖨️ PDF
        </button>
      </div>
    </div>
  )
}
