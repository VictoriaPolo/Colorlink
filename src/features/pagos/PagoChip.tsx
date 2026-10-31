import { BadgeCheck, Clock, RotateCcw, XCircle, type LucideIcon } from 'lucide-react'
import type { EstadoPago } from '@/domain/pagos/tipos'

const ESTILO: Record<EstadoPago, { chip: string; Icono: LucideIcon; etiqueta: string; etiquetaCliente: string }> = {
  Aprobado: { chip: 'bg-green-50 text-green-700 ring-green-600/25', Icono: BadgeCheck, etiqueta: 'Pagado', etiquetaCliente: 'Pago aprobado' },
  Pendiente: { chip: 'bg-amber-50 text-amber-800 ring-amber-600/30', Icono: Clock, etiqueta: 'Por cobrar', etiquetaCliente: 'Pagas al retirar' },
  Rechazado: { chip: 'bg-red-50 text-red-700 ring-red-600/25', Icono: XCircle, etiqueta: 'Rechazado', etiquetaCliente: 'Pago rechazado' },
  Reembolsado: { chip: 'bg-slate-100 text-slate-700 ring-slate-500/20', Icono: RotateCcw, etiqueta: 'Reembolsado', etiquetaCliente: 'Reembolsado' },
}

/** El estado de un pago como etiqueta: el equipo lo ve como "Pagado / Por cobrar", el cliente con sus propias palabras. */
export default function PagoChip({ estado, cliente = false }: { estado: EstadoPago; cliente?: boolean }) {
  const { chip, Icono, etiqueta, etiquetaCliente } = ESTILO[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ring-1 ring-inset ${chip}`}>
      <Icono size={13} aria-hidden="true" />
      {cliente ? etiquetaCliente : etiqueta}
    </span>
  )
}
