import { useNavigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import { ladeBereiche, ladeThemen, useDaten } from '../lib/data'
import type { BereichId } from '../types'

// Druckbares Lernskript: Deckblatt → Inhaltsverzeichnis → ein Kapitel pro Thema.
// „Als PDF speichern" läuft über den Druckdialog des Browsers (print-CSS).
export default function Skript() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const navigate = useNavigate()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)

  if (laedt || !bereich)
    return <p className="p-6 text-slate-500">{fehler ?? 'Lade Skript …'}</p>

  return (
    <div className="min-h-dvh bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm } }`}</style>
      {/* Werkzeugleiste — erscheint nicht im Druck */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            ← Zurück
          </button>
          <p className="hidden text-sm font-semibold text-slate-700 sm:block">
            Lernskript · {bereich.name}
          </p>
          <div className="flex gap-2">
            <a
              href={`./downloads/skript-${bereich.id}.pdf`}
              download
              className="rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
            >
              ⬇️ PDF
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              🖨️ Drucken
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8 print:max-w-none print:px-0">
        {/* Deckblatt */}
        <section className="flex min-h-[70vh] flex-col items-center justify-center rounded-3xl border-4 border-slate-900 p-10 text-center break-after-page print:min-h-[90vh] print:rounded-none print:border-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
            KBM Prüfungscoach
          </p>
          <h1 className="mt-6 text-4xl font-black text-slate-900">Lernskript</h1>
          <h2 className="mt-3 text-2xl font-bold text-sky-700">{bereich.name}</h2>
          <p className="mt-6 max-w-md text-slate-600">{bereich.beschreibung}</p>
          <p className="mt-10 text-sm text-slate-400">
            Zusammenfassung · Eselsbrücken · Selbstchecks — für Unterricht und Selbstlernen
          </p>
        </section>

        {/* Inhaltsverzeichnis */}
        <section className="break-after-page pt-8">
          <h2 className="text-2xl font-bold text-slate-900">Inhaltsverzeichnis</h2>
          <ol className="mt-5 space-y-2">
            {themen!.map((t, i) => (
              <li key={t.id} className="flex items-baseline gap-3 border-b border-dotted border-slate-300 pb-2">
                <span className="text-lg font-bold text-sky-700">{i + 1}.</span>
                <a href={`#kapitel-${t.id}`} className="font-medium text-slate-800">
                  {t.name}
                </a>
              </li>
            ))}
          </ol>
        </section>

        {/* Kapitel */}
        {themen!.map((t, i) => (
          <section key={t.id} id={`kapitel-${t.id}`} className="break-after-page pt-8">
            <div className="border-b-4 border-slate-900 pb-3">
              <p className="text-sm font-semibold text-sky-700">Kapitel {i + 1}</p>
              <h2 className="text-2xl font-black text-slate-900">{t.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.beschreibung}</p>
            </div>

            <div className="mt-5">
              <Markdown text={t.lernzettel} />
            </div>

            {t.eselsbruecken.length > 0 && (
              <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 print:break-inside-avoid">
                <p className="mb-2 font-bold text-amber-900">💡 Eselsbrücken</p>
                <ul className="space-y-1.5">
                  {t.eselsbruecken.map((e, j) => (
                    <li key={j} className="text-amber-900">• {e}</li>
                  ))}
                </ul>
              </div>
            )}

            {t.selbstcheck.length > 0 && (
              <div className="mt-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 print:break-inside-avoid">
                <p className="mb-2 font-bold text-slate-800">✅ Selbstcheck — kannst du das erklären?</p>
                <ul className="space-y-1.5">
                  {t.selbstcheck.map((f, j) => (
                    <li key={j} className="text-slate-700">☐ {f}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
