import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ShoppingBag,
  Palette,
  Calculator,
  Package,
  Sparkles,
  FolderKanban,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Store,
} from 'lucide-react'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import KitSelector from '@/features/tienda/KitSelector'
import ProductoCard from '@/features/tienda/ProductoCard'
import AgregarAlCarritoModal from '@/features/tienda/AgregarAlCarritoModal'
import { useCart } from '@/features/tienda/CartContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import { useAuth } from '@/features/auth/AuthContext'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { paletaColores } from '@/data/paletaColores'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'
import { ORDEN_ESTADOS } from '@/domain/solicitud/types'
import type { Producto } from '@/domain/tienda/types'

const ACCESOS = [
  {
    titulo: 'Comprar Pintura',
    texto: 'Vinilos, fachadas, esmaltes e impermeabilizantes',
    badge: 'Catálogo oficial',
    icon: ShoppingBag,
    color: 'bg-primary',
    to: '/catalogo',
  },
  {
    titulo: 'Encuentra tu Color',
    texto: 'Simulador de ambientes y carta de color 2026',
    badge: 'Visualizador en vivo',
    icon: Palette,
    color: 'bg-sky',
    to: '/simulador',
  },
  {
    titulo: 'Kits de Solución',
    texto: 'Sistemas multicapa empaquetados con hasta 15% dcto',
    badge: 'Paquetes con descuento',
    icon: Package,
    color: 'bg-amber-500',
    to: '#kits',
  },
  {
    titulo: 'Calculadora de Metraje',
    texto: 'Calcula galones y cuñetes según tus m² exactos',
    badge: 'Cálculo preciso',
    icon: Calculator,
    color: 'bg-teal',
    to: '/calculadora',
  },
]

const CIUDADES_RETIRO = new Intl.ListFormat('es', { type: 'disjunction' }).format([
  ...new Set(puntosDeRetiro.map((p) => p.ciudad)),
])

