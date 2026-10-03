import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Search,
  ShoppingBag,
  Palette,
  Calculator,
  Sparkles,
  ShieldCheck,
  Clock,
  HardHat,
} from 'lucide-react'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import HeroIllustration from '@/shared/illustrations/HeroIllustration'
import KitSelector from '@/features/tienda/KitSelector'
import ProductoCard from '@/features/tienda/ProductoCard'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useAuth } from '@/features/auth/AuthContext'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { paletaColores } from '@/data/paletaColores'
import type { Producto } from '@/domain/tienda/types'

const ACCESOS_RAPIDOS = [
  { icon: ShoppingBag, titulo: 'Comprar Pinturas', texto: 'Viniltex, Koraza, Aquablock', to: '/catalogo' },
  { icon: Palette, titulo: 'Encuentra tu Color', texto: 'Simulador en vivo', to: '/simulador' },
  { icon: Sparkles, titulo: 'Kits de Solución', texto: 'Hasta 15% Dcto', to: '#kits' },
  { icon: Calculator, titulo: 'Calculadora', texto: 'Galones por m² exactos', to: '/calculadora' },
]

const BENEFICIOS = [
  { icon: Sparkles, title: 'Recomendación en minutos', text: 'COLORLINK interpreta tu necesidad y sugiere el sistema Pintuco adecuado.' },
  { icon: ShieldCheck, title: 'Garantía Directa', text: 'Garantía de fábrica Pintuco de 5 a 8 años según el sistema aplicado.' },
  { icon: Palette, title: 'Color Computarizado', text: '+1.000 tonos exactos al instante en nuestro simulador.' },
  { icon: HardHat, title: 'Asesoría en Obra', text: 'Acompañamiento técnico B2B para constructoras y contratistas.' },
]

export default function Home() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { solicitudes, cargando } = useSolicitudes()
  const [busqueda, setBusqueda] = useState('')
  const [destacados, setDestacados] = useState<Producto[]>([])

  useEffect(() => {
    tiendaRepository.listarProductos().then((data) => setDestacados(data.filter((p) => p.destacado)))
  }, [])

  if (usuario?.rol === 'admin') return <Navigate to="/admin" replace />

  const nombre = usuario?.nombre.split(' ')[0] ?? ''
  const activas = solicitudes.filter((s) => s.estado !== 'Finalizada').length

  const handleBuscar = (e: FormEvent) => {
    e.preventDefault()
    navigate(busqueda ? `/catalogo?q=${encodeURIComponent(busqueda)}` : '/catalogo')
  }

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-surface-muted">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-gradient-to-br from-pink-300 to-fuchsia-300 opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-10 -right-32 h-96 w-96 rounded-full bg-gradient-to-br from-violet-300 to-purple-300 opacity-40 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="animate-slide-up">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles size={13} /> Ecosistema Digital Oficial de Pinturas Pintuco
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-navy sm:text-5xl">
              Todo lo que necesitas para tu espacio, con la garantía{' '}
              <span className="bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent">COLORLINK</span>
            </h1>
            <p className="mt-5 max-w-lg text-base text-body sm:text-lg">
              Compra pinturas Pintuco originales, simula paletas de color en vivo, calcula galones exactos para tu
              metraje y diagnostica la necesidad de tu espacio con garantía certificada.
            </p>

            <form onSubmit={handleBuscar} className="relative mt-8 max-w-lg">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" size={17} />
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pr-32 pl-11 text-sm text-navy shadow-soft outline-none focus:border-primary focus:ring-4 focus:ring-pink-100"
                placeholder="¿Qué necesitas? Ej: Fachada 85 m², Koraza..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              <button
                type="submit"
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
              >
                Buscar Solución
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button size="lg" icon={<ArrowRight size={18} />} onClick={() => navigate('/catalogo')}>
                Comprar Pinturas
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/solicitar')}>
                Diagnóstico B2B
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md animate-fade-in lg:max-w-none">
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* FRANJA DE CUENTA (compacta) */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card
          onClick={() => navigate('/mis-solicitudes')}
          className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4"
        >
          <span className="text-sm text-body">
            Hola, <span className="font-bold text-navy">{nombre}</span> — tienes{' '}
            <span className="font-bold text-primary">{cargando ? '...' : activas}</span> solicitud
            {activas === 1 ? '' : 'es'} activa{activas === 1 ? '' : 's'}
          </span>
          <span className="text-sm font-semibold text-primary">Ver mis solicitudes →</span>
        </Card>
      </section>

      {/* ACCESOS RÁPIDOS */}
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ACCESOS_RAPIDOS.map(({ icon: Icon, titulo, texto, to }) => (
            <button
              key={titulo}
              onClick={() => (to.startsWith('#') ? document.getElementById('kits')?.scrollIntoView({ behavior: 'smooth' }) : navigate(to))}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-soft transition-transform hover:-translate-y-0.5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-50 text-primary transition-transform group-hover:scale-105">
                <Icon size={20} />
              </span>
              <div>
                <h3 className="text-sm font-bold text-navy">{titulo}</h3>
                <p className="text-xs text-slate-400">{texto}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* BENEFICIOS */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="flex flex-col gap-3 p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-50 text-teal">
                <Icon size={20} />
              </span>
              <h3 className="text-sm font-bold text-navy">{title}</h3>
              <p className="text-xs text-body">{text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* KITS POR PATOLOGÍA */}
      <section id="kits" className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 text-center">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
            Solución técnica en 1 clic
          </span>
          <h2 className="text-2xl font-bold text-navy">¿Cuál es la patología o necesidad de tu espacio?</h2>
          <p className="mt-1 text-body">Selecciona tu caso y obtén el sistema Pintuco recomendado con cantidades calculadas.</p>
        </div>
        <KitSelector />
      </section>

      {/* CATÁLOGO DESTACADO */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
              Catálogo Oficial Pintuco
            </span>
            <h2 className="text-2xl font-bold text-navy">Pinturas Más Vendidas</h2>
          </div>
          <button onClick={() => navigate('/catalogo')} className="text-sm font-semibold text-primary hover:underline">
            Ver todo el catálogo →
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      </section>

      {/* TENDENCIAS DE COLOR */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-6 p-8 text-center">
          <div>
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-400">
              Tendencias del Color 2026
            </span>
            <h2 className="text-2xl font-bold text-navy">Descubre el Color Perfecto para tus Espacios</h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {paletaColores
              .filter((c) => c.categoria === 'Tendencias 2026')
              .slice(0, 6)
              .map((c) => (
              <span
                key={c.codigo}
                className="h-10 w-10 rounded-full border border-slate-200"
                style={{ backgroundColor: c.hex }}
                title={c.nombre}
              />
            ))}
          </div>
          <Button icon={<Palette size={16} />} onClick={() => navigate('/simulador')}>
            Abrir Simulador de Ambientes
          </Button>
        </Card>
      </section>

      {/* B2B */}
      <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-4 bg-navy p-10 text-center text-white">
          <HardHat size={28} />
          <h2 className="text-2xl font-bold">¿Gestionas proyectos u obras de gran metraje?</h2>
          <p className="max-w-xl text-sm text-purple-100">
            Registra tu obra en COLORLINK para recibir diagnóstico técnico, precios mayoristas y despacho
            programado.
          </p>
          <Button icon={<Clock size={16} />} onClick={() => navigate('/solicitar')}>
            Iniciar Diagnóstico B2B
          </Button>
        </Card>
      </section>
    </div>
  )
}
