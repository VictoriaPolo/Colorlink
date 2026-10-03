import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Header from '@/shared/layout/Header'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/ui/Toaster'
import { AuthProvider } from '@/features/auth/AuthContext'
import { SolicitudesProvider } from '@/features/solicitudes/context/SolicitudesContext'
import { CartProvider } from '@/features/tienda/CartContext'
import ChatWidget from '@/features/chat/ChatWidget'
import RequireAuth from '@/features/auth/RequireAuth'
import Home from '@/pages/Home'
import Solicitar from '@/pages/Solicitar'
import MisSolicitudes from '@/pages/MisSolicitudes'
import SolicitudDetail from '@/pages/SolicitudDetail'
import Admin from '@/pages/Admin'
import Catalogo from '@/pages/Catalogo'
import Calculadora from '@/pages/Calculadora'
import Simulador from '@/pages/Simulador'
import PuntosDeRetiro from '@/pages/PuntosDeRetiro'
import Carrito from '@/pages/Carrito'
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
          <CartProvider>
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
                        <RequireAuth rol="cliente">
                          <Solicitar />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/mis-solicitudes"
                      element={
                        <RequireAuth rol="cliente">
                          <MisSolicitudes />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/mis-solicitudes/:id"
                      element={
                        <RequireAuth rol="cliente">
                          <SolicitudDetail />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/catalogo"
                      element={
                        <RequireAuth rol="cliente">
                          <Catalogo />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/calculadora"
                      element={
                        <RequireAuth rol="cliente">
                          <Calculadora />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/simulador"
                      element={
                        <RequireAuth rol="cliente">
                          <Simulador />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/puntos-de-retiro"
                      element={
                        <RequireAuth rol="cliente">
                          <PuntosDeRetiro />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/carrito"
                      element={
                        <RequireAuth rol="cliente">
                          <Carrito />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin"
                      element={
                        <RequireAuth rol="admin">
                          <Admin />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin/:id"
                      element={
                        <RequireAuth rol="admin">
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
                  COLORLINK — Transformación Digital Inteligente en Pintura · Distribuidor oficial Pintuco · Prototipo académico
                </footer>
                <ChatWidget />
              </div>
            </ToastProvider>
          </CartProvider>
        </SolicitudesProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
