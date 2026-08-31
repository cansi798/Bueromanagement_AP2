import { useEffect, useState } from 'react'

export default function Timer({
  minuten,
  onAbgelaufen,
}: {
  minuten: number
  onAbgelaufen: () => void
}) {
  const [restSekunden, setRestSekunden] = useState(minuten * 60)

  useEffect(() => {
    const id = setInterval(() => {
      setRestSekunden((s) => {
        if (s <= 1) {
          clearInterval(id)
          onAbgelaufen()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mm = Math.floor(restSekunden / 60)
  const ss = restSekunden % 60
  const kritisch = restSekunden <= 5 * 60

  return (
    <div
      className={`rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums ${
        kritisch ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-800'
      }`}
    >
      ⏱ {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
    </div>
  )
}
