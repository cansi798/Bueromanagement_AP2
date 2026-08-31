import { HashRouter, Route, Routes } from 'react-router-dom'
import Gate from './components/Gate'
import Layout from './components/Layout'
import Home from './pages/Home'
import Bereich from './pages/Bereich'
import Stufe1 from './pages/Stufe1'
import Stufe2 from './pages/Stufe2'
import Stufe3 from './pages/Stufe3'
import Simulation from './pages/Simulation'
import Karteikarten from './pages/Karteikarten'

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
          <Route path="/:bereichId" element={<Bereich />} />
          <Route path="/:bereichId/stufe1" element={<Stufe1 />} />
          <Route path="/:bereichId/stufe2" element={<Stufe2 />} />
          <Route path="/:bereichId/stufe3" element={<Stufe3 />} />
          <Route path="/:bereichId/simulation/:termin" element={<Simulation />} />
          <Route path="/:bereichId/karten" element={<Karteikarten />} />
        </Routes>
      </HashRouter>
    </Gate>
  )
}
