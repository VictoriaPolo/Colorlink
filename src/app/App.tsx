import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from '@/shared/layout/Header'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/ui/Toaster'
import { AuthProvider } from '@/features/auth/AuthContext'
import { SolicitudesProvider } from '@/features/solicitudes/context/SolicitudesContext'
import RequireAuth from '@/features/auth/RequireAuth'
import Home from '@/pages/Home'
import Solicitar from '@/pages/Solicitar'
import MisSolicitudes from '@/pages/MisSolicitudes'
import SolicitudDetail from '@/pages/SolicitudDetail'
import Ayuda from '@/pages/Ayuda'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SolicitudesProvider>
          <ToastProvider>
            <div className="flex min-h-screen flex-col bg-surface-muted">
              <ScrollToTop />
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <RequireAuth>
                        <Home />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/solicitar"
                    element={
                      <RequireAuth>
                        <Solicitar />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/mis-solicitudes"
                    element={
                      <RequireAuth>
                        <MisSolicitudes />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/mis-solicitudes/:id"
                    element={
                      <RequireAuth>
                        <SolicitudDetail />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/ayuda"
                    element={
                      <RequireAuth>
                        <Ayuda />
                      </RequireAuth>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <footer className="border-t border-slate-100 bg-white py-6 text-center text-xs text-slate-400">
                COLORLINK — Transformación Digital Inteligente en Pintura · Prototipo académico
              </footer>
            </div>
          </ToastProvider>
        </SolicitudesProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
