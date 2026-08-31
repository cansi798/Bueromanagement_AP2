import { HashRouter, Route, Routes } from 'react-router-dom'
import Gate from './components/Gate'
import Layout from './components/Layout'
import Home from './pages/Home'

// Übergangs-Platzhalter: wird Task für Task durch echte Seiten ersetzt.
function Folgt({ was }: { was: string }) {
  return (
    <Layout titel={was}>
      <p className="text-slate-500">Dieser Bereich folgt in Kürze.</p>
    </Layout>
  )
}

export default function App() {
  return (
    <Gate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/glossar" element={<Folgt was="Glossar" />} />
          <Route path="/suche" element={<Folgt was="Suche" />} />
          <Route path="/landkarte/:bereichId" element={<Folgt was="Themen-Landkarte" />} />
          <Route path="/:bereichId" element={<Folgt was="Lernbereich" />} />
          <Route path="/:bereichId/stufe1" element={<Folgt was="Stufe 1 – Auffrischung" />} />
          <Route path="/:bereichId/stufe2" element={<Folgt was="Stufe 2 – Themen-Training" />} />
          <Route path="/:bereichId/stufe3" element={<Folgt was="Stufe 3 – Prüfungsjahre" />} />
          <Route path="/:bereichId/simulation/:termin" element={<Folgt was="Simulation" />} />
          <Route path="/:bereichId/karten" element={<Folgt was="Karteikarten" />} />
        </Routes>
      </HashRouter>
    </Gate>
  )
}
