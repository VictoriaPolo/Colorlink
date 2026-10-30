import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Header from '@/shared/layout/Header'
import Footer from '@/shared/layout/Footer'
import ErrorBoundary from '@/shared/ui/ErrorBoundary'
import { ToastProvider } from '@/shared/ui/Toaster'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { SolicitudesProvider } from '@/features/solicitudes/context/SolicitudesContext'
import { CartProvider } from '@/features/tienda/CartContext'
import ChatWidget from '@/features/chat/ChatWidget'
import RequireAuth from '@/features/auth/RequireAuth'
import Home from '@/pages/Home'
import Solicitar from '@/pages/Solicitar'
import MisSolicitudes from '@/pages/MisSolicitudes'
import SolicitudDetail from '@/pages/SolicitudDetail'
import Catalogo from '@/pages/Catalogo'
import Calculadora from '@/pages/Calculadora'
import Simulador from '@/pages/Simulador'
import PuntosDeRetiro from '@/pages/PuntosDeRetiro'
import Carrito from '@/pages/Carrito'
import Ayuda from '@/pages/Ayuda'
import Login from '@/pages/Login'
import NotFound from '@/pages/NotFound'

// La consola del equipo solo la usa el equipo: los clientes no descargan ese código.
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'))
const AdminResumen = lazy(() => import('@/pages/admin/AdminResumen'))
const AdminSolicitudes = lazy(() => import('@/pages/admin/AdminSolicitudes'))
const AdminSolicitudDetalle = lazy(() => import('@/pages/admin/AdminSolicitudDetalle'))
const AdminPedidos = lazy(() => import('@/pages/admin/AdminPedidos'))
const AdminClientes = lazy(() => import('@/pages/admin/AdminClientes'))

function Cargando() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-primary" role="status" aria-label="Cargando">
      <Loader2 className="animate-spin" size={28} />
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

/** Una ruta que solo puede ver un cliente con sesión (el equipo va a su consola). */
function SoloCliente({ children }: { children: React.ReactNode }) {
  return <RequireAuth rol="cliente">{children}</RequireAuth>
}

/** Los enlaces viejos (/admin/CL-1001) siguen funcionando: llevan al detalle de la consola. */
function RedirigirSolicitud() {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`/admin/solicitudes/${id}`} replace />
}

function Rutas() {
  return (
    <Suspense fallback={<Cargando />}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Login modo="registro" />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        <Route path="/solicitar" element={<SoloCliente><Solicitar /></SoloCliente>} />
        <Route path="/mis-solicitudes" element={<SoloCliente><MisSolicitudes /></SoloCliente>} />
        <Route path="/mis-solicitudes/:id" element={<SoloCliente><SolicitudDetail /></SoloCliente>} />
        <Route path="/catalogo" element={<SoloCliente><Catalogo /></SoloCliente>} />
        <Route path="/calculadora" element={<SoloCliente><Calculadora /></SoloCliente>} />
        <Route path="/simulador" element={<SoloCliente><Simulador /></SoloCliente>} />
        <Route path="/puntos-de-retiro" element={<SoloCliente><PuntosDeRetiro /></SoloCliente>} />
        <Route path="/carrito" element={<SoloCliente><Carrito /></SoloCliente>} />
        <Route
          path="/admin"
          element={
            <RequireAuth rol="admin">
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<AdminResumen />} />
          <Route path="solicitudes" element={<AdminSolicitudes />} />
          <Route path="solicitudes/:id" element={<AdminSolicitudDetalle />} />
          <Route path="pedidos" element={<AdminPedidos />} />
          <Route path="clientes" element={<AdminClientes />} />
          <Route path=":id" element={<RedirigirSolicitud />} />
        </Route>
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
    </Suspense>
  )
}

/** Marco de la aplicación: cabecera y pie, salvo en las pantallas de acceso,
 * que ocupan toda la ventana. */
function Marco() {
  const { pathname } = useLocation()
  const { usuario } = useAuth()
  const pantallaCompleta = pathname === '/login' || pathname === '/registro'
  // La consola del equipo trae su propia barra lateral: no lleva la cabecera ni el pie de la tienda.
  const consola = pathname.startsWith('/admin') && usuario?.rol === 'admin'

  if (consola) {
    return (
      <>
        <ScrollToTop />
        <Rutas />
        <ChatWidget />
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted">
      <ScrollToTop />
      {!pantallaCompleta && <Header />}
      <main className="flex-1">
        <Rutas />
      </main>
      {!pantallaCompleta && <Footer />}
      <ChatWidget />
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SolicitudesProvider>
          <CartProvider>
            <ToastProvider>
              <Marco />
            </ToastProvider>
          </CartProvider>
        </SolicitudesProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
