import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from './components/layout/Header'
import Home from './pages/Home'
import WizardPage from './pages/wizard/WizardPage'
import MisSolicitudes from './pages/MisSolicitudes'
import SolicitudDetail from './pages/SolicitudDetail'
import Ayuda from './pages/Ayuda'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <ScrollToTop />
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/solicitar" element={<WizardPage />} />
          <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
          <Route path="/mis-solicitudes/:id" element={<SolicitudDetail />} />
          <Route path="/ayuda" element={<Ayuda />} />
        </Routes>
      </main>
      <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
        COLORLINK — Transformación Digital Inteligente en Pintura · Prototipo académico
      </footer>
    </div>
  )
}
