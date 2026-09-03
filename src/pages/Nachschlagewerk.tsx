import { useNavigate } from 'react-router-dom'
import Markdown from '../components/Markdown'
import { ladeFormeln, ladeGlossar, useDaten } from '../lib/data'

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
function standHeute(): string {
  const d = new Date()
  return `${MONATE[d.getMonth()]} ${d.getFullYear()}`
}

// Druckbares Nachschlagewerk „Begriffe & Formeln": Deckblatt →
// Inhaltsverzeichnis → Formelsammlung (nach Kategorie) → Glossar A–Z.
// „Als PDF speichern" läuft über den Druckdialog (print-CSS, wie Skript).
export default function Nachschlagewerk() {
  const navigate = useNavigate()
  const { daten: glossar, fehler, laedt } = useDaten(ladeGlossar)
  const { daten: formeln } = useDaten(ladeFormeln)

  if (laedt || !glossar || !formeln)
    return <p className="p-6 text-slate-500">{fehler ?? 'Lade Nachschlagewerk …'}</p>

  const kategorien = [...new Map(formeln.map((f) => [f.kategorie, true])).keys()].map(
    (k) => [k, formeln.filter((f) => f.kategorie === k)] as const,
  )
  const begriffe = [...glossar].sort((a, b) => a.begriff.localeCompare(b.begriff, 'de'))
  const buchstaben = new Map<string, typeof begriffe>()
  for (const e of begriffe) {
    const b = e.begriff[0].toUpperCase()
    buchstaben.set(b, [...(buchstaben.get(b) ?? []), e])
  }

  return (
    <div className="min-h-dvh bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm 14mm 18mm 14mm;
        @bottom-right { content: "Seite " counter(page) " von " counter(pages); font-size: 9px; color: #94a3b8; }
        @bottom-left { content: "KBM Prüfungscoach · Begriffe & Formeln"; font-size: 9px; color: #94a3b8; } } }`}</style>
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
          <p className="hidden text-sm font-semibold text-slate-700 sm:block">Begriffe & Formeln</p>
          <div className="flex gap-2">
            <a
              href="./downloads/begriffe-formeln.pdf"
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
          <h1 className="mt-6 text-4xl font-black text-slate-900">Begriffe & Formeln</h1>
          <h2 className="mt-3 text-2xl font-bold text-sky-700">Das Nachschlagewerk zur Prüfung</h2>
          <p className="mt-6 max-w-md text-slate-600">
            Alle Prüfungsformeln nach Themengebiet und die wichtigsten Fachbegriffe von A bis Z —
            für alle vier Lernbereiche.
          </p>
          <p className="mt-8 text-sm font-medium text-slate-500">
            {formeln.length} Formeln · {glossar.length} Begriffe · Stand: {standHeute()}
          </p>
        </section>

        {/* Inhaltsverzeichnis */}
        <section className="break-after-page pt-8">
          <h2 className="text-2xl font-bold text-slate-900">Inhaltsverzeichnis</h2>
          <ol className="mt-5 space-y-3">
            <li className="border-b border-dotted border-slate-300 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold text-sky-700">1.</span>
                <a href="#formeln" className="font-medium text-slate-800">Formelsammlung</a>
              </div>
              <p className="ml-8 text-sm text-slate-500">
                {kategorien.map(([k]) => k).join(' · ')}
              </p>
            </li>
            <li className="border-b border-dotted border-slate-300 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold text-sky-700">2.</span>
                <a href="#begriffe" className="font-medium text-slate-800">Fachbegriffe A–Z</a>
              </div>
              <p className="ml-8 text-sm text-slate-500">{glossar.length} Begriffe, alphabetisch</p>
            </li>
          </ol>
        </section>

        {/* Formelsammlung */}
        <section id="formeln" className="break-after-page pt-8">
          <div className="border-b-4 border-slate-900 pb-3">
            <p className="text-sm font-semibold text-sky-700">Kapitel 1</p>
            <h2 className="text-3xl font-bold text-slate-900">Formelsammlung</h2>
          </div>
          {kategorien.map(([kategorie, liste]) => (
            <div key={kategorie} className="pt-6">
              <h3 className="mb-3 text-xl font-bold text-slate-800">{kategorie}</h3>
              <div className="space-y-3">
                {liste.map((f) => (
                  <div key={f.id} className="rounded-xl border border-slate-200 p-3 print:break-inside-avoid">
                    <p className="font-semibold text-slate-900">{f.titel}</p>
                    <Markdown text={f.formel} />
                    {f.erklaerung && <p className="mt-1 text-sm text-slate-600">{f.erklaerung}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* Glossar */}
        <section id="begriffe" className="pt-8">
          <div className="border-b-4 border-slate-900 pb-3">
            <p className="text-sm font-semibold text-sky-700">Kapitel 2</p>
            <h2 className="text-3xl font-bold text-slate-900">Fachbegriffe A–Z</h2>
          </div>
          {[...buchstaben.entries()].map(([buchstabe, liste]) => (
            <div key={buchstabe} className="pt-5 print:break-inside-avoid">
              <h3 className="mb-2 text-sm font-bold text-slate-400">{buchstabe}</h3>
              <div className="space-y-2">
                {liste.map((e) => (
                  <p key={e.begriff} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{e.begriff}: </span>
                    {e.definition}
                  </p>
                ))}
              </div>
            </div>
          ))}
          <p className="mt-10 border-t border-slate-200 pt-4 text-xs text-slate-400">
            KBM Prüfungscoach · Für den Unterrichtsgebrauch erstellt — ohne Gewähr; maßgeblich sind
            die aktuellen Gesetzestexte und IHK-Vorgaben.
          </p>
        </section>
      </div>
    </div>
  )
}
