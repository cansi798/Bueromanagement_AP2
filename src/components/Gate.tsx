import { useState, type FormEvent, type ReactNode } from 'react'
import { istFreigeschaltet, pruefeCode, schalteFrei } from '../lib/gate'

export default function Gate({ children }: { children: ReactNode }) {
  const [offen, setOffen] = useState(istFreigeschaltet)
  const [eingabe, setEingabe] = useState('')
  const [fehler, setFehler] = useState(false)

  if (offen) return <>{children}</>

  async function absenden(e: FormEvent) {
    e.preventDefault()
    if (await pruefeCode(eingabe.trim())) {
      schalteFrei()
      setOffen(true)
    } else {
      setFehler(true)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-900 px-4">
      <form onSubmit={absenden} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h1 className="text-xl font-bold text-slate-900">KBM Prüfungscoach</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bitte gib den Zugangscode aus dem Unterricht ein.
        </p>
        <input
          type="password"
          value={eingabe}
          onChange={(e) => {
            setEingabe(e.target.value)
            setFehler(false)
          }}
          placeholder="Zugangscode"
          autoFocus
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-3 text-base focus:border-sky-500 focus:outline-none"
        />
        {fehler && <p className="mt-2 text-sm text-red-600">Falscher Code – bitte erneut versuchen.</p>}
        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 active:bg-sky-800"
        >
          Loslegen
        </button>
      </form>
    </div>
  )
}
