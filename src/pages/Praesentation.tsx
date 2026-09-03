import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Markdown from '../components/Markdown'
import QuizMC from '../components/QuizMC'
import ThemaDiagramm, { FolienDiagramm, hatDiagramm } from '../components/diagramme'
import { ladeAufgaben, ladeBereiche, ladeLernpaare, ladeThemen, useDaten } from '../lib/data'
import { folienAusThema, type Folie } from '../lib/folien'
import type { Aufgabe, BereichId, Lernpaar } from '../types'

// Lernpaare als Quizfolien-Ersatz, wenn ein Thema kaum Original-MC hat.
function alsAufgabe(p: Lernpaar): Aufgabe {
  return {
    id: p.id,
    themaId: p.themaId,
    bereich: p.bereich,
    quelle: 'generiert',
    typ: 'mc',
    text: p.frage,
    optionen: p.optionen,
    korrekt: p.korrekt,
    loesung: p.erklaerung,
    erklaerung: p.erklaerung,
  }
}

// Vollbild-Präsentation für den Unterricht. Steuerung: Pfeiltasten, Leertaste,
// Klick/Touch auf ‹ › sowie horizontales Wischen auf Touchgeräten.
// Drucken gibt eine Folie pro Seite aus (→ PDF).
// Pro Thema: Titel → Diagramm → Inhalt → Eselsbrücken → Selbstcheck → Quizfragen.
export default function Praesentation() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId?: string }>()
  const navigate = useNavigate()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const { daten: aufgaben } = useDaten(() => ladeAufgaben(bereichId!))
  const { daten: lernpaare } = useDaten(() =>
    ladeLernpaare(bereichId!).catch(() => [] as Lernpaar[]),
  )
  const [aktiv, setAktiv] = useState(0)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const bereich = bereiche?.find((b) => b.id === bereichId)
  const folien: Folie[] = useMemo(() => {
    if (!themen) return []
    const auswahl = themaId ? themen.filter((t) => t.id === themaId) : themen
    return auswahl.flatMap((t) => {
      const basis = folienAusThema(t)
      // Diagramm-Folie direkt nach der Titelfolie einschieben.
      if (hatDiagramm(t.id)) {
        basis.splice(1, 0, { art: 'diagramm', titel: t.name, themaId: t.id })
      }
      // Bis zu 3 anklickbare MC-Quizfragen ans Themenende hängen; hat das
      // Thema zu wenige MC-Aufgaben, füllen Lernpaare aus dem Themen-Quiz auf.
      const mc: Aufgabe[] = (aufgaben ?? [])
        .filter((a) => a.themaId === t.id && a.typ === 'mc')
        .sort((a, b) => (a.quelle === 'generiert' ? -1 : 0) - (b.quelle === 'generiert' ? -1 : 0))
        .slice(0, 3)
      if (mc.length < 3) {
        mc.push(
          ...(lernpaare ?? [])
            .filter((p) => p.themaId === t.id)
            .slice(0, 3 - mc.length)
            .map(alsAufgabe),
        )
      }
      mc.forEach((a, i) =>
        basis.push({
          art: 'quiz',
          titel: `Quizfrage ${i + 1} von ${mc.length}`,
          themaId: t.id,
          aufgabeId: a.id,
        }),
      )
      return basis
    })
  }, [themen, themaId, aufgaben, lernpaare])

  const aufgabeZu = (id?: string): Aufgabe | undefined => {
    const a = aufgaben?.find((x) => x.id === id)
    if (a) return a
    const p = lernpaare?.find((x) => x.id === id)
    return p ? alsAufgabe(p) : undefined
  }

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
      <style>{`@media print { @page { size: A4 landscape; margin: 0 0 8mm 0;
        @bottom-right { content: "Folie " counter(page) " / " counter(pages); font-size: 9px; color: #94a3b8; } } }`}</style>
      {/* Folien: am Bildschirm nur die aktive, im Druck alle */}
      <div
        className="flex flex-1 items-center justify-center overflow-hidden p-4 sm:p-8 print:block print:overflow-visible print:p-0"
        onTouchStart={(e) => {
          touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current
          touchStart.current = null
          if (!start) return
          const dx = e.changedTouches[0].clientX - start.x
          const dy = e.changedTouches[0].clientY - start.y
          // Nur klar horizontale Wischer zählen, damit Scrollen auf Folien geht.
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return
          if (dx < 0) setAktiv((a) => Math.min(a + 1, folien.length - 1))
          else setAktiv((a) => Math.max(a - 1, 0))
        }}
      >
        {folien.map((f, i) => (
          <div
            key={`${f.themaId}-${i}`}
            className={`${i === aktiv ? 'flex' : 'hidden'} h-full w-full max-w-4xl flex-col justify-center ${
              f.art === 'quiz' ? 'print:hidden' : 'print:flex'
            } print:h-[100vh] print:max-w-none print:break-after-page print:p-12`}
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
            ) : f.art === 'diagramm' ? (
              <div className="rounded-3xl bg-white p-4 shadow-2xl sm:p-6 print:rounded-none print:p-0 print:shadow-none">
                <h2 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">
                  {f.titel} — auf einen Blick
                </h2>
                <div className="max-h-[68vh] overflow-y-auto print:max-h-none print:overflow-visible">
                  <ThemaDiagramm themaId={f.themaId} />
                </div>
              </div>
            ) : f.art === 'quiz' ? (
              <div className="rounded-3xl bg-white p-5 shadow-2xl sm:p-8">
                <h2 className="mb-1 text-xl font-bold text-violet-700 sm:text-2xl">🎯 {f.titel}</h2>
                <p className="mb-4 text-sm text-slate-500">
                  Antippen, gemeinsam abstimmen — dann „Prüfen" für die Auflösung.
                </p>
                <div className="max-h-[62vh] overflow-y-auto print:max-h-none">
                  {aufgabeZu(f.aufgabeId) ? (
                    <QuizMC
                      key={`${f.aufgabeId}-${aktiv}`}
                      aufgabe={aufgabeZu(f.aufgabeId)!}
                      onErgebnis={() => {}}
                    />
                  ) : (
                    <p className="text-slate-500">Frage wird geladen …</p>
                  )}
                </div>
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
                  {f.art === 'inhalt' && <FolienDiagramm themaId={f.themaId} titel={f.titel} />}
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
