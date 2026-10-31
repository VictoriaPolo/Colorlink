import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, LogOut, Package, UserCog, Users, type LucideIcon } from 'lucide-react'
import Logo from '@/shared/brand/Logo'
import FranjaColores from '@/shared/brand/FranjaColores'
import Avatar from '@/shared/ui/Avatar'
import { useToast } from '@/shared/lib/toast'
import { useAuth } from '@/features/auth/AuthContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import type { ContextoAdmin } from '@/features/admin/ContextoAdmin'
import NotificationBell from '@/features/admin/NotificationBell'
import { leerIdentidad, guardarIdentidad } from '@/features/admin/identidad'
import { useEquipo } from '@/data/repositories/equipoRepository'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { estaFinalizada } from '@/domain/solicitud/estadoMachine'
import type { Pedido } from '@/domain/tienda/types'

interface Enlace {
  to: string
  etiqueta: string
  icono: LucideIcon
  exacto?: boolean
  /** Cuántos hay esperando al equipo. */
  conteo?: number
}

function Navegacion({ enlaces, horizontal }: { enlaces: Enlace[]; horizontal?: boolean }) {
  return (
    <nav aria-label="Consola del equipo" className={horizontal ? 'flex gap-1 overflow-x-auto px-3 pb-3' : 'flex flex-col gap-1'}>
      {enlaces.map(({ to, etiqueta, icono: Icono, exacto, conteo }) => (
        <NavLink
          key={to}
          to={to}
          end={exacto}
          className={({ isActive }) =>
            `relative flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
              isActive ? 'bg-white/12 text-white' : 'text-white/70 hover:bg-white/8 hover:text-white'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && !horizontal && <span className="absolute top-2 bottom-2 left-0 w-1 rounded-r bg-accent" />}
              <Icono size={18} className={isActive ? 'text-accent' : ''} />
              {etiqueta}
              {conteo ? (
                <span className="ml-auto rounded-full bg-accent px-2 py-px text-[11px] font-extrabold text-navy tabular-nums">{conteo}</span>
              ) : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const { usuario, logout } = useAuth()
  const { solicitudes } = useSolicitudes()
  const { mostrarToast } = useToast()
  const { equipo } = useEquipo()
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [identidad, setIdentidad] = useState(() => leerIdentidad(usuario?.nombre ?? 'Equipo COLORLINK'))

  useEffect(() => {
    let vivo = true
    tiendaRepository
      .listarPedidos()
      .then((lista) => vivo && setPedidos(lista))
      .catch(() => {})
      .finally(() => vivo && setCargandoPedidos(false))
    return () => {
      vivo = false
    }
  }, [])

  const cambiarEstadoPedido: ContextoAdmin['cambiarEstadoPedido'] = async (id, estado) => {
    try {
      const actualizado = await tiendaRepository.actualizarEstadoPedido(id, estado)
      if (!actualizado) return
      setPedidos((prev) => prev.map((p) => (p.id === id ? actualizado : p)))
      mostrarToast(`${id} pasó a "${estado}".`)
    } catch {
      mostrarToast('No se pudo actualizar el pedido. Inténtalo de nuevo.', 'error')
    }
  }

  const agregarNotaPedido: ContextoAdmin['agregarNotaPedido'] = async (id, texto) => {
    try {
      const actualizado = await tiendaRepository.agregarNotaPedido(id, identidad, texto)
      if (!actualizado) return
      setPedidos((prev) => prev.map((p) => (p.id === id ? actualizado : p)))
      mostrarToast('Nota agregada.')
    } catch {
      mostrarToast('No se pudo guardar la nota. Inténtalo de nuevo.', 'error')
    }
  }

  const cambiarIdentidad = (nombre: string) => {
    setIdentidad(nombre)
    guardarIdentidad(nombre)
  }

  const enlaces: Enlace[] = [
    { to: '/admin', etiqueta: 'Resumen', icono: LayoutDashboard, exacto: true },
    {
      to: '/admin/solicitudes',
      etiqueta: 'Solicitudes',
      icono: ClipboardList,
      conteo: solicitudes.filter((s) => !estaFinalizada(s.estado) && !s.gestion?.cancelacion).length,
    },
    { to: '/admin/pedidos', etiqueta: 'Pedidos', icono: Package, conteo: pedidos.filter((p) => p.estado === 'Recibido' || p.estado === 'En preparación').length },
    { to: '/admin/clientes', etiqueta: 'Clientes', icono: Users },
    { to: '/admin/equipo', etiqueta: 'Equipo', icono: UserCog },
  ]

  const salir = async () => {
    await logout()
    navigate('/login')
  }

  const contexto: ContextoAdmin = { pedidos, cargandoPedidos, cambiarEstadoPedido, agregarNotaPedido, identidad, cambiarIdentidad }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted lg:flex-row">
      {/* Móvil: barra superior con la navegación en una fila que se desliza */}
      <header className="bg-navy lg:hidden">
        <FranjaColores />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Logo claro subtitulo={false} />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <button onClick={salir} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <Navegacion enlaces={enlaces} horizontal />
      </header>

      {/* Escritorio: barra lateral fija */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy lg:sticky lg:top-0 lg:flex lg:h-screen">
        <FranjaColores />
        <div className="flex items-center justify-between gap-2 px-5 pt-6 pb-2">
          <Logo claro />
          <NotificationBell />
        </div>
        <div className="px-5 pb-2">
          <span className="inline-block rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase">
            Consola del equipo
          </span>
        </div>
        <div className="mt-4 flex-1 px-3">
          <Navegacion enlaces={enlaces} />
        </div>
        {usuario && (
          <div className="flex flex-col gap-2 border-t border-white/10 p-4">
            {usuario.demo && (
              <>
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/70 uppercase">
                  Modo demostración
                </span>
                <label className="flex flex-col gap-1">
                  <span className="text-[10px] font-semibold tracking-wide text-white/50 uppercase">Actuando como</span>
                  <select
                    value={identidad}
                    onChange={(e) => cambiarIdentidad(e.target.value)}
                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-xs font-semibold text-white"
                  >
                    <option value={usuario.nombre}>{usuario.nombre} (cuenta compartida)</option>
                    {equipo.map((m) => (
                      <option key={m.nombre} value={m.nombre}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            <div className="flex items-center gap-3">
              <Avatar nombre={identidad} className="h-9 w-9 text-sm" />
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold text-white">{identidad}</p>
                <p className="truncate text-xs text-white/60">{usuario.email}</p>
              </div>
              <button onClick={salir} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión">
                <LogOut size={17} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <Outlet context={contexto} />
        </div>
      </main>
    </div>
  )
}
