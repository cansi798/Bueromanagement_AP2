import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import Timer from '../components/Timer'
import { ladeAufgaben, ladePruefungen, useDaten } from '../lib/data'
import { wertungMC } from '../lib/quiz'
import { heuteISO, merkeErledigt } from '../lib/progress'
import type { Aufgabe, BereichId } from '../types'

export default function Simulation() {
  const { bereichId, termin } = useParams<{ bereichId: BereichId; termin: string }>()
  const { daten: pruefungen } = useDaten(ladePruefungen)
  const { daten: aufgaben } = useDaten(() => ladeAufgaben(bereichId!))
  const [gestartet, setGestartet] = useState(false)
  const [abgegeben, setAbgegeben] = useState(false)
  const [mcAntworten, setMcAntworten] = useState<Record<string, number[]>>({})
  const [selbst, setSelbst] = useState<Record<string, boolean>>({})

  const pruefung = pruefungen?.find((p) => p.termin === termin && p.bereich === bereichId)
  const liste: Aufgabe[] = useMemo(() => {
    if (!pruefung || !aufgaben) return []
    return pruefung.aufgabenIds
      .map((id) => aufgaben.find((a) => a.id === id))
      .filter((a): a is Aufgabe => Boolean(a))
  }, [pruefung, aufgaben])

  if (!pruefung || !aufgaben) {
    return <Layout titel="Simulation"><p className="text-slate-500">Lade …</p></Layout>
  }

  function toggleMC(aufgabe: Aufgabe, i: number) {
    if (abgegeben) return
    const mehrfach = (aufgabe.korrekt ?? []).length > 1
    setMcAntworten((alt) => {
      const bisher = alt[aufgabe.id] ?? []
      const neu = mehrfach
        ? bisher.includes(i)
          ? bisher.filter((x) => x !== i)
          : [...bisher, i]
        : [i]
      return { ...alt, [aufgabe.id]: neu }
    })
  }

  function abgeben() {
    setAbgegeben(true)
    liste.forEach((a) => merkeErledigt(a.id, heuteISO()))
    window.scrollTo({ top: 0 })
  }

  // Auswertung
  const mcErgebnisse = liste
    .filter((a) => a.typ === 'mc')
    .map((a) => ({ a, richtig: wertungMC(a.korrekt ?? [], mcAntworten[a.id] ?? []) }))
  const mcPunkte = mcErgebnisse.filter((e) => e.richtig).reduce((s, e) => s + (e.a.punkte ?? 1), 0)
  const selbstPunkte = liste
    .filter((a) => a.typ !== 'mc' && selbst[a.id])
    .reduce((s, a) => s + (a.punkte ?? 1), 0)

  if (!gestartet) {
    return (
      <Layout titel={`Simulation · ${pruefung.name}`}>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-700">
            Du bearbeitest jetzt <strong>{liste.length} Aufgaben</strong> in{' '}
            <strong>{pruefung.zeitMinuten} Minuten</strong> – wie in der echten Prüfung. Lösungen
            siehst du erst nach der Abgabe.
          </p>
          <button
            type="button"
            onClick={() => setGestartet(true)}
            className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 sm:w-auto"
          >
            Simulation starten ⏱
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titel={abgegeben ? 'Auswertung' : `Simulation · ${pruefung.name}`}>
      {!abgegeben && (
        <div className="sticky top-14 z-10 -mx-4 mb-4 flex items-center justify-between bg-slate-100/95 px-4 py-2 backdrop-blur">
          <Timer minuten={pruefung.zeitMinuten} onAbgelaufen={abgeben} />
          <button
            type="button"
            onClick={abgeben}
            className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white"
          >
            Abgeben
          </button>
        </div>
      )}

      {abgegeben && (
        <div className="mb-5 rounded-2xl border-2 border-sky-200 bg-sky-50 p-4">
          <p className="font-bold text-slate-900">
            Ergebnis: {mcPunkte + selbstPunkte} von {pruefung.punkteGesamt} Punkten
          </p>
          <p className="text-sm text-slate-600">
            MC automatisch gewertet · offene Aufgaben nach deiner Selbsteinschätzung unten.
          </p>
          <Link to={`/${bereichId}/stufe3`} className="mt-2 inline-block text-sm font-medium text-sky-700">
            ← Zurück zu den Prüfungsjahren
          </Link>
        </div>
      )}

      <div className="space-y-5">
        {liste.map((a, idx) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold text-slate-500">
              Aufgabe {idx + 1}
              {a.punkte !== undefined && ` · ${a.punkte} Punkte`}
            </p>
            <div className={a.anlagenText ? 'lg:grid lg:grid-cols-2 lg:gap-5' : ''}>
              <div>
                <Markdown text={a.text} />
                {a.typ === 'mc' ? (
                  <div className="mt-3 space-y-2">
                    {(a.optionen ?? []).map((opt, i) => {
                      const gewaehlt = (mcAntworten[a.id] ?? []).includes(i)
                      let stil = gewaehlt
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-300 bg-white'
                      if (abgegeben) {
                        if ((a.korrekt ?? []).includes(i)) stil = 'border-green-500 bg-green-50'
                        else if (gewaehlt) stil = 'border-red-400 bg-red-50'
                      }
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => toggleMC(a, i)}
                          className={`block min-h-12 w-full rounded-lg border-2 px-3 py-2 text-left text-[15px] ${stil}`}
                        >
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                ) : abgegeben ? (
                  <div className="mt-3">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="mb-1 text-xs font-semibold uppercase text-green-700">
                        Musterlösung
                      </p>
                      <Markdown text={a.loesung} />
                    </div>
                    {selbst[a.id] === undefined ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelbst((s) => ({ ...s, [a.id]: true }))}
                          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Hatte ich richtig ✔
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelbst((s) => ({ ...s, [a.id]: false }))}
                          className="flex-1 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                        >
                          Hatte ich falsch ✘
                        </button>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-slate-500">
                        Bewertet: {selbst[a.id] ? 'richtig ✔' : 'falsch ✘'}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                    ✍️ Bearbeite die Aufgabe auf Papier oder im Kopf – die Musterlösung
                    erscheint nach der Abgabe.
                  </p>
                )}
              </div>
              {a.anlagenText && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 lg:mt-0">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Anlage
                  </p>
                  <Markdown text={a.anlagenText} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {!abgegeben && (
        <button
          type="button"
          onClick={abgeben}
          className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white"
        >
          Prüfung abgeben
        </button>
      )}
    </Layout>
  )
}
