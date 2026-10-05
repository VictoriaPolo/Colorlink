import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Droplets, LogOut, ShoppingCart, Store, ShieldCheck, FolderKanban } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/tienda/CartContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import BuscadorCatalogo from '@/features/tienda/BuscadorCatalogo'

const NAV_LINKS_CLIENTE: { to: string; label: string; badge?: string }[] = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Comprar Pinturas' },
  { to: '/simulador', label: 'Encuentra tu Color', badge: 'Visualizador' },
  { to: '/calculadora', label: 'Calculadora' },
  { to: '/puntos-de-retiro', label: 'Puntos de Retiro' },
  { to: '/solicitar', label: 'Diagnóstico de Superficie', badge: 'Asistido' },
  { to: '/mis-solicitudes', label: 'Mis solicitudes' },
  { to: '/ayuda', label: 'Ayuda' },
]

const NAV_LINKS_ADMIN: { to: string; label: string; badge?: string }[] = [
  { to: '/admin', label: 'Solicitudes de clientes' },
  { to: '/ayuda', label: 'Ayuda' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { totalItems, puntoRetiro } = useCart()
  const { proyectoActivo } = useSolicitudes()

  const esAdmin = usuario?.rol === 'admin'
  const esCliente = usuario?.rol === 'cliente'
  const navLinks = esAdmin ? NAV_LINKS_ADMIN : NAV_LINKS_CLIENTE

  const iniciales = usuario
    ? usuario.nombre
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
    : ''

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      {esCliente && (
        <div className="bg-navy text-[11px] font-medium text-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-1.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex min-w-0 items-center gap-1.5 text-pink-100">
                <Store size={14} className="shrink-0 text-pink-300" />
                <span className="hidden shrink-0 sm:inline">Retiro en tienda:</span>
                <strong className="truncate font-bold text-white underline decoration-pink-300/60 underline-offset-2">
                  {puntoRetiro.nombre} ({puntoRetiro.ciudad})
                </strong>
                <span className="hidden shrink-0 rounded border border-emerald-400/30 bg-emerald-400/20 px-1.5 text-[10px] font-bold text-emerald-200 sm:inline">
                  Listo en 2 hrs
                </span>
              </span>
              <span className="hidden shrink-0 items-center gap-1 text-pink-200 md:flex">
                <ShieldCheck size={14} className="text-emerald-300" /> Garantía directa de fábrica Pintuco
              </span>
            </div>
            <button
              onClick={() => navigate('/puntos-de-retiro')}
              className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-pink-200 transition-colors hover:bg-white/20 hover:text-white"
            >
              Cambiar tienda
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to={esAdmin ? '/admin' : '/'} className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-fuchsia-500 to-teal text-white shadow-soft">
            <Droplets size={20} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
              COLORLINK
            </span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block">
              Transformación Digital Inteligente en Pintura
            </span>
          </span>
        </Link>

        {esCliente && <BuscadorCatalogo className="mx-4 hidden max-w-xl flex-1 md:block" />}

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              {esCliente && proyectoActivo && (
                <button
                  onClick={() => navigate(`/mis-solicitudes/${proyectoActivo.id}`)}
                  title="Ir a tu proyecto activo"
                  className="hidden items-center gap-2 rounded-xl border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-pink-100 xl:flex"
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
                  <span className="text-xs text-slate-400">{esAdmin ? 'Administrador' : 'Cliente'}</span>
                  <span className="text-sm font-semibold text-navy">{usuario.nombre}</span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-sm font-bold text-white">
                  {iniciales}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-red-500"
                  aria-label="Cerrar sesión"
                  title="Cerrar sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
              {esCliente && (
                <button
                  onClick={() => navigate('/carrito')}
                  className="relative flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
                  aria-label="Ver carrito"
                >
                  <ShoppingCart size={16} />
                  <span className="hidden sm:inline">Carrito</span>
                  {totalItems > 0 && (
                    <span className="rounded-full bg-white px-1.5 text-[10px] font-black text-primary">{totalItems}</span>
                  )}
                </button>
              )}
              <button
                className="rounded-lg p-2 text-navy lg:hidden"
                onClick={() => setOpen((v) => !v)}
                aria-label="Abrir menú"
              >
                {open ? <X size={22} /> : <Menu size={22} />}
              </button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>Iniciar sesión</Button>
          )}
        </div>
      </div>

      {usuario && (
        <nav className="hidden border-t border-slate-100 lg:block">
          <div className="mx-auto flex max-w-7xl items-center gap-1 px-4 py-1.5 sm:px-6 lg:px-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive ? 'bg-pink-50 text-primary' : 'text-body hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                {link.label}
                {link.badge && (
                  <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      )}

      {open && usuario && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {esCliente && <BuscadorCatalogo className="mb-2 md:hidden" onNavegar={() => setOpen(false)} />}
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-1.5 rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-pink-50 text-primary' : 'text-body'
                }`
              }
            >
              {link.label}
              {link.badge && (
                <span className="rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold text-teal">
                  {link.badge}
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-red-500"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        </nav>
      )}
    </header>
  )
}
