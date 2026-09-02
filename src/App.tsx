import { HashRouter, Route, Routes } from 'react-router-dom'
import Gate from './components/Gate'
import Home from './pages/Home'
import Bereich from './pages/Bereich'
import Stufe1 from './pages/Stufe1'
import Stufe2 from './pages/Stufe2'
import Stufe3 from './pages/Stufe3'
import Simulation from './pages/Simulation'
import Karteikarten from './pages/Karteikarten'
import Quiz from './pages/Quiz'
import Landkarte from './pages/Landkarte'
import Glossar from './pages/Glossar'
import Suche from './pages/Suche'
import Skript from './pages/Skript'
import Handout from './pages/Handout'
import Lernstand from './pages/Lernstand'
import Anmelden from './pages/Anmelden'
import Praesentation from './pages/Praesentation'
import Unterricht from './pages/Unterricht'
import UnterrichtSession from './pages/UnterrichtSession'

export default function App() {
  return (
    <Gate>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/glossar" element={<Glossar />} />
          <Route path="/lernstand" element={<Lernstand />} />
          <Route path="/anmelden" element={<Anmelden />} />
          <Route path="/suche" element={<Suche />} />
          <Route path="/landkarte/:bereichId" element={<Landkarte />} />
          <Route path="/skript/:bereichId" element={<Skript />} />
          <Route path="/handout/:bereichId/:themaId" element={<Handout />} />
          <Route path="/praesentation/:bereichId" element={<Praesentation />} />
          <Route path="/praesentation/:bereichId/:themaId" element={<Praesentation />} />
          <Route path="/unterricht/:bereichId" element={<Unterricht />} />
          <Route path="/unterricht/:bereichId/:themaId" element={<UnterrichtSession />} />
          <Route path="/:bereichId" element={<Bereich />} />
          <Route path="/:bereichId/stufe1" element={<Stufe1 />} />
          <Route path="/:bereichId/stufe2" element={<Stufe2 />} />
          <Route path="/:bereichId/stufe3" element={<Stufe3 />} />
          <Route path="/:bereichId/simulation/:nr" element={<Simulation />} />
          <Route path="/:bereichId/karten" element={<Karteikarten />} />
          <Route path="/:bereichId/quiz" element={<Quiz />} />
          <Route path="/:bereichId/quiz/:themaId" element={<Quiz />} />
        </Routes>
      </HashRouter>
    </Gate>
  )
}
