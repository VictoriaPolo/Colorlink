import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ShoppingCart, Stethoscope } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import type { Kit, PatologiaKit } from '@/domain/tienda/types'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { useCart } from './CartContext'
import { useToast } from '@/shared/lib/toast'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

/** Foto real por patología (Unsplash, licencia gratuita de uso comercial). */
const PATOLOGIAS: { valor: PatologiaKit; label: string; foto: string }[] = [
  { valor: 'Fachada exterior', label: '🏢 Fachadas con fisuras y humedad (85 m²)', foto: 'photo-1774977737078-7ccc2ac697e6' },
  { valor: 'Humedad y moho', label: '💧 Paredes con hongos y moho', foto: 'photo-1616488312210-d0298a0d1c25' },
  { valor: 'Goteras y terrazas', label: '🛡️ Goteras y terrazas transitables', foto: 'photo-1634853982486-c06f0e17940f' },
  { valor: 'Metales oxidados', label: '⚙️ Rejas y metales oxidados', foto: 'photo-1649106249286-961f6141df65' },
]

export default function KitSelector() {
  const [searchParams] = useSearchParams()
  // ?kit=<patología> llega desde las sugerencias del buscador del encabezado.
  const kitPedido = PATOLOGIAS.find((p) => p.valor === searchParams.get('kit'))?.valor
  const seccionRef = useRef<HTMLElement>(null)
  const [kits, setKits] = useState<Kit[]>([])
  const [cargando, setCargando] = useState(true)
  const [patologia, setPatologia] = useState<PatologiaKit>(kitPedido ?? 'Fachada exterior')
  const { agregarKit } = useCart()
  const { mostrarToast } = useToast()

  useEffect(() => {
    tiendaRepository.listarKits().then((data) => {
      setKits(data)
      setCargando(false)
    })
  }, [])

  useEffect(() => {
    if (kitPedido) seccionRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [kitPedido])

  const kitActivo = kits.find((k) => k.patologia === patologia)
  const foto = PATOLOGIAS.find((p) => p.valor === patologia)?.foto

  const handleAgregar = () => {
    if (!kitActivo) return
    agregarKit(kitActivo)
    mostrarToast(`${kitActivo.nombre} se agregó al carrito.`)
  }

  return (
    <section
      id="kits"
      ref={seccionRef}
      className="flex scroll-mt-40 flex-col gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-soft"
    >
      <div>
        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
          <Stethoscope size={16} /> Diagnóstico y solución inmediata
        </span>
        <h2 className="mt-1 text-lg font-extrabold text-navy sm:text-xl">¿Cuál es la patología o reto de tu superficie?</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PATOLOGIAS.map(({ valor, label }) => (
          <button
            key={valor}
            onClick={() => setPatologia(valor)}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold whitespace-nowrap transition-colors ${
              patologia === valor ? 'bg-primary text-white shadow-soft' : 'bg-slate-100 text-body hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {cargando ? (
        <SkeletonCardList count={1} />
      ) : kitActivo ? (
        <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-100 bg-surface-muted p-5 md:flex-row">
          <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl border border-slate-100 md:w-56">
            <img
              src={`https://images.unsplash.com/${foto}?auto=format&fit=crop&w=600&h=430&q=80`}
              alt={kitActivo.nombre}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex w-full flex-1 flex-col gap-3">
            <div>
              <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase text-amber-800">
                Solución técnica recomendada
              </span>
              <h3 className="mt-1 text-base font-extrabold text-navy">{kitActivo.nombre}</h3>
              <p className="mt-0.5 text-xs leading-relaxed text-body">{kitActivo.descripcion}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400">Productos del kit:</span>
              {kitActivo.componentes.map((c) => (
                <span key={c} className="rounded border border-pink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-primary">
                  ✓ {c}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-3">
              <div>
                <span className="block text-[10px] font-medium text-slate-400">
                  Inversión kit completo (-{kitActivo.descuentoPct}%):
                </span>
                <span className="text-lg font-extrabold text-primary">
                  {formatoCOP.format(Math.round(kitActivo.precioEstimado * (1 - kitActivo.descuentoPct / 100)))}
                </span>{' '}
                <span className="text-xs text-slate-400 line-through">{formatoCOP.format(kitActivo.precioEstimado)}</span>
              </div>
              <Button icon={<ShoppingCart size={15} />} onClick={handleAgregar}>
                Agregar kit al carrito
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
