import { useNavigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import ThemaDiagramm from '../components/diagramme'
import { ladeBereiche, ladeThemen, useDaten } from '../lib/data'
import type { BereichId } from '../types'

// Einseitiges/kompaktes Themen-Handout für den Unterricht (Druck/PDF):
// Kopf → Diagramm → Zusammenfassung → Eselsbrücken → Selbstcheck → Notizen.
export default function Handout() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId: string }>()
  const navigate = useNavigate()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)
  const thema = themen?.find((t) => t.id === themaId)
  const sessionNr = themen ? themen.findIndex((t) => t.id === themaId) + 1 : 0

  if (laedt || !bereich) return <p className="p-6 text-slate-500">{fehler ?? 'Lade Handout …'}</p>
  if (!thema) return <p className="p-6 text-red-600">Thema nicht gefunden.</p>

  return (
    <div className="min-h-dvh bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm 12mm 16mm 12mm;
        @bottom-right { content: "Seite " counter(page) " von " counter(pages); font-size: 9px; color: #94a3b8; }
        @bottom-left { content: "KBM Prüfungscoach · Handout"; font-size: 9px; color: #94a3b8; } } }`}</style>

      {/* Werkzeugleiste — nicht im Druck */}
      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 print:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-h-11 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200"
          >
            ← Zurück
          </button>
          <p className="hidden text-sm font-semibold text-slate-700 sm:block">
            Handout · {thema.name}
          </p>
          <div className="flex gap-2">
            <a
              href={`./downloads/handouts/${thema.id}.pdf`}
              download
              className="min-h-11 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500"
            >
              ⬇️ PDF
            </a>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              🖨️ Drucken
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-6 print:max-w-none print:px-0">
        {/* Kopf */}
        <header className="border-b-4 border-slate-900 pb-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Handout · {bereich.name}
              {sessionNr > 0 && ` · Session ${sessionNr}`}
            </p>
            <p className="text-xs text-slate-400">KBM Prüfungscoach</p>
          </div>
          <h1 className="mt-1 text-3xl font-black text-slate-900">{thema.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{thema.beschreibung}</p>
          {thema.haeufigkeit.length > 0 && (
            <p className="mt-2 inline-block rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800 print:border print:border-sky-300">
              📌 In {thema.haeufigkeit.length} von 16 Aufgabensammlungen geprüft
            </p>
          )}
        </header>

        <div className="mt-4">
          <ThemaDiagramm themaId={thema.id} />
          <Markdown text={thema.lernzettel} />
        </div>

        {thema.eselsbruecken.length > 0 && (
          <div className="mt-5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 print:break-inside-avoid">
            <p className="mb-2 font-bold text-amber-900">💡 Eselsbrücken</p>
            <ul className="space-y-1.5">
              {thema.eselsbruecken.map((e, i) => (
                <li key={i} className="text-amber-900">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {thema.selbstcheck.length > 0 && (
          <div className="mt-4 rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 print:break-inside-avoid">
            <p className="mb-2 font-bold text-slate-800">✅ Selbstcheck — kannst du das erklären?</p>
            <ul className="space-y-1.5">
              {thema.selbstcheck.map((f, i) => (
                <li key={i} className="text-slate-700">☐ {f}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Notizen */}
        <div className="mt-4 rounded-2xl border-2 border-slate-200 p-4 print:break-inside-avoid">
          <p className="mb-3 font-bold text-slate-800">✍️ Meine Notizen</p>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="mb-6 border-b border-slate-300" />
          ))}
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          🎬 Video &amp; 🎧 Podcast zum Thema: siehe App — Bereich {bereich.name} → Unterricht
        </p>
      </div>
    </div>
  )
}
