import type { EstadoSolicitud } from '@/domain/solicitud/types'
import { ESTILO_ESTADO } from './estadoEstilos'

export default function Badge({ estado, cancelada }: { estado: EstadoSolicitud; cancelada?: boolean }) {
  if (cancelada) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold whitespace-nowrap text-red-700">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Cancelada
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${ESTILO_ESTADO[estado].chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${ESTILO_ESTADO[estado].punto}`} />
      {estado}
    </span>
  )
}
