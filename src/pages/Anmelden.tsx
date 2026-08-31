import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import KontoLoginForm from '../components/KontoLoginForm'

// Anmelde-Seite für Gäste, die bereits per Zugangscode in der App sind —
// erreichbar über den „Anmelden"-Knopf im Kopfbereich.
export default function Anmelden() {
  const navigate = useNavigate()

  return (
    <Layout titel="👤 Mit Konto anmelden">
      <div className="mx-auto max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">
          Mit deinem Schul-Konto wird dein Lernfortschritt gespeichert und auf
          jedem Gerät synchronisiert. Dein bisheriger Gast-Fortschritt auf diesem
          Gerät wird beim ersten Login übernommen.
        </p>
        <KontoLoginForm
          onErfolg={() => {
            navigate('/')
            // Frisch laden, damit alle Seiten den Konto-Zustand übernehmen.
            window.setTimeout(() => window.location.reload(), 50)
          }}
        />
      </div>
    </Layout>
  )
}
