import { useEffect, useRef, useState } from 'react'
import { Minus, Plus, ShoppingCart, X } from 'lucide-react'
import Button from '@/shared/ui/Button'
import type { Presentacion, Producto } from '@/domain/tienda/types'
import { PRESENTACIONES, precioPresentacion } from '@/domain/tienda/calculadora'
import type { ColorPaleta } from '@/data/paletaColores'
import { useCart } from './CartContext'
import { useToast } from '@/shared/lib/toast'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

interface Props {
  producto: Producto
  onCerrar: () => void
  presentacionInicial?: Presentacion
  /** Color ya elegido (ej. en el simulador): se muestra y queda en la línea del pedido. */
  color?: ColorPaleta
}

/** El padre lo monta solo mientras está abierto, así cada apertura arranca
 * con su estado inicial. <dialog> nativo: fondo, Esc y foco sin librería. */
export default function AgregarAlCarritoModal({
  producto,
  onCerrar,
  presentacionInicial = 'Galón (3.78 L)',
  color,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const { agregarProducto } = useCart()
  const { mostrarToast } = useToast()
  const [presentacion, setPresentacion] = useState(presentacionInicial)
  const [cantidad, setCantidad] = useState(1)

  useEffect(() => {
    // StrictMode corre el efecto dos veces: sin el guard, el segundo
    // showModal() fallaría con el diálogo ya abierto.
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  const handleAgregar = () => {
    agregarProducto(producto, cantidad, presentacion, color)
    mostrarToast(`${producto.nombre} se agregó al carrito.`)
    onCerrar()
  }

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-body shadow-soft-lg backdrop:bg-navy/40"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
        <h2 className="text-base font-extrabold text-navy">{producto.nombre}</h2>
        <button
          onClick={onCerrar}
          className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-navy"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5">
        {color && (
          <p className="flex items-center gap-2 text-xs">
            <span className="h-5 w-5 shrink-0 rounded-full border border-slate-300" style={{ backgroundColor: color.hex }} />
            Color: <strong className="text-navy">{color.nombre}</strong> ({color.codigo})
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-navy">Presentación:</span>
          {PRESENTACIONES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPresentacion(p)}
              className={`flex items-center justify-between rounded-lg border p-2.5 text-left text-xs transition-colors ${
                presentacion === p
                  ? 'border-primary bg-brand-50 font-bold text-primary ring-1 ring-primary'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{p}</span>
              <span className="font-extrabold">{formatoCOP.format(precioPresentacion(producto.precio, p))}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              className="px-3 py-2.5 text-navy hover:bg-slate-100"
              aria-label="Menos"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-sm font-bold text-navy">{cantidad}</span>
            <button
              type="button"
              onClick={() => setCantidad((c) => Math.min(999, c + 1))}
              className="px-3 py-2.5 text-navy hover:bg-slate-100"
              aria-label="Más"
            >
              <Plus size={14} />
            </button>
          </div>
          <Button className="flex-1" icon={<ShoppingCart size={16} />} onClick={handleAgregar}>
            Agregar al carrito
          </Button>
        </div>
      </div>
    </dialog>
  )
}
