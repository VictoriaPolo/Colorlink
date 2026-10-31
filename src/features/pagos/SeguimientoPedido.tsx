import { Check, CheckCheck, PaintBucket, ReceiptText, Store, XCircle, type LucideIcon } from 'lucide-react'
import { fechaConHora } from '@/shared/lib/formato'
import type { Pedido } from '@/domain/tienda/types'
import { ETAPAS_PEDIDO, etapaDePedido, horaEstimada } from './estadoPedido'

const PASOS: Record<(typeof ETAPAS_PEDIDO)[number], { titulo: string; detalle: string; Icono: LucideIcon }> = {
  Recibido: { titulo: 'Pedido recibido', detalle: 'Ya tenemos tu pedido y tu pago.', Icono: ReceiptText },
  'En preparación': { titulo: 'Preparando tu pedido', detalle: 'Estamos mezclando tus colores y alistando todo.', Icono: PaintBucket },
  'Listo para retiro': { titulo: 'Listo para retirar', detalle: 'Pasa por la tienda con tu código de retiro.', Icono: Store },
  Entregado: { titulo: 'Entregado', detalle: 'Retiraste tu pedido. ¡Que lo disfrutes!', Icono: CheckCheck },
}

/** Dónde va el pedido: cada etapa con la hora en que se cumplió, y la que está en curso resaltada. */
export default function SeguimientoPedido({ pedido }: { pedido: Pedido }) {
  const hora = (estado: string) => pedido.historial?.find((h) => h.estado === estado)?.fecha
  const actual = etapaDePedido(pedido.estado) // 0 si está cancelado
  const recibido = hora('Recibido') ?? pedido.pago?.fecha
  const estimada = actual > 0 && actual < 3 && recibido ? horaEstimada(recibido) : null

  if (pedido.estado === 'Cancelado') {
    const cancelado = hora('Cancelado')
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <XCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <div>
          <p className="font-bold">Este pedido fue cancelado</p>
          <p className="mt-0.5">
            {cancelado ? `Se canceló el ${fechaConHora(cancelado)}. ` : ''}Si ya habías pagado, el reembolso lo gestiona la tienda. Si tienes dudas, pregúntale a Coli o visita la tienda.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ol className="flex flex-col">
        {ETAPAS_PEDIDO.map((etapa, i) => {
          const numero = i + 1
          const hecha = numero < actual || (numero === actual && numero === ETAPAS_PEDIDO.length)
          const enCurso = numero === actual && !hecha
          const { titulo, detalle, Icono } = PASOS[etapa]
          const cuando = hora(etapa)
          return (
            <li key={etapa} className="flex gap-4" aria-current={enCurso ? 'step' : undefined}>
              <div className="flex flex-col items-center">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                    hecha ? 'bg-primary text-white' : enCurso ? 'animate-pulse-soft bg-accent text-navy ring-4 ring-accent/30' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {hecha ? <Check size={18} aria-hidden="true" /> : <Icono size={18} aria-hidden="true" />}
                </span>
                {i < ETAPAS_PEDIDO.length - 1 && <span className={`my-1 w-0.5 flex-1 ${hecha ? 'bg-primary' : 'bg-slate-200'}`} aria-hidden="true" />}
              </div>
              <div className={`min-w-0 pb-6 ${i === ETAPAS_PEDIDO.length - 1 ? 'pb-0' : ''}`}>
                <p className={`text-sm font-bold ${hecha || enCurso ? 'text-navy' : 'text-slate-400'}`}>
                  {titulo}
                  {enCurso && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 align-middle text-[10px] font-extrabold tracking-wide text-navy uppercase">Ahora</span>}
                </p>
                <p className={`text-xs ${hecha || enCurso ? 'text-body' : 'text-slate-400'}`}>{detalle}</p>
                {cuando && <p className="mt-0.5 text-xs font-semibold text-primary">{fechaConHora(cuando)}</p>}
              </div>
            </li>
          )
        })}
      </ol>
      {estimada && (
        <p className="mt-4 rounded-xl bg-brand-50 px-3.5 py-2.5 text-xs text-brand-800">
          Tu pedido estará listo hacia las <strong>{estimada}</strong> (2 horas después de recibirlo). Esta página se actualiza sola.
        </p>
      )}
    </div>
  )
}
