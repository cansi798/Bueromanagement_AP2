import { useState } from 'react'
import { getItem, setItem } from '../lib/storage'

// Persistentes Notizfeld: speichert automatisch im Browser (pro Schlüssel).
export default function NotizFeld({
  schluessel,
  platzhalter = '✍️ Deine Notizen zu diesem Thema — werden automatisch gespeichert …',
  zeilen = 4,
}: {
  schluessel: string // z. B. "kbz/kaufvertrag-stoerungen"
  platzhalter?: string
  zeilen?: number
}) {
  const key = `kbm.v1.notizen.${schluessel}`
  const [text, setText] = useState(() => getItem<string>(key) ?? '')
  const [gespeichert, setGespeichert] = useState(false)

  function aendern(neu: string) {
    setText(neu)
    setItem(key, neu)
    setGespeichert(true)
    window.setTimeout(() => setGespeichert(false), 1200)
  }

  return (
    <div className="print:hidden">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          ✍️ Meine Notizen
        </p>
        {gespeichert && <span className="text-xs text-green-600">✓ gespeichert</span>}
      </div>
      <textarea
        value={text}
        onChange={(e) => aendern(e.target.value)}
        placeholder={platzhalter}
        rows={zeilen}
        className="w-full rounded-lg border border-slate-300 bg-amber-50/40 p-3 text-[15px] focus:border-sky-500 focus:outline-none"
      />
    </div>
  )
}
