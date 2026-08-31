import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { istFreigeschaltet, pruefeCode, schalteFrei } from '../lib/gate'
import { backendNutzer, merkeNutzer } from '../lib/api'
import { syncStart } from '../lib/sync'
import KontoLoginForm from './KontoLoginForm'

type Modus = 'code' | 'konto'

export default function Gate({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(istFreigeschaltet)
  const [modus, setModus] = useState<Modus>('code')
  const [eingabe, setEingabe] = useState('')
  const [fehler, setFehler] = useState('')

  useEffect(() => {
    // PDF-Generierung: ?code=<Zugangscode> in der URL schaltet die Sitzung frei.
    const param = new URLSearchParams(window.location.search).get('code')
    if (param && !offen) {
      pruefeCode(param).then((ok) => ok && setOffen(true))
    }
    // Server-Session IMMER abgleichen (auch wenn schon offen): hält den
    // Konto-Status aktuell und reaktiviert den Sync nach jedem Neuladen.
    backendNutzer().then((n) => {
      merkeNutzer(n)
      if (n) {
        schalteFrei()
        syncStart()
        setOffen(true)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (offen) return <>{children}</>

  async function codeAbsenden(e: FormEvent) {
    e.preventDefault()
    if (await pruefeCode(eingabe.trim())) {
      schalteFrei()
      setOffen(true)
    } else {
      setFehler('Falscher Code – bitte erneut versuchen.')
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">KBM Prüfungscoach</h1>

        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          {(
            [
              ['code', '🔑 Zugangscode'],
              ['konto', '👤 Mein Konto'],
            ] as [Modus, string][]
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModus(m)
                setFehler('')
              }}
              className={`min-h-10 flex-1 rounded-lg transition ${
                modus === m ? 'bg-white text-slate-900 shadow' : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {modus === 'code' ? (
          <form onSubmit={codeAbsenden}>
            <p className="mt-3 text-sm text-slate-600">
              Gast-Modus: Fortschritt wird nur auf diesem Gerät gespeichert.
            </p>
            <input
              type="password"
              value={eingabe}
              onChange={(e) => {
                setEingabe(e.target.value)
                setFehler('')
              }}
              placeholder="Zugangscode aus dem Unterricht"
              autoFocus
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
            />
            {fehler && <p className="mt-2 text-sm text-red-600">{fehler}</p>}
            <button
              type="submit"
              className="mt-4 min-h-12 w-full rounded-lg bg-sky-600 px-4 font-semibold text-white hover:bg-sky-700 active:bg-sky-800"
            >
              Loslegen
            </button>
          </form>
        ) : (
          <div>
            <p className="mt-3 text-sm text-slate-600">
              Mit Schul-Konto: Dein Fortschritt wird auf jedem Gerät synchronisiert.
            </p>
            <KontoLoginForm onErfolg={() => setOffen(true)} />
          </div>
        )}
      </div>
    </div>
  )
}
