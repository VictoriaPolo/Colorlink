import type { ReactNode } from 'react'
import { PaintBucket, ShieldCheck, Store } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { formatoCOP } from '@/shared/lib/formato'
import { fotoProducto } from '@/features/tienda/fotosProducto'
import type { Totales } from '@/domain/pagos/totales'
import type { ItemCarrito } from '@/domain/tienda/types'
import type { PuntoDeRetiro } from '@/data/puntosDeRetiro'

function Miniatura({ item }: { item: ItemCarrito }) {
  // Los kits tienen id negativo y no tienen foto propia.
  if (item.productoId > 0) {
    return <img src={fotoProducto(item.productoId, 96, 96)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-primary" aria-hidden="true">
      <PaintBucket size={22} />
    </span>
  )
}

/** El resumen de lo que se compra: productos (opcional), totales con el cupón y la tienda donde se retira. */
export default function ResumenPedido({
  totales,
  cupon,
  puntoRetiro,
  items,
  children,
  titulo = 'Resumen del pedido',
}: {
  totales: Totales
  cupon?: string | null
  puntoRetiro: PuntoDeRetiro
  items?: ItemCarrito[]
  /** Lo que va debajo de los totales (el cupón o el botón de continuar, por ejemplo). */
  children?: ReactNode
  titulo?: string
}) {
  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <h2 className="text-base font-extrabold text-navy">{titulo}</h2>

      {items && items.length > 0 && (
        <ul className="mt-4 flex max-h-64 flex-col gap-3 overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={`${item.productoId}-${item.nombre}`} className="flex items-center gap-3">
              <Miniatura item={item} />
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-xs leading-snug font-semibold text-navy">{item.nombre}</p>
                <p className="text-xs text-slate-400">
                  {item.cantidad} × {formatoCOP.format(item.precioUnitario)}
                </p>
              </div>
              <p className="shrink-0 text-xs font-bold text-navy tabular-nums">{formatoCOP.format(item.precioUnitario * item.cantidad)}</p>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-body">Subtotal</dt>
          <dd className="font-semibold text-navy tabular-nums">{formatoCOP.format(totales.subtotal)}</dd>
        </div>
        {totales.descuento > 0 && (
          <div className="flex justify-between text-green-700">
            <dt>Descuento{cupon ? ` (${cupon})` : ''}</dt>
            <dd className="font-semibold tabular-nums">− {formatoCOP.format(totales.descuento)}</dd>
          </div>
        )}
        <div className="flex justify-between text-xs text-slate-400">
          <dt>Incluye IVA (19%)</dt>
          <dd className="tabular-nums">{formatoCOP.format(totales.ivaIncluido)}</dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <dt className="text-sm font-bold text-navy">Total</dt>
          <dd className="text-2xl font-extrabold text-primary tabular-nums">{formatoCOP.format(totales.total)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-surface-muted p-3 text-xs text-body">
        <Store size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
        <span>
          Retiro en <strong className="text-navy">{puntoRetiro.nombre}</strong> ({puntoRetiro.ciudad}) · listo en 2 horas
        </span>
      </div>

      {children}

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck size={13} aria-hidden="true" /> Garantía directa de fábrica Pintuco
      </p>
    </Card>
  )
}
