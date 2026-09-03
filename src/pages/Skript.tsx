import { useNavigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import ThemaDiagramm, { FolienDiagramm } from '../components/diagramme'
import { ladeBereiche, ladeThemen, useDaten } from '../lib/data'
import type { BereichId } from '../types'

// Quellen bewusst ohne konkrete Prüfungstermine (Anonymisierung, lib/termine.ts).
const QUELLEN: Record<BereichId, string[]> = {
  wiso: [
    'Bürgerliches Gesetzbuch (BGB) und Handelsgesetzbuch (HGB)',
    'Berufsbildungsgesetz (BBiG), Jugendarbeitsschutzgesetz (JArbSchG)',
    'Arbeitszeitgesetz (ArbZG), Kündigungsschutzgesetz (KSchG), Betriebsverfassungsgesetz (BetrVG)',
    'Sozialgesetzbücher (SGB) zur Sozialversicherung',
  ],
  kbz: [
    'Bürgerliches Gesetzbuch (BGB), insb. Kaufrecht §§ 433 ff.',
    'Handelsgesetzbuch (HGB), insb. § 377 (Untersuchungs- und Rügepflicht)',
    'Umsatzsteuergesetz (UStG), insb. § 14 (Pflichtangaben der Rechnung)',
    'Arbeitszeitgesetz (ArbZG)',
  ],
  buchfuehrung: [
    'Handelsgesetzbuch (HGB), Grundsätze ordnungsmäßiger Buchführung',
    'Umsatzsteuergesetz (UStG)',
    'Einkommensteuergesetz (EStG), insb. § 7 (Abschreibung)',
    'Betrieblicher Kontenrahmen (Schulkontenrahmen)',
  ],
  muendlich: [
    'Verordnung über die Berufsausbildung zum Kaufmann/zur Kauffrau für Büromanagement (BüroMKfAusbV)',
    'Prüfungshinweise der Industrie- und Handelskammer (IHK)',
  ],
}

const GEMEINSAME_QUELLEN = [
  'Aufgabensammlungen 1–2 (internes Prüfungsübungsmaterial, anonymisiert)',
  'Eigene Zusammenfassungen, Übungsaufgaben und Diagramme des KBM Prüfungscoachs',
  'Für den Unterrichtsgebrauch erstellt – ohne Gewähr; maßgeblich sind die aktuellen Gesetzestexte',
]

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
function standHeute(): string {
  const d = new Date()
  return `${MONATE[d.getMonth()]} ${d.getFullYear()}`
}

// Druckbares Lernskript: Deckblatt → Inhaltsverzeichnis → ein Kapitel pro Thema.
// „Als PDF speichern" läuft über den Druckdialog des Browsers (print-CSS).
export default function Skript() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId?: string }>()
  const navigate = useNavigate()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: alleThemen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)
  // Optional auf ein Thema eingegrenzt (z. B. für Podcast-/Video-Quell-PDFs).
  const themen = themaId ? alleThemen?.filter((t) => t.id === themaId) : alleThemen

  if (laedt || !bereich)
    return <p className="p-6 text-slate-500">{fehler ?? 'Lade Skript …'}</p>

  return (
    <div className="min-h-dvh bg-white">
      <style>{`@media print { @page { size: A4 portrait; margin: 14mm 14mm 18mm 14mm;
        @bottom-right { content: "Seite " counter(page) " von " counter(pages); font-size: 9px; color: #94a3b8; }
        @bottom-left { content: "KBM Prüfungscoach · Lernskript"; font-size: 9px; color: #94a3b8; } } }`}</style>
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
          <h2 className="mt-3 text-2xl font-bold text-sky-700">
            {themaId && themen!.length === 1 ? themen![0].name : bereich.name}
          </h2>
          {themaId && themen!.length === 1 && (
            <p className="mt-2 text-sm font-semibold text-slate-500">{bereich.name}</p>
          )}
          <p className="mt-6 max-w-md text-slate-600">{bereich.beschreibung}</p>
          <p className="mt-10 text-sm text-slate-400">
            Zusammenfassung · Diagramme · Eselsbrücken · Selbstchecks — für Unterricht und
            Selbstlernen
          </p>
          <p className="mt-8 text-sm font-medium text-slate-500">
            {themen!.length} Kapitel · Stand: {standHeute()}
          </p>
        </section>

        {/* Inhaltsverzeichnis */}
        <section className="break-after-page pt-8">
          <h2 className="text-2xl font-bold text-slate-900">Inhaltsverzeichnis</h2>
          <ol className="mt-5 space-y-3">
            {themen!.map((t, i) => (
              <li key={t.id} className="border-b border-dotted border-slate-300 pb-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-lg font-bold text-sky-700">{i + 1}.</span>
                  <a href={`#kapitel-${t.id}`} className="font-medium text-slate-800">
                    {t.name}
                  </a>
                </div>
                <p className="ml-8 text-sm text-slate-500">{t.beschreibung}</p>
              </li>
            ))}
            <li className="border-b border-dotted border-slate-300 pb-2">
              <div className="flex items-baseline gap-3">
                <span className="text-lg font-bold text-sky-700">{themen!.length + 1}.</span>
                <a href="#quellen" className="font-medium text-slate-800">
                  Quellenverzeichnis
                </a>
              </div>
            </li>
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
              <ThemaDiagramm themaId={t.id} />
              {/* Abschnittsweise rendern, damit Abschnitts-Diagramme (Rough.js)
                  direkt unter ihrem ##-Abschnitt erscheinen. */}
              {t.lernzettel.split(/\n(?=##\s)/).map((teil, j) => (
                <div key={j}>
                  <Markdown text={teil} />
                  <FolienDiagramm
                    themaId={t.id}
                    titel={(teil.match(/^##\s+(.+)/)?.[1] ?? '').trim()}
                  />
                </div>
              ))}
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

        {/* Quellenverzeichnis */}
        <section id="quellen" className="pt-8">
          <div className="border-b-4 border-slate-900 pb-3">
            <p className="text-sm font-semibold text-sky-700">Kapitel {themen!.length + 1}</p>
            <h2 className="text-2xl font-black text-slate-900">Quellenverzeichnis</h2>
          </div>
          <div className="mt-5 space-y-5">
            <div>
              <p className="mb-2 font-bold text-slate-800">Rechtsgrundlagen</p>
              <ul className="space-y-1.5">
                {(QUELLEN[bereich.id] ?? []).map((q, i) => (
                  <li key={i} className="text-slate-700">• {q}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 font-bold text-slate-800">Übungsmaterial & Hinweise</p>
              <ul className="space-y-1.5">
                {GEMEINSAME_QUELLEN.map((q, i) => (
                  <li key={i} className="text-slate-700">• {q}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
