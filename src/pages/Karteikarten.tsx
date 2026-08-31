import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Markdown from '../components/Markdown'
import { ladeKarteikarten, useDaten } from '../lib/data'
import { antworten, naechsteFaellige, type KartenStand } from '../lib/leitner'
import { getItem, setItem } from '../lib/storage'
import { heuteISO } from '../lib/progress'
import type { BereichId } from '../types'

const KEY = 'kbm.v1.karten'

type Staende = Record<string, KartenStand>

export default function Karteikarten() {
  const { bereichId } = useParams<{ bereichId: BereichId }>()
  const { daten: karten, fehler, laedt } = useDaten(() => ladeKarteikarten(bereichId!))
  const heute = heuteISO()
  const [staende, setStaende] = useState<Staende>(() => getItem<Staende>(KEY) ?? {})
  const [umgedreht, setUmgedreht] = useState(false)
  const [gelerntHeute, setGelerntHeute] = useState(0)

  const faellige = useMemo(() => {
    if (!karten) return []
    return naechsteFaellige(
      staende,
      karten.map((k) => k.id),
      heute,
    )
  }, [karten, staende, heute])

  const aktuelleKarte = karten?.find((k) => k.id === faellige[0])

  function bewerte(richtig: boolean) {
    if (!aktuelleKarte) return
    const neu: Staende = {
      ...staende,
      [aktuelleKarte.id]: antworten(staende[aktuelleKarte.id], richtig, heute),
    }
    setItem(KEY, neu)
    setStaende(neu)
    setUmgedreht(false)
    setGelerntHeute((n) => n + 1)
  }

  return (
    <Layout titel="Karteikarten">
      {laedt && <p className="text-slate-500">Lade …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}

      {karten && (
        <>
          <p className="-mt-2 mb-5 text-sm text-slate-600">
            Heute fällig: <strong>{faellige.length}</strong> · gelernt: {gelerntHeute} ·
            Leitner-System: richtig = längerer Abstand, falsch = zurück auf Anfang.
          </p>

          {aktuelleKarte ? (
            <div className="mx-auto max-w-xl">
              <button
                type="button"
                onClick={() => setUmgedreht(!umgedreht)}
                className="flex min-h-64 w-full items-center justify-center rounded-3xl border-2 border-slate-300 bg-white p-6 text-center shadow-md transition hover:border-sky-400"
              >
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {umgedreht ? 'Antwort' : 'Frage · tippen zum Umdrehen'}
                  </p>
                  <Markdown text={umgedreht ? aktuelleKarte.rueckseite : aktuelleKarte.vorderseite} />
                </div>
              </button>

              {umgedreht && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => bewerte(false)}
                    className="min-h-14 flex-1 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600"
                  >
                    Nicht gewusst ✘
                  </button>
                  <button
                    type="button"
                    onClick={() => bewerte(true)}
                    className="min-h-14 flex-1 rounded-xl bg-green-600 font-semibold text-white hover:bg-green-700"
                  >
                    Gewusst ✔
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-3xl">🎉</p>
              <p className="mt-2 font-semibold text-slate-900">Alles gelernt für heute!</p>
              <p className="text-sm text-slate-500">
                Komm morgen wieder – dann warten die nächsten Wiederholungen.
              </p>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
