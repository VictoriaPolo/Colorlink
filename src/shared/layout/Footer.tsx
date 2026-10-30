import { Link } from 'react-router-dom'
import Logo from '@/shared/brand/Logo'
import FranjaColores from '@/shared/brand/FranjaColores'

const COLUMNAS: { titulo: string; links: { to: string; label: string }[] }[] = [
  {
    titulo: 'Tienda',
    links: [
      { to: '/catalogo', label: 'Catálogo de pinturas' },
      { to: '/?kit=Fachada exterior', label: 'Kits de solución' },
      { to: '/puntos-de-retiro', label: 'Puntos de retiro' },
      { to: '/carrito', label: 'Mi carrito' },
    ],
  },
  {
    titulo: 'Herramientas',
    links: [
      { to: '/simulador', label: 'Simulador de color' },
      { to: '/calculadora', label: 'Calculadora de pintura' },
      { to: '/solicitar', label: 'Diagnóstico de superficie' },
      { to: '/mis-solicitudes', label: 'Mis solicitudes' },
    ],
  },
  {
    titulo: 'Soporte',
    links: [
      { to: '/ayuda', label: 'Centro de ayuda' },
      { to: '/ayuda', label: 'Preguntas frecuentes' },
    ],
  },
]

/** Pie de página de la tienda (la consola del equipo no lo usa). */
export default function Footer() {
  const anio = new Date().getFullYear()

  return (
    <footer className="mt-16 bg-navy text-white/75">
      <FranjaColores className="h-1.5" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Logo claro />
          <p className="mt-4 max-w-sm text-sm leading-relaxed">
            Ecosistema digital para comprar pinturas Pintuco, simular colores, calcular materiales y recibir un
            diagnóstico técnico de tu superficie con una foto.
          </p>
        </div>
        {COLUMNAS.map((columna) => (
          <nav key={columna.titulo} aria-label={columna.titulo}>
            <h2 className="text-xs font-extrabold tracking-[0.14em] text-accent uppercase">{columna.titulo}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {columna.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/55 sm:px-6 lg:px-8">
          <span>© {anio} COLORLINK · Distribuidor oficial Pintuco · Prototipo académico</span>
          <span>Pintuco y las marcas de sus productos pertenecen a sus respectivos titulares.</span>
        </div>
      </div>
    </footer>
  )
}
