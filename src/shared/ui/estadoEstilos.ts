import type { EstadoSolicitud } from '@/domain/solicitud/types'

/** Colores de cada estado de solicitud. Un solo lugar para que la insignia, los
 * filtros del cliente y el tablero del equipo usen exactamente los mismos. */
export const ESTILO_ESTADO: Record<EstadoSolicitud, { chip: string; punto: string; barra: string }> = {
  Recibida: { chip: 'bg-slate-100 text-slate-700', punto: 'bg-slate-400', barra: 'bg-slate-400' },
  'En análisis': { chip: 'bg-brand-100 text-brand-800', punto: 'bg-brand-500', barra: 'bg-brand-500' },
  'Solución propuesta': { chip: 'bg-indigo-100 text-indigo-800', punto: 'bg-indigo-500', barra: 'bg-indigo-500' },
  'En abastecimiento': { chip: 'bg-amber-100 text-amber-800', punto: 'bg-amber-500', barra: 'bg-amber-500' },
  'Servicio programado': { chip: 'bg-cyan-100 text-cyan-800', punto: 'bg-cyan-600', barra: 'bg-cyan-600' },
  Finalizada: { chip: 'bg-green-100 text-green-800', punto: 'bg-green-600', barra: 'bg-green-600' },
}
