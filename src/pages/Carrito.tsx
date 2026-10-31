import { Link, useNavigate } from 'react-router-dom'
import { Calculator, Camera, Lock, Minus, PaintBucket, Plus, ShoppingCart, Store, Trash2, Truck } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import { formatoCOP } from '@/shared/lib/formato'
import { useTitulo } from '@/shared/lib/useTitulo'
import { useCart } from '@/features/tienda/CartContext'
import { fotoProducto } from '@/features/tienda/fotosProducto'
import CuponCaja from '@/features/pagos/CuponCaja'
import ResumenPedido from '@/features/pagos/ResumenPedido'

export default function Carrito() {
  const navigate = useNavigate()
  const { items, totalItems, totales, cupon, puntoRetiro, actualizarCantidad, quitarItem, vaciarCarrito } = useCart()
  useTitulo('Tu carrito')

  if (items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <ShoppingCart size={30} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold text-navy">Tu carrito está vacío</h1>
            <p className="mt-1 text-sm text-body">Agrega pinturas, o deja que te digamos cuáles necesitas.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button icon={<PaintBucket size={17} />} onClick={() => navigate('/catalogo')}>
              Ir al catálogo
            </Button>
            <Button variant="secondary" icon={<Calculator size={17} />} onClick={() => navigate('/calculadora')}>
              Calcular cuánta pintura
            </Button>
            <Button variant="secondary" icon={<Camera size={17} />} onClick={() => navigate('/solicitar')}>
              Diagnóstico con foto
            </Button>
          </div>
          <p className="text-xs text-slate-400">
            ¿Ya compraste? Rastrea tus pedidos en{' '}
            <Link to="/mis-solicitudes?seccion=pedidos" className="font-semibold text-primary hover:underline">
              Mis pedidos
            </Link>
            .
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShoppingCart className="text-primary" size={24} aria-hidden="true" />
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Tu carrito</h1>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-primary">
            {totalItems} {totalItems === 1 ? 'producto' : 'productos'}
          </span>
        </div>
        <Link to="/catalogo" className="text-sm font-semibold text-primary hover:underline">
          Seguir comprando
        </Link>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="flex flex-col gap-3">
          <Card className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={`${item.productoId}-${item.nombre}`} className="flex flex-wrap items-center gap-4 p-4">
                {item.productoId > 0 ? (
                  <img src={fotoProducto(item.productoId, 120, 120)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-primary" aria-hidden="true">
                    <PaintBucket size={26} />
                  </span>
                )}
                <div className="min-w-0 flex-1 basis-48">
                  <p className="text-sm leading-snug font-bold text-navy">{item.nombre}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{formatoCOP.format(item.precioUnitario)} c/u</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                  <button
                    onClick={() => actualizarCantidad(item, item.cantidad - 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-navy transition-colors hover:bg-white"
                    aria-label={`Restar uno a ${item.nombre}`}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold text-navy tabular-nums" aria-live="polite">
                    {item.cantidad}
                  </span>
                  <button
                    onClick={() => actualizarCantidad(item, item.cantidad + 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-navy transition-colors hover:bg-white"
                    aria-label={`Sumar uno a ${item.nombre}`}
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="w-28 text-right text-sm font-extrabold text-navy tabular-nums">{formatoCOP.format(item.precioUnitario * item.cantidad)}</p>
                <button
                  onClick={() => quitarItem(item)}
                  className="rounded-lg p-2 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`Quitar ${item.nombre}`}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </Card>
          <button onClick={vaciarCarrito} className="self-start text-xs font-semibold text-slate-400 transition-colors hover:text-red-500">
            Vaciar el carrito
          </button>
        </div>

        <ResumenPedido totales={totales} cupon={cupon?.codigo} puntoRetiro={puntoRetiro}>
          <div className="mt-4">
            <CuponCaja />
          </div>
          <Button className="mt-5" variant="accent" size="lg" fullWidth icon={<Lock size={17} />} onClick={() => navigate('/pagar')}>
            Continuar al pago
          </Button>
          <ul className="mt-4 flex flex-col gap-1.5 text-xs text-slate-500">
            <li className="flex items-center gap-2">
              <Store size={14} className="text-primary" aria-hidden="true" /> Retiras en{' '}
              <button onClick={() => navigate('/puntos-de-retiro')} className="font-bold text-primary hover:underline">
                {puntoRetiro.ciudad}
              </button>
              , con tu color ya mezclado
            </li>
            <li className="flex items-center gap-2">
              <Truck size={14} className="text-primary" aria-hidden="true" /> Rastreas tu pedido paso a paso
            </li>
          </ul>
        </ResumenPedido>
      </div>
    </div>
  )
}
