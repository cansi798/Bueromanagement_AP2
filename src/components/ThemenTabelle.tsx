import { useMemo, useState } from 'react'
import type { ThemaZeile } from '../lib/themenUebersicht'

type SortierNach = 'quote' | 'zuletzt' | 'bereich' | 'geuebt'

// Sortier- und filterbare Übersicht „Was habe ich wie gut geübt?" für den
// Lernstand. Sortier-/Filter-State lebt hier, die Daten kommen vom Aufrufer.
export default function ThemenTabelle({
  zeilen,
  bereichName,
}: {
  zeilen: ThemaZeile[]
  bereichName: (id: string) => string
}) {
  const [sortNach, setSortNach] = useState<SortierNach>('quote')
  const [richtung, setRichtung] = useState<1 | -1>(1)
  const [bereichFilter, setBereichFilter] = useState<string>('alle')
  const [ohneGekonnte, setOhneGekonnte] = useState(false)

  const bereiche = useMemo(() => [...new Set(zeilen.map((z) => z.bereich))], [zeilen])

  const sichtbar = useMemo(() => {
    let liste = zeilen
    if (bereichFilter !== 'alle') liste = liste.filter((z) => z.bereich === bereichFilter)
    if (ohneGekonnte) liste = liste.filter((z) => !z.gekonnt)

    return [...liste].sort((a, b) => {
      // Handle null-to-end invariant for quote and zuletzt, regardless of direction
      if (sortNach === 'quote') {
        const aNull = a.quote === null
        const bNull = b.quote === null
        if (aNull && !bNull) return 1 // null always to end
        if (!aNull && bNull) return -1 // null always to end
        if (aNull && bNull) return 0 // both null, keep order
        // Both have quotes, sort by value
        const cmp = (a.quote ?? 0) - (b.quote ?? 0)
        return cmp * richtung
      }

      if (sortNach === 'zuletzt') {
        const aNull = a.zuletzt === null
        const bNull = b.zuletzt === null
        if (aNull && !bNull) return 1 // null always to end
        if (!aNull && bNull) return -1 // null always to end
        if (aNull && bNull) return 0 // both null, keep order
        // Both have dates, sort by value
        const cmp = String(a.zuletzt).localeCompare(String(b.zuletzt), 'de')
        return cmp * richtung
      }

      // For geuebt and bereich, use standard comparison
      let wa: string | number
      let wb: string | number
      if (sortNach === 'geuebt') {
        wa = a.geuebt
        wb = b.geuebt
      } else {
        wa = a.bereich
        wb = b.bereich
      }

      const cmp = typeof wa === 'number' && typeof wb === 'number'
        ? wa - wb
        : String(wa).localeCompare(String(wb), 'de')
      return cmp * richtung
    })
  }, [zeilen, sortNach, richtung, bereichFilter, ohneGekonnte])

  function sortiere(nach: SortierNach) {
    if (nach === sortNach) setRichtung((r) => (r === 1 ? -1 : 1))
    else {
      setSortNach(nach)
      setRichtung(nach === 'zuletzt' || nach === 'geuebt' ? -1 : 1)
    }
  }

  const pfeil = (nach: SortierNach) =>
    sortNach === nach ? (richtung === 1 ? ' ↑' : ' ↓') : ''

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <select
          value={bereichFilter}
          onChange={(e) => setBereichFilter(e.target.value)}
          aria-label="Bereich filtern"
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5"
        >
          <option value="alle">Alle Bereiche</option>
          {bereiche.map((b) => (
            <option key={b} value={b}>{bereichName(b)}</option>
          ))}
        </select>
        <label className="flex items-center gap-1.5 text-slate-700">
          <input
            type="checkbox"
            checked={ohneGekonnte}
            onChange={(e) => setOhneGekonnte(e.target.checked)}
          />
          Gekonntes ausblenden
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2">
                <button type="button" onClick={() => sortiere('bereich')}>Bereich{pfeil('bereich')}</button>
              </th>
              <th className="py-2 pr-2">Thema</th>
              <th className="py-2 pr-2 text-right">
                <button type="button" onClick={() => sortiere('geuebt')}>Geübt{pfeil('geuebt')}</button>
              </th>
              <th className="py-2 pr-2 text-right">Richtig</th>
              <th className="py-2 pr-2 text-right">Falsch</th>
              <th className="py-2 pr-2 text-right">
                <button type="button" onClick={() => sortiere('quote')}>Quote{pfeil('quote')}</button>
              </th>
              <th className="py-2 text-right">
                <button type="button" onClick={() => sortiere('zuletzt')}>Zuletzt{pfeil('zuletzt')}</button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sichtbar.map((z) => (
              <tr key={z.themaId} className="border-b border-slate-100">
                <td className="py-2 pr-2 text-slate-500">{bereichName(z.bereich)}</td>
                <td className="py-2 pr-2 font-medium text-slate-800">
                  {z.name}
                  {z.gekonnt && ' 🏆'}
                </td>
                <td className="py-2 pr-2 text-right text-slate-700">{z.geuebt}</td>
                <td className="py-2 pr-2 text-right text-green-700">{Math.round(z.richtig * 10) / 10}</td>
                <td className="py-2 pr-2 text-right text-red-700">{Math.round(z.falsch * 10) / 10}</td>
                <td className="py-2 pr-2 text-right font-semibold text-slate-800">
                  {z.quote === null ? '—' : `${Math.round(z.quote * 100)} %`}
                </td>
                <td className="py-2 text-right text-xs text-slate-400">{z.zuletzt ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sichtbar.length === 0 && (
        <p className="py-4 text-center text-sm text-slate-500">Keine Themen im Filter.</p>
      )}
    </div>
  )
}