/** Panel del cliente (equivalente a /panel de la tienda de referencia). */
export default function Home() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { usuario } = useAuth()
  const { proyectoActivo: proyecto } = useSolicitudes()
  const { puntoRetiro } = useCart()
  const [productos, setProductos] = useState<Producto[]>([])
  const [comprarMateriales, setComprarMateriales] = useState(false)

  useEffect(() => {
    tiendaRepository.listarProductos().then(setProductos)
  }, [])

  if (usuario?.rol === 'admin') return <Navigate to="/admin" replace />

  const nombre = usuario?.nombre.split(' ')[0] ?? ''
  const productoProyecto = proyecto && productos.find((p) => p.nombre === proyecto.recomendacion.producto)
  const destacados = productos.filter((p) => p.destacado).slice(0, 4)
  const tendencias = paletaColores.filter((c) => c.categoria === 'Tendencias 2026').slice(0, 6)

  const irA = (to: string) =>
    to.startsWith('#') ? document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' }) : navigate(to)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-navy via-primary-dark to-teal p-6 text-white shadow-soft-lg sm:p-8">
        <div className="relative z-10 flex max-w-2xl flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-navy">
            <Sparkles size={14} className="text-primary" /> Ecosistema Digital Pintuco • Todo para tu obra y hogar
          </span>
          {nombre && <p className="text-sm font-semibold text-pink-100">Hola, {nombre} 👋</p>}
          <h1 className="text-2xl font-extrabold leading-tight tracking-tight sm:text-4xl">
            ¿Qué necesitas resolver con Pintuco hoy?
          </h1>
          <p className="text-sm font-medium leading-relaxed text-pink-100">
            Compra pinturas originales, simula colores en vivo, calcula los galones exactos de tu espacio o gestiona
            tus obras con respaldo técnico certificado.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => navigate('/catalogo')}
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-primary-dark shadow-soft transition-colors hover:bg-pink-50"
            >
              <ShoppingBag size={16} /> Explorar tienda online
            </button>
            <button
              onClick={() => navigate('/simulador')}
              className="flex items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/25"
            >
              <Palette size={16} /> Simular color en ambientes
            </button>
            <button
              onClick={() => navigate('/mis-solicitudes')}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-semibold text-pink-100 transition-colors hover:bg-white/20"
            >
              <FolderKanban size={16} /> Mis solicitudes de obra
            </button>
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -bottom-10 h-96 w-96 rounded-full bg-pink-300/20 blur-3xl"
        />
      </section>

      {/* ACCESOS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map(({ titulo, texto, badge, icon: Icon, color, to }) => (
          <button
            key={titulo}
            onClick={() => irA(to)}
            className="group flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-soft transition-all hover:border-pink-200 hover:shadow-soft-lg"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-soft transition-transform group-hover:scale-105 ${color}`}
                >
                  <Icon size={20} />
                </span>
                <span className="text-[10px] font-bold uppercase text-slate-400">{badge}</span>
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-navy transition-colors group-hover:text-primary">{titulo}</h3>
                <p className="mt-1 text-xs leading-relaxed text-body">{texto}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs font-bold text-primary">
              <span>Comenzar</span>
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </section>

      {/* PROYECTO ACTIVO */}
      {proyecto && (
        <section className="rounded-2xl border border-pink-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex max-w-2xl flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-pink-200 bg-pink-50 px-2.5 py-0.5 text-xs font-bold text-primary">
                  <FolderKanban size={14} /> Proyecto activo • {proyecto.id}
                </span>
                <Badge estado={proyecto.estado} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-navy sm:text-xl">
                  {proyecto.data.proyecto.tipoObra} — {proyecto.data.identificacion.cliente} (
                  {proyecto.data.proyecto.areaAprox} m² • {proyecto.data.tecnica.superficie})
                </h2>
                {proyecto.data.evidencia.descripcion && (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-body">
                    {proyecto.data.evidencia.descripcion}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin size={14} className="text-primary" /> {proyecto.data.proyecto.ciudad}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-slate-400" /> Paso {ORDEN_ESTADOS.indexOf(proyecto.estado) + 1} de{' '}
                  {ORDEN_ESTADOS.length}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-success" /> Sistema {proyecto.recomendacion.producto} asignado
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              <Button onClick={() => navigate(`/mis-solicitudes/${proyecto.id}`)}>
                Ver diagnóstico y ficha de obra <ChevronRight size={15} />
              </Button>
              {productoProyecto && (
                <button
                  onClick={() => setComprarMateriales(true)}
                  className="rounded-xl border border-pink-200 bg-pink-50 px-4 py-2 text-center text-xs font-bold text-primary transition-colors hover:bg-pink-100"
                >
                  + Comprar materiales del proyecto
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* DIAGNÓSTICO Y KITS — la key lo remonta si llega otro ?kit= estando ya en el panel */}
      <KitSelector key={searchParams.get('kit') ?? ''} />

      {/* MÁS VENDIDAS */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-navy sm:text-xl">Pinturas más vendidas Pintuco</h2>
            <p className="text-xs font-medium text-body">Líneas arquitectónicas e industriales con mayor demanda en Colombia</p>
          </div>
          <button
            onClick={() => navigate('/catalogo')}
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Ver todo el catálogo <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      </section>

      {/* TENDENCIAS */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold uppercase text-violet-700">
              Colección Tendencias 2026
            </span>
            <h2 className="mt-1 text-lg font-extrabold text-navy">Colores diseñados para transformar espacios</h2>
          </div>
          <button
            onClick={() => navigate('/simulador')}
            className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            Simular en paredes <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          {tendencias.map((c) => (
            <button
              key={c.codigo}
              onClick={() => navigate(`/simulador?color=${c.codigo}`)}
              className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-surface-muted p-3 text-left transition-colors hover:border-pink-300"
            >
              <span
                className="h-14 w-full rounded-lg border border-slate-200 transition-transform group-hover:scale-105"
                style={{ backgroundColor: c.hex }}
              />
              <span>
                <span className="block text-[9px] font-bold uppercase text-slate-400">{c.codigo}</span>
                <span className="block truncate text-xs font-bold text-navy">{c.nombre}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* RETIRO EN TIENDA */}
      <section className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-soft md:flex-row">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-primary">
            <Store size={24} />
          </span>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Retiro gratis en tienda y asesoría técnica en obra</h3>
            <p className="mt-1 max-w-xl text-xs text-body">
              Selecciona tu tienda en {CIUDADES_RETIRO}. Recoge tu pedido listo en 2 horas con mezcla de color
              computarizada y asesoría gratuita. Tu tienda actual:{' '}
              <strong className="text-navy">
                {puntoRetiro.nombre} ({puntoRetiro.ciudad})
              </strong>
              .
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/puntos-de-retiro')}
          className="w-full shrink-0 rounded-xl bg-primary px-4 py-2.5 text-center text-xs font-bold text-white shadow-soft transition-colors hover:bg-primary-dark md:w-auto"
        >
          Ver tiendas y horarios
        </button>
      </section>

      {comprarMateriales && productoProyecto && (
        <AgregarAlCarritoModal
          producto={productoProyecto}
          presentacionInicial="Cuñete 5 galones (18.9 L)"
          onCerrar={() => setComprarMateriales(false)}
        />
      )}
    </div>
  )
}
