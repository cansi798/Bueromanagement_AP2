import Layout from '../components/Layout'
import BereichKachel from '../components/BereichKachel'
import { ladeBereiche, useDaten } from '../lib/data'

export default function Home() {
  const { daten: bereiche, fehler, laedt } = useDaten(ladeBereiche)

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Deine Prüfungsvorbereitung</h1>
        <p className="mt-1 text-slate-600">
          Wähle einen Lernbereich – jeder hat Auffrischung, Themen-Training und echte
          Prüfungsjahre.
        </p>
      </div>
      {laedt && <p className="text-slate-500">Lade Inhalte …</p>}
      {fehler && <p className="rounded-lg bg-red-50 p-4 text-red-700">{fehler}</p>}
      {bereiche && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bereiche.map((b) => (
            <BereichKachel key={b.id} bereich={b} />
          ))}
        </div>
      )}
    </Layout>
  )
}
