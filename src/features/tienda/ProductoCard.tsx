import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import type { Producto } from '@/domain/tienda/types'
import AgregarAlCarritoModal from './AgregarAlCarritoModal'
import { fotoProducto } from './fotosProducto'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function ProductoCard({ producto }: { producto: Producto }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft transition-all hover:border-pink-200 hover:shadow-soft-lg">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img
          src={fotoProducto(producto.id, 600, 400)}
          alt={producto.nombre}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {producto.badge && (
          <span className="absolute top-2.5 left-2.5 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-soft">
            {producto.badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] font-bold uppercase text-primary">{producto.categoria}</span>
          <h3 className="line-clamp-1 text-sm font-bold text-navy">{producto.nombre}</h3>
          <p className="line-clamp-2 text-xs text-body">{producto.descripcion}</p>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="block text-[10px] text-slate-400">Desde</span>
            <span className="text-base font-extrabold text-primary">{formatoCOP.format(producto.precio)}</span>
          </div>
          <button
            onClick={() => setAbierto(true)}
            title="Agregar al carrito"
            aria-label={`Agregar ${producto.nombre} al carrito`}
            className="rounded-lg bg-primary p-2 text-white shadow-soft transition-colors hover:bg-primary-dark"
          >
            <ShoppingCart size={16} />
          </button>
        </div>
      </div>

      {abierto && <AgregarAlCarritoModal producto={producto} onCerrar={() => setAbierto(false)} />}
    </div>
  )
}
