import { Link } from 'react-router-dom'
import { MapPinned } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { formatoCOP, fechaLarga } from '@/shared/lib/formato'
import { pagoDe } from '@/domain/pagos/pasarela'
import type { Pedido } from '@/domain/tienda/types'
import PagoChip from './PagoChip'
import { ESTILO_PEDIDO, ETAPAS_PEDIDO, etapaDePedido } from './estadoPedido'

/** Un pedido en la lista del cliente: su estado, cómo va el pago, una barra de avance y el acceso al rastreo. */
export default function TarjetaPedido({ pedido }: { pedido: Pedido }) {
  const pago = pagoDe(pedido)
  const etapa = etapaDePedido(pedido.estado)
  const cancelado = pedido.estado === 'Cancelado'
  const cantidad = pedido.items.reduce((suma, i) => suma + i.cantidad, 0)

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/pedidos/${pedido.id}`} className="text-base font-extrabold text-navy hover:text-primary">
            {pedido.id}
          </Link>
          <p className="mt-0.5 text-xs text-slate-400">
            {fechaLarga(pedido.fecha)} · {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${ESTILO_PEDIDO[pedido.estado] ?? ESTILO_PEDIDO.Recibido}`}>{pedido.estado}</span>
          <PagoChip estado={pago.estado} cliente />
        </div>
      </div>

      {!cancelado && (
        <div className="mt-4" role="img" aria-label={`Avance del pedido: etapa ${etapa} de ${ETAPAS_PEDIDO.length}`}>
          <div className="grid grid-cols-4 gap-1.5">
            {ETAPAS_PEDIDO.map((e, i) => (
              <span key={e} className={`h-1.5 rounded-full ${i < etapa ? 'bg-primary' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-[10px] font-semibold text-slate-400">
            {ETAPAS_PEDIDO.map((e, i) => (
              <span key={e} className={i + 1 === etapa ? 'text-navy' : ''}>
                {e === 'En preparación' ? 'Preparando' : e === 'Listo para retiro' ? 'Listo' : e}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-lg font-extrabold text-primary tabular-nums">{formatoCOP.format(pedido.total)}</p>
        <Link
          to={`/pedidos/${pedido.id}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-white shadow-soft transition-colors hover:bg-primary-dark"
        >
          <MapPinned size={15} aria-hidden="true" /> {cancelado || pedido.estado === 'Entregado' ? 'Ver detalle' : 'Rastrear pedido'}
        </Link>
      </div>
    </Card>
  )
}
