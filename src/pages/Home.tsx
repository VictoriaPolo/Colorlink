import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  ShoppingBag,
  Palette,
  Calculator,
  Package,
  Camera,
  FolderKanban,
  MapPin,
  Clock,
  ShieldCheck,
  ChevronRight,
  Store,
} from 'lucide-react'
import Button from '@/shared/ui/Button'
import Badge from '@/shared/ui/Badge'
import AbanicoColores from '@/shared/brand/AbanicoColores'
import FranjaColores from '@/shared/brand/FranjaColores'
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
    color: 'bg-primary text-white',
    to: '/catalogo',
  },
  {
    titulo: 'Encuentra tu Color',
    texto: 'Simulador de ambientes y carta de color 2026',
    badge: 'Visualizador en vivo',
    icon: Palette,
    color: 'bg-navy text-white',
    to: '/simulador',
  },
  {
    titulo: 'Kits de Solución',
    texto: 'Sistemas multicapa empaquetados con hasta 15% dcto',
    badge: 'Paquetes con descuento',
    icon: Package,
    color: 'bg-accent text-navy',
    to: '#kits',
  },
  {
    titulo: 'Calculadora de Metraje',
    texto: 'Calcula galones y cuñetes según tus m² exactos',
    badge: 'Cálculo preciso',
    icon: Calculator,
    color: 'bg-sky text-white',
    to: '/calculadora',
  },
]

/** Muestras del abanico y de la colección de tendencias: tonos de la carta que acompañan la marca. */
const CODIGOS_TENDENCIA = ['PNT-303', 'PNT-504', 'PNT-506', 'PNT-401', 'PNT-508', 'PNT-509']
const CODIGOS_ABANICO = ['PNT-304', 'PNT-303', 'PNT-302', 'PNT-401', 'PNT-506', 'PNT-504', 'PNT-208']
const colorPorCodigo = (codigo: string) => paletaColores.find((c) => c.codigo === codigo)!

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
  const tendencias = CODIGOS_TENDENCIA.map(colorPorCodigo)

  const irA = (to: string) =>
    to.startsWith('#') ? document.getElementById(to.slice(1))?.scrollIntoView({ behavior: 'smooth' }) : navigate(to)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-xl bg-navy text-white shadow-soft-lg">
        <FranjaColores className="h-1.5" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative grid items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="flex flex-col gap-4">
            <span className="inline-flex w-fit items-center rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase">
              Ecosistema digital Pintuco
            </span>
            <div>
              {nombre && <p className="text-sm font-semibold text-brand-200">Hola, {nombre}</p>}
              <h1 className="mt-1 text-3xl leading-[1.1] font-black tracking-tight sm:text-4xl lg:text-[2.6rem]">
                ¿Qué necesitas resolver con Pintuco hoy?
              </h1>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-brand-100">
              Sube una foto de tu pared, techo o piso y recibe un diagnóstico; compra pinturas originales, simula
              colores en vivo y calcula los galones exactos de tu espacio.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button variant="accent" icon={<Camera size={16} />} onClick={() => navigate('/solicitar')}>
                Diagnosticar con una foto
              </Button>
              <button
                onClick={() => navigate('/catalogo')}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                <ShoppingBag size={16} /> Comprar pinturas
              </button>
              <button
                onClick={() => navigate('/mis-solicitudes')}
                className="inline-flex items-center gap-2 px-2 py-2.5 text-sm font-semibold text-brand-200 transition-colors hover:text-white"
              >
                <FolderKanban size={16} /> Mis solicitudes
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <AbanicoColores
              colores={CODIGOS_ABANICO.map(colorPorCodigo)}
              onElegir={(c) => navigate(`/simulador?color=${c.codigo}`)}
            />
          </div>
        </div>
      </section>

      {/* ACCESOS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ACCESOS.map(({ titulo, texto, badge, icon: Icon, color, to }) => (
          <button
            key={titulo}
            onClick={() => irA(to)}
            className="group flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-lg"
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg shadow-soft transition-transform group-hover:scale-105 ${color}`}
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
        <section className="rounded-xl border border-brand-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="flex max-w-2xl flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-primary">
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
                  className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-2 text-center text-xs font-bold text-primary transition-colors hover:bg-brand-100"
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
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <span className="rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase">
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
              className="group flex flex-col gap-2 rounded-xl border border-slate-100 bg-surface-muted p-3 text-left transition-colors hover:border-brand-300"
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
      <section className="flex flex-col items-center justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-soft md:flex-row">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-primary">
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
          className="w-full shrink-0 rounded-lg bg-primary px-4 py-2.5 text-center text-xs font-bold text-white shadow-soft transition-colors hover:bg-primary-dark md:w-auto"
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
