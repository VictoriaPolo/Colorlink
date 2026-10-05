import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Palette, Building2, Sofa, BedDouble, Store, Search, Copy, ShoppingCart } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import AgregarAlCarritoModal from '@/features/tienda/AgregarAlCarritoModal'
import { useToast } from '@/shared/lib/toast'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { paletaColores, CATEGORIAS_COLOR, type CategoriaColor } from '@/data/paletaColores'
import type { Producto } from '@/domain/tienda/types'
import mascaraExterior from '@/assets/simulador/mascara-exterior.png'
import mascaraSala from '@/assets/simulador/mascara-sala.png'
import mascaraHabitacion from '@/assets/simulador/mascara-habitacion.png'
import mascaraOficina from '@/assets/simulador/mascara-oficina.png'

type Ambiente = 'exterior' | 'sala' | 'habitacion' | 'oficina'

interface Escena {
  label: string
  icon: typeof Building2
  foto: string
  alt: string
  /** PNG con alfa del mismo tamaño que la foto: opaco solo sobre pared
   * pintable, con bordes suavizados. Se generó midiendo los píxeles de ESTA
   * foto (contorno real de cada pared, sin techo/cielo, y recortando ventanas,
   * puertas, lámparas, repisas, letreros, tomas, etc.) -- no sirve para otra. */
  mascara: string
  /** Brillo que lleva el gris medio-alto de la pared a ~blanco, para que la
   * pintura se vea con su tono real y aun así conserve sombras y luz. */
  brillo: number
  descripcion: string
  productoRecomendado: string
}

// Fotos reales (Unsplash, licencia gratuita de uso comercial, sin atribución
// requerida).
const ESCENAS: Record<Ambiente, Escena> = {
  exterior: {
    label: 'Fachada Exterior',
    icon: Building2,
    foto: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?auto=format&fit=crop&w=1200&q=80',
    alt: 'Fachada de casa de referencia',
    mascara: mascaraExterior,
    brillo: 1.05,
    descripcion: 'Fachada exterior — concreto y revoque a la intemperie (Koraza 5 Años)',
    productoRecomendado: 'Koraza 5 Años Protección Total',
  },
  sala: {
    label: 'Sala & Muro Focal',
    icon: Sofa,
    foto: 'https://images.unsplash.com/photo-1724582586529-62622e50c0b3?auto=format&fit=crop&w=1200&q=80',
    alt: 'Sala moderna de referencia con muro focal',
    mascara: mascaraSala,
    brillo: 1.55,
    descripcion: 'Sala & muro focal — interior luz natural (Viniltex)',
    productoRecomendado: 'Viniltex',
  },
  habitacion: {
    label: 'Habitación Principal',
    icon: BedDouble,
    foto: 'https://images.unsplash.com/photo-1594286851359-8e5a51b36bba?auto=format&fit=crop&w=1200&q=80',
    alt: 'Habitación vacía de referencia',
    mascara: mascaraHabitacion,
    brillo: 1.2,
    descripcion: 'Habitación principal — ambiente de descanso y calidez',
    productoRecomendado: 'Viniltex',
  },
  oficina: {
    label: 'Oficina / Comercial',
    icon: Store,
    foto: 'https://images.unsplash.com/photo-1567880905822-56f8e06fe630?auto=format&fit=crop&w=1200&h=900&crop=top&q=80',
    alt: 'Espacio comercial de referencia',
    mascara: mascaraOficina,
    brillo: 1.1,
    descripcion: 'Oficina / comercial — espacios de trabajo modernos',
    productoRecomendado: 'Vinilico Concreto',
  },
}

