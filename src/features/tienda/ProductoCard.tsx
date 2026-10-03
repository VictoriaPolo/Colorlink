import { ShoppingCart } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import type { CategoriaProducto, Producto } from '@/domain/tienda/types'
import { useCart } from './CartContext'
import { useToast } from '@/shared/lib/toast'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

// Foto real (Unsplash, licencia gratuita de uso comercial, sin atribución
// requerida — https://unsplash.com/photos/432f58d5fdba). Se reusa para todo
// el catálogo como imagen genérica de producto.
export const FOTO_PRODUCTO = 'https://images.unsplash.com/photo-1585676737728-432f58d5fdba?auto=format&fit=crop&w=400&h=280&q=80'

const COLOR_POR_CATEGORIA: Record<CategoriaProducto, string> = {
  Impermeabilizantes: '#a78bfa',
  'Fachadas y exteriores': '#ec4899',
  'Esmaltes y metales': '#64748b',
  Interiores: '#c026d3',
}

/** Tono representativo por producto (no por categoría) para que cada tarjeta
 * del catálogo se vea con un color distinto, en vez de repetir siempre la
 * misma foto genérica de lata sin variación. Se aplica como superposición
 * `mix-blend-mode: color` sobre la foto real (misma técnica que el simulador). */
const COLOR_POR_PRODUCTO: Record<number, string> = {
  1: '#F4C6D7', // Viniltex — rosa empolvado
  2: '#C2703D', // Koraza 5 Años — terracota fachada
  3: '#94A3B8', // Aquablock Fibratado — azul grisáceo impermeabilizante
  4: '#A34328', // Pintulux 3 en 1 — óxido/rojo teja
  5: '#D6C6A8', // Masilla Elastomérica — beige arena
  6: '#8B5A2B', // Madetec — marrón madera
  7: '#B8B8B8', // Vinilico Concreto — gris concreto
  8: '#C4B5FD', // Viniltex Multiuso — lila suave
}

export default function ProductoCard({ producto }: { producto: Producto }) {
  const { agregarProducto } = useCart()
  const { mostrarToast } = useToast()
  const colorMuestra = COLOR_POR_PRODUCTO[producto.id] ?? COLOR_POR_CATEGORIA[producto.categoria]

  const handleAgregar = () => {
    agregarProducto(producto)
    mostrarToast(`${producto.nombre} se agregó al carrito.`)
  }

  return (
    <Card className="flex flex-col gap-3 overflow-hidden p-0">
      <div className="relative h-32">
        <img src={FOTO_PRODUCTO} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ backgroundColor: colorMuestra, mixBlendMode: 'color' }} />
        <span
          className="absolute top-2.5 left-2.5 h-3 w-3 rounded-full border-2 border-white shadow-soft"
          style={{ backgroundColor: colorMuestra }}
          title={producto.categoria}
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 pt-0">
        {producto.badge && (
          <span className="w-fit rounded-full bg-fuchsia-50 px-2.5 py-1 text-[11px] font-semibold text-teal">
            {producto.badge}
          </span>
        )}
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{producto.categoria}</span>
        <h3 className="text-base font-bold text-navy">{producto.nombre}</h3>
        <p className="flex-1 text-sm text-body">{producto.descripcion}</p>
        <div>
          <span className="text-xs text-slate-400">Desde</span>
          <p className="text-lg font-extrabold text-primary">
            {formatoCOP.format(producto.precio)}{' '}
            <span className="text-xs font-normal text-slate-400">/ {producto.unidadMedida}</span>
          </p>
        </div>
        <Button size="md" fullWidth icon={<ShoppingCart size={16} />} onClick={handleAgregar}>
          Comprar
        </Button>
      </div>
    </Card>
  )
}
