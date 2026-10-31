import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, ShoppingCart, Store, ShieldCheck, FolderKanban, Truck } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Avatar from '@/shared/ui/Avatar'
import Logo from '@/shared/brand/Logo'
import FranjaColores from '@/shared/brand/FranjaColores'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/tienda/CartContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import BuscadorCatalogo from '@/features/tienda/BuscadorCatalogo'
import { usePedidoActivo } from '@/features/pagos/usePedidoActivo'
import { ETIQUETA_CORTA } from '@/features/pagos/estadoPedido'

const NAV_LINKS_CLIENTE: { to: string; label: string; badge?: string }[] = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Comprar Pinturas' },
  { to: '/simulador', label: 'Encuentra tu Color', badge: 'Visualizador' },
  { to: '/calculadora', label: 'Calculadora' },
  { to: '/puntos-de-retiro', label: 'Puntos de Retiro' },
  { to: '/solicitar', label: 'Diagnóstico de Superficie', badge: 'Con foto' },
  { to: '/mis-solicitudes', label: 'Mis solicitudes' },
  { to: '/ayuda', label: 'Ayuda' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { totalItems, puntoRetiro } = useCart()
  const { proyectoActivo } = useSolicitudes()
  const pedidoActivo = usePedidoActivo()

  const esAdmin = usuario?.rol === 'admin'
  const esCliente = usuario?.rol === 'cliente'

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_1px_0_0_var(--color-slate-200)]">
      <FranjaColores />

      {esCliente && (
        <div className="bg-navy text-[11px] font-medium text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-brand-100">
                <Store size={14} className="shrink-0 text-accent" />
                <span className="hidden shrink-0 sm:inline">Retiro en tienda:</span>
                <strong className="truncate font-bold text-white underline decoration-accent/60 underline-offset-2">
                  {puntoRetiro.nombre} ({puntoRetiro.ciudad})
                </strong>
                <span className="hidden shrink-0 rounded border border-emerald-400/30 bg-emerald-400/20 px-1.5 text-[10px] font-bold text-emerald-200 sm:inline">
                  Listo en 2 hrs
                </span>
              </span>
              <span className="hidden shrink-0 items-center gap-1 text-brand-200 md:flex">
                <ShieldCheck size={14} className="text-emerald-300" /> Garantía directa de fábrica Pintuco
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {pedidoActivo && (
                <Link
                  to={`/pedidos/${pedidoActivo.id}`}
                  title="Rastrear tu pedido"
                  className="hidden items-center gap-1.5 rounded bg-accent px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-navy uppercase transition-colors hover:bg-accent-dark sm:flex"
                >
                  <Truck size={12} aria-hidden="true" />
                  Pedido {pedidoActivo.id} · {ETIQUETA_CORTA[pedidoActivo.estado] ?? pedidoActivo.estado}
                </Link>
              )}
              <button
                onClick={() => navigate('/puntos-de-retiro')}
                className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-accent transition-colors hover:bg-white/20"
              >
                Cambiar tienda
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to={esAdmin ? '/admin' : '/'} aria-label="COLORLINK, ir al inicio" className="shrink-0">
          <Logo />
        </Link>

        {esAdmin && (
          <span className="hidden rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase sm:inline">
            Consola del equipo
          </span>
        )}

        {esCliente && <BuscadorCatalogo className="mx-4 hidden max-w-xl flex-1 md:block" />}

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              {esCliente && proyectoActivo && (
                <button
                  onClick={() => navigate(`/mis-solicitudes/${proyectoActivo.id}`)}
                  title="Ir a tu proyecto activo"
                  className="hidden items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-brand-100 xl:flex"
                >
                  <FolderKanban size={14} />
                  <span className="max-w-[130px] truncate">
                    {proyectoActivo.data.proyecto.tipoObra} · {proyectoActivo.id}
                  </span>
                  <span className="h-2 w-2 rounded-full bg-success" />
                </button>
              )}
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
                    {esAdmin ? 'Equipo COLORLINK' : 'Cliente'}
                  </span>
                  <span className="text-sm font-semibold text-navy">{usuario.nombre}</span>
                </div>
                <Avatar nombre={usuario.nombre} url={usuario.avatarUrl} />
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-600"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
              {esCliente && (
                <button
                  onClick={() => navigate('/carrito')}
                  className="relative flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
                  aria-label="Ver carrito"
                >
                  <ShoppingCart size={16} />
                  <span className="hidden sm:inline">Carrito</span>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-accent px-1.5 text-[10px] font-black text-navy">{totalItems}</span>
                  )}
                </button>
              )}
              {esCliente && (
                <button
                  className="rounded-lg p-2 text-navy lg:hidden"
                  onClick={() => setOpen((v) => !v)}
                  aria-label="Abrir menú"
                  aria-expanded={open}
                >
                  {open ? <X size={22} /> : <Menu size={22} />}
                </button>
              )}
              {esAdmin && (
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-red-600 sm:hidden"
                  aria-label="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              )}
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>Iniciar sesión</Button>
          )}
        </div>
      </div>

      {esCliente && (
        <nav className="hidden border-t border-slate-200 lg:block" aria-label="Principal">
          <div className="mx-auto flex max-w-7xl items-stretch gap-1 px-4 sm:px-6 lg:px-8">
            {NAV_LINKS_CLIENTE.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative inline-flex items-center gap-1.5 px-3 py-3 text-sm font-semibold whitespace-nowrap transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-t after:transition-colors ${
                    isActive
                      ? 'text-primary after:bg-accent'
                      : 'text-body after:bg-transparent hover:text-navy hover:after:bg-slate-200'
                  }`
                }
              >
                {link.label}
                {link.badge && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-navy uppercase">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {open && esCliente && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 bg-white px-4 py-3 lg:hidden" aria-label="Principal">
          <BuscadorCatalogo className="mb-2 md:hidden" onNavegar={() => setOpen(false)} />
          {pedidoActivo && (
            <Link
              to={`/pedidos/${pedidoActivo.id}`}
              onClick={() => setOpen(false)}
              className="mb-1 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm font-bold text-amber-900"
            >
              <Truck size={16} aria-hidden="true" />
              Rastrear pedido {pedidoActivo.id}
              <span className="ml-auto rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold text-navy">
                {ETIQUETA_CORTA[pedidoActivo.estado] ?? pedidoActivo.estado}
              </span>
            </Link>
          )}
          {NAV_LINKS_CLIENTE.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-semibold ${
                  isActive ? 'bg-brand-50 text-primary' : 'text-body'
                }`
              }
            >
              {link.label}
              {link.badge && (
                <span className="rounded bg-accent px-1.5 py-0.5 text-[9px] font-extrabold tracking-wide text-navy uppercase">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-red-600"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  )
}
