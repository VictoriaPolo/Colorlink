import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Clock, Copy, CreditCard, Download, Loader2, MapPin, MapPinned, Package, ShoppingCart } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Skeleton from '@/shared/ui/Skeleton'
import { useToast } from '@/shared/lib/toast'
import { useTitulo } from '@/shared/lib/useTitulo'
import { fechaConHora, fechaLarga, formatoCOP } from '@/shared/lib/formato'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/tienda/CartContext'
import { fotoProducto } from '@/features/tienda/fotosProducto'
import PagoChip from '@/features/pagos/PagoChip'
import SeguimientoPedido from '@/features/pagos/SeguimientoPedido'
import { ESTILO_PEDIDO } from '@/features/pagos/estadoPedido'
import { descargarComprobantePdf } from '@/features/pagos/comprobantePdf'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'
import { NOMBRE_METODO } from '@/domain/pagos/tipos'
import { pagoDe } from '@/domain/pagos/pasarela'
import { calcularTotales } from '@/domain/pagos/totales'
import type { Pedido } from '@/domain/tienda/types'

/** Cada cuánto se vuelve a preguntar por el pedido mientras la página está abierta. */
const SONDEO_MS = 15_000

/** El rastreo de un pedido, visto por el cliente: dónde va, cómo retirarlo, qué compró y cómo lo pagó. */
export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { repetirPedido } = useCart()
  const { mostrarToast } = useToast()
  const [busqueda, setBusqueda] = useSearchParams()
  useTitulo(id ? `Pedido ${id}` : 'Pedido')

  const [pedido, setPedido] = useState<Pedido | null>(null)
  const [cargando, setCargando] = useState(true)
  const [generandoPdf, setGenerandoPdf] = useState(false)
  // El aviso de "pedido confirmado" solo se ve al llegar desde el pago, no al recargar la página.
  const [recienPagado] = useState(() => busqueda.get('nuevo') === '1')

  useEffect(() => {
    if (recienPagado) setBusqueda({}, { replace: true })
  }, [recienPagado, setBusqueda])

  const correo = usuario?.email.toLowerCase()
  useEffect(() => {
    if (!id || !correo) return
    let vivo = true
    const cargar = () =>
      tiendaRepository
        .obtenerPedido(id)
        .then((encontrado) => {
          if (!vivo) return
          // Un pedido ajeno se ve igual que uno que no existe.
          setPedido(encontrado && encontrado.clienteEmail.toLowerCase() === correo ? encontrado : null)
        })
        .catch(() => {})
        .finally(() => vivo && setCargando(false))
    void cargar()
    // Cuando el equipo avanza el pedido, el cliente lo ve a los pocos segundos o al volver a la ventana.
    window.addEventListener('focus', cargar)
    const sondeo = window.setInterval(() => void cargar(), SONDEO_MS)
    return () => {
      vivo = false
      window.removeEventListener('focus', cargar)
      window.clearInterval(sondeo)
    }
  }, [id, correo])

  if (cargando) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8" role="status" aria-label="Cargando tu pedido">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
          <Package className="text-slate-300" size={40} aria-hidden="true" />
          <h1 className="text-lg font-extrabold text-navy">No encontramos ese pedido</h1>
          <p className="max-w-sm text-sm text-body">Puede que el código esté mal escrito o que el pedido sea de otra cuenta.</p>
          <Button onClick={() => navigate('/mis-solicitudes?seccion=pedidos')}>Ver mis pedidos</Button>
        </Card>
      </div>
    )
  }

  const pago = pagoDe(pedido)
  const totales = calcularTotales(pedido.items, pedido.descuento ?? 0)
  const punto = pedido.puntoRetiro ? puntosDeRetiro.find((p) => p.nombre === pedido.puntoRetiro) : undefined
  const cancelado = pedido.estado === 'Cancelado'
  const entregado = pedido.estado === 'Entregado'
  const listo = pedido.estado === 'Listo para retiro'
  const cantidad = pedido.items.reduce((suma, i) => suma + i.cantidad, 0)

  const descargarComprobante = async () => {
    setGenerandoPdf(true)
    try {
      await descargarComprobantePdf(pedido)
      mostrarToast('Descargamos tu comprobante.', 'success')
    } catch {
      mostrarToast('No pudimos generar el comprobante. Inténtalo de nuevo.', 'error')
    } finally {
      setGenerandoPdf(false)
    }
  }

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(pedido.codigoRetiro ?? '')
      mostrarToast('Copiamos tu código de retiro.', 'success')
    } catch {
      mostrarToast('No pudimos copiarlo: escríbelo tal como aparece.', 'info')
    }
  }

  const volverAComprar = () => {
    repetirPedido(pedido)
    navigate('/carrito')
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/mis-solicitudes?seccion=pedidos" className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Mis pedidos
      </Link>

      {recienPagado && !cancelado && (
        <div role="status" className="mb-6 flex animate-slide-up items-start gap-4 rounded-2xl border border-green-200 bg-green-50 p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-600 text-white" aria-hidden="true">
            <CheckCircle2 size={24} />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-green-900">{pago.estado === 'Pendiente' ? '¡Reservamos tu pedido!' : '¡Pago recibido, gracias!'}</h2>
            <p className="mt-0.5 text-sm text-green-800">
              {pago.estado === 'Pendiente'
                ? 'Lo pagas cuando lo retires en la tienda. '
                : 'Tu pago quedó aprobado y tu pedido ya está en marcha. '}
              Guarda tu código de retiro: lo vas a necesitar en la tienda.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Pedido {pedido.id}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {fechaLarga(pedido.fecha)} · {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${ESTILO_PEDIDO[pedido.estado] ?? ESTILO_PEDIDO.Recibido}`}>{pedido.estado}</span>
          <PagoChip estado={pago.estado} cliente />
        </div>
      </div>

      {/* En celular las dos columnas se mezclan (`contents`) y se ordenan: primero dónde va y el código de retiro, luego lo comprado y el pago. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <Card className="order-1 p-6">
            <h2 className="mb-5 flex items-center gap-2 text-base font-extrabold text-navy">
              <MapPinned size={18} className="text-primary" aria-hidden="true" /> ¿Dónde va tu pedido?
            </h2>
            <SeguimientoPedido pedido={pedido} />
          </Card>

          <Card className="order-3 p-6">
            <h2 className="mb-4 flex items-center gap-2 text-base font-extrabold text-navy">
              <Package size={18} className="text-primary" aria-hidden="true" /> Lo que pediste
            </h2>
            <ul className="divide-y divide-slate-100">
              {pedido.items.map((item) => (
                <li key={`${item.productoId}-${item.nombre}`} className="flex items-center gap-3 py-3 first:pt-0">
                  {item.productoId > 0 ? (
                    <img src={fotoProducto(item.productoId, 96, 96)} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-primary" aria-hidden="true">
                      <Package size={20} />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug font-semibold text-navy">{item.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {item.cantidad} × {formatoCOP.format(item.precioUnitario)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-navy tabular-nums">{formatoCOP.format(item.precioUnitario * item.cantidad)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-body">Subtotal</dt>
                <dd className="font-semibold text-navy tabular-nums">{formatoCOP.format(totales.subtotal)}</dd>
              </div>
              {totales.descuento > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>Descuento{pedido.cupon ? ` (${pedido.cupon})` : ''}</dt>
                  <dd className="font-semibold tabular-nums">− {formatoCOP.format(totales.descuento)}</dd>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400">
                <dt>Incluye IVA (19%)</dt>
                <dd className="tabular-nums">{formatoCOP.format(totales.ivaIncluido)}</dd>
              </div>
              <div className="mt-1 flex items-baseline justify-between border-t border-slate-100 pt-3">
                <dt className="text-sm font-bold text-navy">Total</dt>
                <dd className="text-xl font-extrabold text-primary tabular-nums">{formatoCOP.format(pedido.total)}</dd>
              </div>
            </dl>
          </Card>
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          {!cancelado && pedido.codigoRetiro && (
            <Card className={`order-2 p-5 ${listo ? 'ring-2 ring-accent' : ''}`}>
              <h2 className="flex items-center gap-2 text-base font-extrabold text-navy">
                <MapPin size={18} className="text-primary" aria-hidden="true" /> Retiro en tienda
              </h2>
              {entregado ? (
                <p className="mt-3 text-sm text-body">Ya retiraste este pedido. ¡Gracias por comprar en Colorlink!</p>
              ) : (
                <>
                  <p className="mt-1 text-xs text-slate-500">{listo ? '¡Tu pedido ya está listo! Muestra este código en la tienda.' : 'Muestra este código en la tienda cuando esté listo.'}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-navy px-4 py-3.5 text-white">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-white/60 uppercase">Código de retiro</p>
                      <p className="mt-0.5 font-mono text-2xl font-extrabold tracking-[0.25em]" aria-label={`Código de retiro: ${pedido.codigoRetiro.split('').join(' ')}`}>
                        {pedido.codigoRetiro}
                      </p>
                    </div>
                    <button
                      onClick={copiarCodigo}
                      className="rounded-lg p-2.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                      aria-label="Copiar código de retiro"
                      title="Copiar código"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </>
              )}
              <div className="mt-4 text-sm">
                <p className="font-bold text-navy">{punto?.nombre ?? pedido.puntoRetiro ?? 'Tienda por definir'}</p>
                {punto && (
                  <>
                    <p className="mt-0.5 text-body">
                      {punto.direccion} · {punto.ciudad}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock size={13} aria-hidden="true" /> {punto.horario}
                    </p>
                  </>
                )}
                <Link to="/puntos-de-retiro" className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">
                  Ver todas las tiendas
                </Link>
              </div>
            </Card>
          )}

          <Card className="order-4 p-5">
            <h2 className="flex items-center gap-2 text-base font-extrabold text-navy">
              <CreditCard size={18} className="text-primary" aria-hidden="true" /> Pago
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-body">Medio</dt>
                <dd className="text-right font-semibold text-navy">{NOMBRE_METODO[pago.metodo]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">Detalle</dt>
                <dd className="text-right font-semibold text-navy">{pago.detalle}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">Referencia</dt>
                <dd className="font-mono text-xs font-bold text-navy">{pago.referencia}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-body">{pago.estado === 'Pendiente' ? 'Registrado' : 'Fecha'}</dt>
                <dd className="text-right text-navy">{fechaConHora(pago.fecha)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2">
                <dt className="text-body">Estado</dt>
                <dd>
                  <PagoChip estado={pago.estado} cliente />
                </dd>
              </div>
            </dl>
            {pago.estado === 'Pendiente' && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Pagas <strong>{formatoCOP.format(pago.monto)}</strong> al retirar, con efectivo o datáfono.
              </p>
            )}
          </Card>

          <div className="order-5 flex flex-col gap-2.5">
            <Button
              variant="secondary"
              fullWidth
              disabled={generandoPdf}
              onClick={descargarComprobante}
              icon={generandoPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            >
              {generandoPdf ? 'Preparando comprobante…' : 'Descargar comprobante (PDF)'}
            </Button>
            <Button variant="secondary" fullWidth icon={<ShoppingCart size={16} />} onClick={volverAComprar}>
              Volver a comprar esto
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