export default function Simulador() {
  const [searchParams] = useSearchParams()
  const { mostrarToast } = useToast()
  const [ambiente, setAmbiente] = useState<Ambiente>('exterior')
  // ?color=PNT-501 llega desde las tendencias del panel.
  const [colorActivo, setColorActivo] = useState(
    () =>
      paletaColores.find((c) => c.codigo === searchParams.get('color')) ??
      paletaColores.find((c) => c.codigo === 'PNT-501') ??
      paletaColores[0],
  )
  const [categoria, setCategoria] = useState<CategoriaColor>(colorActivo.categoria)
  const [busqueda, setBusqueda] = useState('')
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoAComprar, setProductoAComprar] = useState<Producto | null>(null)
  const escena = ESCENAS[ambiente]

  useEffect(() => {
    tiendaRepository.listarProductos().then(setProductos)
  }, [])

  const colores = paletaColores.filter((c) => {
    if (c.categoria !== categoria) return false
    if (!busqueda.trim()) return true
    const q = busqueda.trim().toLowerCase()
    return c.nombre.toLowerCase().includes(q) || c.codigo.toLowerCase().includes(q)
  })

  const handleCopiar = () => {
    navigator.clipboard.writeText(colorActivo.codigo)
    mostrarToast(`Código de color ${colorActivo.codigo} copiado al portapapeles.`)
  }

  const handleComprar = () => {
    setProductoAComprar(productos.find((p) => p.nombre === escena.productoRecomendado) ?? null)
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-primary">
          <Palette size={24} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Encuentra y Simula tu Color Ideal</h1>
        <p className="mt-2 text-body">Prueba en vivo un tono sobre ambientes reales antes de pintar.</p>
      </div>

      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {(Object.keys(ESCENAS) as Ambiente[]).map((clave) => {
          const Icon = ESCENAS[clave].icon
          return (
            <button
              key={clave}
              onClick={() => setAmbiente(clave)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                ambiente === clave ? 'bg-primary text-white shadow-soft' : 'bg-white text-body border border-slate-200 hover:border-primary'
              }`}
            >
              <Icon size={16} /> {ESCENAS[clave].label}
            </button>
          )
        })}
      </div>

      <Card className="mb-6 overflow-hidden p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-xl">
          <img src={escena.foto} alt={escena.alt} className="block w-full" />
          {/* Pintura = color × luz de la pared (copia en gris de la foto, en
              modo multiply). Con mix-blend-mode: color la pared conservaba la
              luminosidad original, así que un tono oscuro sobre una pared
              blanca seguía viéndose casi blanco. */}
          <div
            className="absolute inset-0"
            style={{
              isolation: 'isolate',
              maskImage: `url(${escena.mascara})`,
              maskSize: '100% 100%',
              maskRepeat: 'no-repeat',
              WebkitMaskImage: `url(${escena.mascara})`,
              WebkitMaskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
            }}
          >
            <img
              src={escena.foto}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full"
              style={{ filter: `grayscale(1) brightness(${escena.brillo})` }}
            />
            <div
              className="absolute inset-0"
              style={{ backgroundColor: colorActivo.hex, mixBlendMode: 'multiply', transition: 'background-color 0.3s ease' }}
            />
          </div>

          <div className="absolute top-3 left-3 flex items-center gap-2.5 rounded-xl bg-navy/85 px-3 py-2 backdrop-blur-sm">
            <span
              className="h-9 w-9 shrink-0 rounded-full border-2 border-white/70"
              style={{ backgroundColor: colorActivo.hex }}
            />
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-white">{colorActivo.nombre}</span>
              <span className="text-[11px] text-white/70">
                {colorActivo.codigo} • {colorActivo.hex}
              </span>
            </span>
          </div>

          <div className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy shadow-soft">
            {escena.descripcion}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-fuchsia-50 p-4">
          <div className="flex items-center gap-3">
            <span
              className="h-14 w-14 shrink-0 rounded-xl border border-white shadow-soft"
              style={{ backgroundColor: colorActivo.hex }}
            />
            <div>
              <p className="text-xs text-slate-400">Pintura recomendada:</p>
              <p className="flex items-center gap-2 text-base font-extrabold text-navy">
                {colorActivo.nombre}
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-primary">
                  {colorActivo.codigo}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" icon={<Copy size={15} />} onClick={handleCopiar}>
              Copiar
            </Button>
            <Button icon={<ShoppingCart size={15} />} onClick={handleComprar}>
              Comprar Pintura
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="relative mb-4">
          <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={16} />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar color por nombre o código (ej. Nieve, 101)..."
            className="w-full rounded-xl border border-slate-200 py-2.5 pr-3.5 pl-10 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-pink-100"
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIAS_COLOR.map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                categoria === c ? 'bg-navy text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {colores.map((color) => (
            <button
              key={color.codigo}
              onClick={() => setColorActivo(color)}
              className={`overflow-hidden rounded-xl border-2 text-left transition-colors ${
                colorActivo.codigo === color.codigo ? 'border-primary' : 'border-slate-100 hover:border-pink-200'
              }`}
            >
              <span className="block h-14 w-full" style={{ backgroundColor: color.hex }} />
              <span className="block px-2.5 py-2">
                <span className="block text-[11px] text-slate-400">{color.codigo}</span>
                <span className="block text-sm font-semibold text-navy">{color.nombre}</span>
              </span>
            </button>
          ))}
          {colores.length === 0 && (
            <p className="col-span-full py-6 text-center text-sm text-slate-400">
              No se encontraron colores con esa búsqueda.
            </p>
          )}
        </div>
      </Card>

      {productoAComprar && (
        <AgregarAlCarritoModal
          producto={productoAComprar}
          color={colorActivo}
          onCerrar={() => setProductoAComprar(null)}
        />
      )}
    </div>
  )
}
