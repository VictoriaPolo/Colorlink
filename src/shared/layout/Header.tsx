import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, Droplets, LogOut } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { useAuth } from '@/features/auth/AuthContext'

const NAV_LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/solicitar', label: 'Solicitar solución' },
  { to: '/mis-solicitudes', label: 'Mis solicitudes' },
  { to: '/ayuda', label: 'Ayuda' },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

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
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
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

        {usuario && (
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-pink-50 text-primary' : 'text-body hover:bg-slate-50 hover:text-navy'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {usuario ? (
            <>
              <div className="hidden items-center gap-2.5 sm:flex">
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-slate-400">Cliente</span>
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
              <Button className="hidden sm:inline-flex" onClick={() => navigate('/solicitar')}>
                Solicitar solución
              </Button>
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

      {open && usuario && (
        <nav className="flex flex-col gap-1 border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-3.5 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-pink-50 text-primary' : 'text-body'
                }`
              }
            >
              {link.label}
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
