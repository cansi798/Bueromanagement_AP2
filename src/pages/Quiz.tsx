import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import LernpaarKarte from '../components/LernpaarKarte'
import { ladeBereiche, ladeLernpaare, ladeThemen, useDaten } from '../lib/data'
import { farbe } from '../lib/farben'
import {
  faelligeLernpaare,
  ladeLernpaarStaende,
  merkeLernpaarAntwort,
  mischeOptionen,
  quizFortschritt,
  themenQuizStand,
} from '../lib/lernquiz'
import { heuteISO, merkeQuiz } from '../lib/progress'
import type { BereichId, Lernpaar } from '../types'

const SESSION_GROESSE = 20

// Themen-Quiz mit Leitner-System: ohne :themaId die Themenübersicht,
// mit :themaId (oder "alle") die eigentliche Frage-Session.
export default function Quiz() {
  const { bereichId, themaId } = useParams<{ bereichId: BereichId; themaId?: string }>()
  const { daten: bereiche } = useDaten(ladeBereiche)
  const { daten: themen } = useDaten(() => ladeThemen(bereichId!))
  const { daten: paare, fehler, laedt } = useDaten(() => ladeLernpaare(bereichId!))
  const bereich = bereiche?.find((b) => b.id === bereichId)

  if (laedt) return <Layout titel="Themen-Quiz"><p className="text-slate-500">Lade …</p></Layout>
  if (fehler || !paare)
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-red-50 p-4 text-red-700">
          {fehler ?? 'Für diesen Bereich gibt es noch kein Quiz.'}
        </p>
      </Layout>
    )

  if (!themaId) {
    return (
      <Uebersicht
        bereichId={bereichId!}
        farbName={bereich?.farbe ?? 'sky'}
        paare={paare}
        themenNamen={new Map((themen ?? []).map((t) => [t.id, t.name]))}
      />
    )
  }
  return <Session bereichId={bereichId!} themaId={themaId} paare={paare} />
}

function Uebersicht({
  bereichId,
  farbName,
  paare,
  themenNamen,
}: {
  bereichId: BereichId
  farbName: string
  paare: Lernpaar[]
  themenNamen: Map<string, string>
}) {
  const heute = heuteISO()
  const staende = ladeLernpaarStaende()
  const f = farbe(farbName)

  const proThema = useMemo(() => {
    const map = new Map<string, Lernpaar[]>()
    for (const p of paare) {
      if (!map.has(p.themaId)) map.set(p.themaId, [])
      map.get(p.themaId)!.push(p)
    }
    return [...map.entries()]
  }, [paare])

  const gesamtStand = themenQuizStand(paare, staende, heute)

  if (paare.length === 0) {
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
          Für diesen Bereich sind noch keine Quizfragen hinterlegt.
        </p>
      </Layout>
    )
  }

  return (
    <Layout titel="Themen-Quiz">
      <p className="-mt-2 mb-4 text-sm text-slate-600">
        Multiple-Choice nach Themen, gelernt im Leitner-System: Richtig beantwortete Fragen
        kommen in ein höheres Fach und tauchen seltener auf — falsche landen wieder in Fach 1.
      </p>

      {gesamtStand.faellig > 0 ? (
        <Link
          to={`/${bereichId}/quiz/alle`}
          className="mb-5 flex items-center gap-4 rounded-2xl border-2 border-slate-900 bg-slate-900 p-4 text-white shadow-sm transition hover:bg-slate-800"
        >
          <span className="text-3xl">🚀</span>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold">Heute fällig: {gesamtStand.faellig} Fragen</h2>
            <p className="text-sm text-slate-300">Alle Themen gemischt üben.</p>
          </div>
          <span className="text-slate-400">→</span>
        </Link>
      ) : (
        <div className="mb-5 rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          🎉 Alle Wiederholungen für heute erledigt! Du kannst jedes Thema trotzdem weiter üben.
        </div>
      )}

      <div className="space-y-3">
        {proThema.map(([tid, tp]) => {
          const stand = themenQuizStand(tp, staende, heute)
          const anteil = quizFortschritt(stand)
          return (
            <Link
              key={tid}
              to={`/${bereichId}/quiz/${tid}`}
              className={`block rounded-2xl border-2 p-4 shadow-sm transition ${f.kachel}`}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="min-w-0 font-bold text-slate-900">
                  {themenNamen.get(tid) ?? tid}
                </h2>
                <span className="shrink-0 text-slate-400">→</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className={`h-full rounded-full ${f.balken}`}
                  style={{ width: `${Math.round(anteil * 100)}%` }}
                />
              </div>
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
                <span>{stand.gesamt} Fragen</span>
                {stand.faellig > 0 && (
                  <span className="font-semibold text-amber-700">{stand.faellig} fällig</span>
                )}
                {stand.neu > 0 && <span>✨ {stand.neu} neu</span>}
                {stand.gemeistert > 0 && <span>🏆 {stand.gemeistert} gemeistert</span>}
              </p>
            </Link>
          )
        })}
      </div>
    </Layout>
  )
}

