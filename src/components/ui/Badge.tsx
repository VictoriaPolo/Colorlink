import type { EstadoSolicitud } from '../../types'

const estadoStyles: Record<EstadoSolicitud, string> = {
  Recibida: 'bg-slate-100 text-slate-600',
  'En análisis': 'bg-sky-100 text-sky-700',
  'Solución propuesta': 'bg-blue-100 text-primary-dark',
  'En abastecimiento': 'bg-amber-100 text-amber-700',
  'Servicio programado': 'bg-teal-100 text-teal-700',
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
