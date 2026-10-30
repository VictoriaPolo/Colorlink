import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ClipboardList, LayoutDashboard, LogOut, Package, Users, type LucideIcon } from 'lucide-react'
import Logo from '@/shared/brand/Logo'
import FranjaColores from '@/shared/brand/FranjaColores'
import Avatar from '@/shared/ui/Avatar'
import { useToast } from '@/shared/lib/toast'
import { useAuth } from '@/features/auth/AuthContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import type { ContextoAdmin } from '@/features/admin/ContextoAdmin'
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
  const navigate = useNavigate()
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)

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

  const enlaces: Enlace[] = [
    { to: '/admin', etiqueta: 'Resumen', icono: LayoutDashboard, exacto: true },
    { to: '/admin/solicitudes', etiqueta: 'Solicitudes', icono: ClipboardList, conteo: solicitudes.filter((s) => !estaFinalizada(s.estado)).length },
    { to: '/admin/pedidos', etiqueta: 'Pedidos', icono: Package, conteo: pedidos.filter((p) => p.estado === 'Recibido' || p.estado === 'En preparación').length },
    { to: '/admin/clientes', etiqueta: 'Clientes', icono: Users },
  ]

  const salir = async () => {
    await logout()
    navigate('/login')
  }

  const contexto: ContextoAdmin = { pedidos, cargandoPedidos, cambiarEstadoPedido }

  return (
    <div className="flex min-h-screen flex-col bg-surface-muted lg:flex-row">
      {/* Móvil: barra superior con la navegación en una fila que se desliza */}
      <header className="bg-navy lg:hidden">
        <FranjaColores />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Logo claro subtitulo={false} />
          <button onClick={salir} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión">
            <LogOut size={18} />
          </button>
        </div>
        <Navegacion enlaces={enlaces} horizontal />
      </header>

      {/* Escritorio: barra lateral fija */}
      <aside className="hidden w-64 shrink-0 flex-col bg-navy lg:sticky lg:top-0 lg:flex lg:h-screen">
        <FranjaColores />
        <div className="px-5 pt-6 pb-2">
          <Logo claro />
          <span className="mt-4 inline-block rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase">
            Consola del equipo
          </span>
        </div>
        <div className="mt-4 flex-1 px-3">
          <Navegacion enlaces={enlaces} />
        </div>
        {usuario && (
          <div className="flex items-center gap-3 border-t border-white/10 p-4">
            <Avatar nombre={usuario.nombre} url={usuario.avatarUrl} className="h-9 w-9 text-sm" />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
              <p className="truncate text-xs text-white/60">{usuario.email}</p>
            </div>
            <button onClick={salir} className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={17} />
            </button>
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