function Session({
  bereichId,
  themaId,
  paare,
}: {
  bereichId: BereichId
  themaId: string
  paare: Lernpaar[]
}) {
  const heute = heuteISO()
  const themenPaare = useMemo(
    () => (themaId === 'alle' ? paare : paare.filter((p) => p.themaId === themaId)),
    [paare, themaId],
  )

  // Die Session wird beim Start eingefroren: erst fällige, sonst Extra-Runde.
  const [runde, setRunde] = useState(() => baueRunde(themenPaare, heute))
  const [index, setIndex] = useState(0)
  const [richtige, setRichtige] = useState(0)

  const aktuell = runde[index]
  // Optionen-Mischung und Fach werden je Frage einmal eingefroren — das Fach
  // vor der Antwort, damit die Karte den Fach-Wechsel korrekt erzählen kann.
  const eingefroren = useMemo(() => {
    if (!aktuell) return null
    const staende = ladeLernpaarStaende()
    return {
      gemischt: mischeOptionen(aktuell),
      fach: staende[aktuell.id]?.fach ?? null,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktuell?.id])

  function ergebnis(richtig: boolean) {
    if (!aktuell) return
    merkeLernpaarAntwort(aktuell.id, richtig, heute)
    merkeQuiz(aktuell.themaId, richtig ? 1 : 0, 1, heute)
    if (richtig) setRichtige((n) => n + 1)
  }

  function weiter() {
    setIndex((i) => i + 1)
  }

  function nochEineRunde() {
    setRunde(baueRunde(themenPaare, heute))
    setIndex(0)
    setRichtige(0)
  }

  if (themenPaare.length === 0) {
    return (
      <Layout titel="Themen-Quiz">
        <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
          Für dieses Thema sind noch keine Quizfragen hinterlegt.
        </p>
      </Layout>
    )
  }

  // Session fertig → Zusammenfassung
  if (index >= runde.length) {
    const quote = runde.length > 0 ? Math.round((richtige / runde.length) * 100) : 0
    return (
      <Layout titel="Themen-Quiz">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-4xl">{quote >= 80 ? '🏆' : quote >= 50 ? '💪' : '📚'}</p>
          <h2 className="mt-2 text-xl font-bold text-slate-900">Runde geschafft!</h2>
          <p className="mt-1 text-slate-600">
            {richtige} von {runde.length} richtig ({quote} %).
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={nochEineRunde}
              className="min-h-12 rounded-xl bg-sky-600 px-6 font-semibold text-white hover:bg-sky-700"
            >
              Noch eine Runde
            </button>
            <Link
              to={`/${bereichId}/quiz`}
              className="flex min-h-12 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-6 font-semibold text-slate-700 hover:border-slate-400"
            >
              Zur Themenübersicht
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout titel="Themen-Quiz">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center justify-between text-sm text-slate-600">
          <span>
            Frage <strong>{index + 1}</strong> / {runde.length}
          </span>
          <span>✔ {richtige} richtig</span>
        </div>
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-sky-500 transition-all"
            style={{ width: `${Math.round((index / runde.length) * 100)}%` }}
          />
        </div>
        {aktuell && eingefroren && (
          <LernpaarKarte
            key={aktuell.id}
            paar={aktuell}
            optionen={eingefroren.gemischt.optionen}
            korrekt={eingefroren.gemischt.korrekt}
            fach={eingefroren.fach}
            onErgebnis={ergebnis}
            onWeiter={weiter}
          />
        )}
      </div>
    </Layout>
  )
}

// Fällige Fragen zuerst; ist nichts fällig, gibt es eine gemischte Extra-Runde.
function baueRunde(themenPaare: Lernpaar[], heute: string): Lernpaar[] {
  const staende = ladeLernpaarStaende()
  const faellig = faelligeLernpaare(themenPaare, staende, heute)
  if (faellig.length > 0) return faellig.slice(0, SESSION_GROESSE)
  const alle = [...themenPaare]
  for (let i = alle.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[alle[i], alle[j]] = [alle[j], alle[i]]
  }
  return alle.slice(0, SESSION_GROESSE)
}
