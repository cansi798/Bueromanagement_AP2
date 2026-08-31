import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import MedienSlot from '../components/MedienSlot'
import AufgabenKarte from '../components/AufgabenKarte'
import ThemaDiagramm from '../components/diagramme'
import NotizFeld from '../components/NotizFeld'
import { ladeAufgaben, ladeThemen, useDaten } from '../lib/data'
import { ladeFortschritt } from '../lib/progress'
import type { BereichId } from '../types'

const SCHRITTE = ['Einstieg', 'Stoff', 'Selbstcheck', 'Üben'] as const

// Geführte Unterrichts-Session zu einem Thema in vier Schritten.
export default function UnterrichtSession() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId: string }>()
  const { daten: themen, fehler, laedt } = useDaten(() => ladeThemen(bereichId!))
  const { daten: aufgaben } = useDaten(() => ladeAufgaben(bereichId!))
  const [schritt, setSchritt] = useState(0)
  const [checkOffen, setCheckOffen] = useState<number | null>(null)
  const erledigte = useMemo(() => new Set(ladeFortschritt().erledigteAufgaben), [])

  const thema = themen?.find((t) => t.id === themaId)
  const sessionNr = themen ? themen.findIndex((t) => t.id === themaId) + 1 : 0
  const themaAufgaben = aufgaben?.filter((a) => a.themaId === themaId) ?? []

  if (laedt) return <Layout><p className="text-slate-500">Lade Session …</p></Layout>
  if (fehler || !thema)
    return (
      <Layout titel="Unterricht">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler ?? 'Session nicht gefunden.'}</p>
      </Layout>
    )

  return (
    <Layout titel={`Session ${sessionNr} · ${thema.name}`}>
      {/* Schritt-Navigation */}
      <div className="mb-6 flex gap-1 overflow-x-auto sm:gap-2">
        {SCHRITTE.map((s, i) => (
          <button
            key={s}
            type="button"
            onClick={() => setSchritt(i)}
            className={`flex-1 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
              i === schritt
                ? 'bg-slate-900 text-white'
                : i < schritt
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-slate-500'
            }`}
          >
            {i < schritt ? '✔ ' : `${i + 1}. `}
            {s}
          </button>
        ))}
      </div>

      {schritt === 0 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Worum geht es heute?</h2>
            <p className="mt-2 text-slate-700">{thema.beschreibung}</p>
            {thema.haeufigkeit.length > 0 && (
              <p className="mt-3 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-800">
                📌 Kam bisher in {thema.haeufigkeit.length} Aufgabensammlung
                {thema.haeufigkeit.length === 1 ? '' : 'en'} vor
              </p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <MedienSlot medien={thema.medien} bereichId={thema.bereich} themaId={thema.id} />
            <div className="mt-4">
              <NotizFeld schluessel={`${thema.bereich}/${thema.id}`} />
            </div>
            <Link
              to={`/praesentation/${bereichId}/${thema.id}`}
              className="mt-3 inline-block rounded-lg bg-slate-900 px-4 py-2.5 font-semibold text-white hover:bg-slate-700"
            >
              🖥️ Präsentation für den Beamer starten
            </Link>
          </div>
        </div>
      )}

      {schritt === 1 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid lg:grid-cols-[2fr_1fr] lg:gap-6">
          <div>
            <ThemaDiagramm themaId={thema.id} />
            <Markdown text={thema.lernzettel} />
            <div className="mt-5">
              <NotizFeld schluessel={`${thema.bereich}/${thema.id}`} />
            </div>
          </div>
          {thema.eselsbruecken.length > 0 && (
            <div className="mt-5 lg:mt-0">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Eselsbrücken
              </p>
              <div className="space-y-2">
                {thema.eselsbruecken.map((e, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                  >
                    💡 {e}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {schritt === 2 && (
        <div className="space-y-2">
          <p className="mb-3 text-slate-600">
            Kurz prüfen, ob alles sitzt — Frage antippen, erst selbst beantworten, dann besprechen.
          </p>
          {thema.selbstcheck.map((frage, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCheckOffen(checkOffen === i ? null : i)}
              className={`block w-full rounded-xl border-2 px-4 py-3 text-left font-medium transition ${
                checkOffen === i
                  ? 'border-sky-500 bg-sky-50 text-sky-900'
                  : 'border-slate-200 bg-white text-slate-800'
              }`}
            >
              {checkOffen === i ? '🗣️ ' : '❓ '}
              {frage}
            </button>
          ))}
          <div className="pt-3">
            <NotizFeld
              schluessel={`${thema.bereich}/${thema.id}/selbstcheck`}
              platzhalter="✍️ Schreibe deine Antworten auf, bevor ihr sie besprecht …"
            />
          </div>
        </div>
      )}

      {schritt === 3 && (
        <div className="space-y-4">
          {themaAufgaben.length > 0 ? (
            themaAufgaben.map((a) => (
              <AufgabenKarte key={a.id} aufgabe={a} erledigt={erledigte.has(a.id)} />
            ))
          ) : (
            <p className="rounded-lg bg-white p-6 text-center text-slate-500">
              Zu diesem Thema gibt es noch keine Übungsaufgaben.
            </p>
          )}
        </div>
      )}

      {/* Weiter/Zurück */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setSchritt((s) => Math.max(s - 1, 0))}
          disabled={schritt === 0}
          className="rounded-xl border-2 border-slate-300 bg-white px-5 py-2.5 font-semibold text-slate-700 disabled:opacity-40"
        >
          ← Zurück
        </button>
        {schritt < SCHRITTE.length - 1 ? (
          <button
            type="button"
            onClick={() => setSchritt((s) => s + 1)}
            className="rounded-xl bg-slate-900 px-5 py-2.5 font-semibold text-white hover:bg-slate-700"
          >
            Weiter →
          </button>
        ) : (
          <Link
            to={`/unterricht/${bereichId}`}
            className="rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-700"
          >
            Session abschließen ✔
          </Link>
        )}
      </div>
    </Layout>
  )
}
