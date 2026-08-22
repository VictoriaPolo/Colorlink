import type { EstadoSolicitud } from '@/domain/solicitud/types'

const estadoStyles: Record<EstadoSolicitud, string> = {
  Recibida: 'bg-slate-100 text-slate-600',
  'En análisis': 'bg-violet-100 text-violet-700',
  'Solución propuesta': 'bg-fuchsia-100 text-primary-dark',
  'En abastecimiento': 'bg-amber-100 text-amber-700',
  'Servicio programado': 'bg-pink-100 text-pink-700',
  Finalizada: 'bg-green-100 text-success',
}

export default function Badge({ estado }: { estado: EstadoSolicitud }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${estadoStyles[estado]}`}
    >
      {estado}
    </span>
  )
}
