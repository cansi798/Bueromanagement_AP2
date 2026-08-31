import { HashRouter, Route, Routes } from 'react-router-dom'
import Gate from './components/Gate'
import Home from './pages/Home'
import Bereich from './pages/Bereich'
import Stufe1 from './pages/Stufe1'
import Stufe2 from './pages/Stufe2'
import Stufe3 from './pages/Stufe3'
import Simulation from './pages/Simulation'
import Karteikarten from './pages/Karteikarten'
import Landkarte from './pages/Landkarte'
import Glossar from './pages/Glossar'
import Suche from './pages/Suche'

export default function App() {
  return (
    <Gate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/glossar" element={<Glossar />} />
          <Route path="/suche" element={<Suche />} />
          <Route path="/landkarte/:bereichId" element={<Landkarte />} />
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
