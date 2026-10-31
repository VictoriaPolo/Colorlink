import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CreditCard, KeyRound, MapPin, NotebookPen, Package } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Avatar from '@/shared/ui/Avatar'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import { controlClass } from '@/shared/ui/FormField'
import { fechaConHora, fechaCorta, formatoCOP } from '@/shared/lib/formato'
import { useContextoAdmin } from '@/features/admin/ContextoAdmin'
import PagoChip from '@/features/pagos/PagoChip'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'
import { NOMBRE_METODO } from '@/domain/pagos/tipos'
import { pagoDe } from '@/domain/pagos/pasarela'
import { ESTADOS_PEDIDO, type Pedido } from '@/domain/tienda/types'

export default function AdminPedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const { pedidos, cambiarEstadoPedido, registrarPagoPedido, agregarNotaPedido } = useContextoAdmin()
  const [pedido, setPedido] = useState<Pedido | undefined | null>(null)
  const [nota, setNota] = useState('')
  const [guardandoNota, setGuardandoNota] = useState(false)
  const [confirmandoReembolso, setConfirmandoReembolso] = useState(false)
  const [actualizandoPago, setActualizandoPago] = useState(false)

  // Se busca primero en lo que ya cargó la consola (ContextoAdmin) para
  // reflejar cambios de estado al instante; si no está ahí (entrada directa
  // por URL), se pide al repositorio.
  useEffect(() => {
    if (!id) return
    const enContexto = pedidos.find((p) => p.id === id)
    if (enContexto) {
      setPedido(enContexto)
      return
    }
    let vivo = true
    tiendaRepository.obtenerPedido(id).then((p) => vivo && setPedido(p ?? undefined))
    return () => {
      vivo = false
    }
  }, [id, pedidos])

  if (pedido === null) return <SkeletonCardList count={2} />

  if (!pedido) {
    return (
      <div className="py-16 text-center">
        <p className="text-body">No encontramos ese pedido.</p>
        <Link to="/admin/pedidos" className="mt-4 inline-block font-semibold text-primary hover:underline">
          Volver a pedidos
        </Link>
      </div>
    )
  }

  const punto = pedido.puntoRetiro ? puntosDeRetiro.find((p) => p.nombre === pedido.puntoRetiro) : undefined
  const notas = [...(pedido.notas ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))
  const pago = pagoDe(pedido)
  const cancelado = pedido.estado === 'Cancelado'
  // Un pedido que ya se entregó con el pago pendiente, o uno cancelado que ya estaba pagado, deja una tarea para el equipo.
  const pendienteDeCobro = pago.estado === 'Pendiente' && pedido.estado === 'Entregado'
  const pendienteDeReembolso = pago.estado === 'Aprobado' && cancelado

  const cambiarPago = async (estado: 'Aprobado' | 'Reembolsado') => {
    setActualizandoPago(true)
    await registrarPagoPedido(pedido.id, estado)
    setActualizandoPago(false)
    setConfirmandoReembolso(false)
  }

  const agregarNota = async (e: FormEvent) => {
    e.preventDefault()
    if (!nota.trim()) return
    setGuardandoNota(true)
    await agregarNotaPedido(pedido.id, nota)
    setNota('')
    setGuardandoNota(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/admin/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          <ArrowLeft size={16} /> Pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">{pedido.id}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {pedido.clienteNombre} · {fechaCorta(pedido.fecha)}
            </p>
          </div>
          <select
            aria-label="Estado del pedido"
            value={pedido.estado}
            onChange={(e) => cambiarEstadoPedido(pedido.id, e.target.value)}
            className={controlClass(false)}
          >
            {ESTADOS_PEDIDO.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
              <Package size={17} /> Productos
            </h2>
            <ul className="flex flex-col divide-y divide-slate-100">
              {pedido.items.map((item, i) => (
                <li key={`${item.productoId}-${i}`} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-navy">{item.nombre}</p>
                    <p className="text-xs text-slate-400">
                      {item.cantidad} × {formatoCOP.format(item.precioUnitario)}
                    </p>
                  </div>
                  <p className="shrink-0 font-bold text-navy tabular-nums">{formatoCOP.format(item.precioUnitario * item.cantidad)}</p>
                </li>
              ))}
            </ul>
            {!!pedido.descuento && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-green-700">
                <span>Descuento{pedido.cupon ? ` (cupón ${pedido.cupon})` : ''}</span>
                <span className="font-semibold tabular-nums">− {formatoCOP.format(pedido.descuento)}</span>
              </div>
            )}
            <div className={`${pedido.descuento ? 'mt-2' : 'mt-3 border-t border-slate-100 pt-3'} flex items-center justify-between`}>
              <span className="text-sm font-bold text-navy">Total</span>
              <span className="text-lg font-extrabold text-navy tabular-nums">{formatoCOP.format(pedido.total)}</span>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
              <MapPin size={17} /> Punto de retiro
            </h2>
            {punto ? (
              <div className="text-sm">
                <p className="font-semibold text-navy">{punto.nombre}</p>
                <p className="mt-0.5 text-body">
                  {punto.direccion} · {punto.ciudad}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">{punto.horario}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">No se guardó un punto de retiro para este pedido.</p>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-6">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
              <CreditCard size={17} /> Pago
            </h2>
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-500">Estado</dt>
                <dd>
                  <PagoChip estado={pago.estado} />
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Medio</dt>
                <dd className="text-right font-semibold text-navy">{NOMBRE_METODO[pago.metodo]}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Detalle</dt>
                <dd className="text-right text-navy">{pago.detalle}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Referencia</dt>
                <dd className="font-mono text-xs font-bold text-navy">{pago.referencia}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Monto</dt>
                <dd className="font-bold text-navy tabular-nums">{formatoCOP.format(pago.monto)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">Actualizado</dt>
                <dd className="text-right text-navy">{fechaConHora(pago.fecha)}</dd>
              </div>
            </dl>

            {(pendienteDeCobro || pendienteDeReembolso) && (
              <p role="status" className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                {pendienteDeCobro
                  ? 'El pedido ya se entregó y su pago sigue pendiente: márcalo como cobrado.'
                  : 'El pedido se canceló y su pago estaba aprobado: registra el reembolso.'}
              </p>
            )}

            {pago.estado === 'Pendiente' && !cancelado && (
              <Button className="mt-4" size="sm" fullWidth disabled={actualizandoPago} onClick={() => cambiarPago('Aprobado')}>
                {actualizandoPago ? 'Guardando…' : 'Marcar como cobrado'}
              </Button>
            )}
            {pago.estado === 'Aprobado' &&
              (confirmandoReembolso ? (
                <div className="mt-4 rounded-lg border border-slate-200 p-3">
                  <p className="text-xs text-body">
                    ¿Registrar el reembolso de <strong className="text-navy">{formatoCOP.format(pago.monto)}</strong>? Esto solo lo deja anotado: la devolución del dinero se gestiona aparte.
                  </p>
                  <div className="mt-2.5 flex gap-2">
                    <Button size="sm" variant="secondary" disabled={actualizandoPago} onClick={() => setConfirmandoReembolso(false)}>
                      No
                    </Button>
                    <Button size="sm" disabled={actualizandoPago} onClick={() => cambiarPago('Reembolsado')}>
                      {actualizandoPago ? 'Guardando…' : 'Sí, registrar'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-4" size="sm" variant={pendienteDeReembolso ? 'primary' : 'secondary'} fullWidth onClick={() => setConfirmandoReembolso(true)}>
                  Registrar reembolso
                </Button>
              ))}
          </Card>

          {pedido.codigoRetiro && !cancelado && (
            <Card className="p-5">
              <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-navy">
                <KeyRound size={17} /> Código de retiro
              </h2>
              <p className="mb-3 text-xs text-slate-400">El cliente lo muestra en la tienda: compáralo antes de entregar.</p>
              <p className="rounded-lg bg-navy py-2.5 text-center font-mono text-2xl font-extrabold tracking-[0.25em] text-white">{pedido.codigoRetiro}</p>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-4 text-base font-bold text-navy">Cliente</h2>
            <div className="flex items-center gap-3">
              <Avatar nombre={pedido.clienteNombre} className="h-10 w-10 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-navy">{pedido.clienteNombre}</p>
                <p className="truncate text-xs text-slate-400">{pedido.clienteEmail || 'Sin correo'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <NotebookPen size={17} /> Notas internas
            </h2>
            <p className="mt-0.5 mb-4 text-xs text-slate-400">Solo las ve el equipo, no el cliente.</p>
            {notas.length === 0 ? (
              <p className="mb-4 rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-400">Todavía no hay notas.</p>
            ) : (
              <ul className="mb-4 flex flex-col gap-4">
                {notas.map((n) => (
                  <li key={n.id} className="flex items-start gap-3">
                    <Avatar nombre={n.autor} className="h-8 w-8 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-400">
                        <span className="font-semibold text-navy">{n.autor}</span> · {fechaConHora(n.fecha)}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-body">{n.texto}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={agregarNota} className="flex flex-col gap-2.5">
              <label>
                <span className="sr-only">Nueva nota</span>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  placeholder="Qué se habló, qué falta, qué sigue…"
                  className={`${controlClass(false)} min-h-20 resize-y`}
                />
              </label>
              <Button type="submit" size="sm" disabled={!nota.trim() || guardandoNota}>
                {guardandoNota ? 'Guardando…' : 'Agregar nota'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  )
}
