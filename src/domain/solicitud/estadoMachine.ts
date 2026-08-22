import { ORDEN_ESTADOS, type EstadoSolicitud, type HistorialEstado, type Solicitud } from './types'

/**
 * Máquina de estados del ciclo de vida de una solicitud.
 * Solo permite avanzar un paso a la vez sobre ORDEN_ESTADOS (no se puede
 * saltar etapas ni retroceder) — modela el flujo real:
 * Necesidad → Solución técnica → Abastecimiento → Servicio → Calidad.
 */

export function siguienteEstado(actual: EstadoSolicitud): EstadoSolicitud | null {
  const index = ORDEN_ESTADOS.indexOf(actual)
  if (index === -1 || index === ORDEN_ESTADOS.length - 1) return null
  return ORDEN_ESTADOS[index + 1]
}

export function puedeTransicionar(actual: EstadoSolicitud, siguiente: EstadoSolicitud): boolean {
  return siguienteEstado(actual) === siguiente
}

export function estaFinalizada(estado: EstadoSolicitud): boolean {
  return estado === ORDEN_ESTADOS[ORDEN_ESTADOS.length - 1]
}

export function historialInicial(fecha: string): HistorialEstado[] {
  return [{ estado: ORDEN_ESTADOS[0], fecha }]
}

/**
 * Devuelve una nueva solicitud con el estado avanzado un paso, agregando
 * la transición al historial. No muta la solicitud original.
 * Si ya está en el último estado, la devuelve sin cambios.
 */
export function avanzarEstado(solicitud: Solicitud, fecha = new Date().toISOString().slice(0, 10)): Solicitud {
  const siguiente = siguienteEstado(solicitud.estado)
  if (!siguiente) return solicitud

  return {
    ...solicitud,
    estado: siguiente,
    historialEstados: [...solicitud.historialEstados, { estado: siguiente, fecha }],
  }
}

/** Índice (1-based) de la etapa del negocio (Necesidad..Calidad, 5 etapas)
 * correspondiente al estado actual — usado por ProcessTimeline. */
const ETAPA_POR_ESTADO: Record<EstadoSolicitud, number> = {
  Recibida: 1,
  'En análisis': 2,
  'Solución propuesta': 2,
  'En abastecimiento': 3,
  'Servicio programado': 4,
  Finalizada: 5,
}

export function etapaDelNegocio(estado: EstadoSolicitud): number {
  return ETAPA_POR_ESTADO[estado]
}
