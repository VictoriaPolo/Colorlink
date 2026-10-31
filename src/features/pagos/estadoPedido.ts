/** Las etapas por las que pasa un pedido hasta que se retira, en orden ("Cancelado" es aparte). */
export const ETAPAS_PEDIDO = ['Recibido', 'En preparación', 'Listo para retiro', 'Entregado'] as const

/** Colores de cada estado del pedido, los mismos de la consola del equipo. */
export const ESTILO_PEDIDO: Record<string, string> = {
  Recibido: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  'En preparación': 'bg-amber-50 text-amber-800 ring-amber-600/30',
  'Listo para retiro': 'bg-cyan-50 text-cyan-800 ring-cyan-600/30',
  Entregado: 'bg-green-50 text-green-700 ring-green-600/25',
  Cancelado: 'bg-red-50 text-red-700 ring-red-600/25',
}

/** El estado en una o dos palabras, para los espacios chicos (la cabecera). */
export const ETIQUETA_CORTA: Record<string, string> = {
  Recibido: 'Recibido',
  'En preparación': 'Preparando',
  'Listo para retiro': '¡Listo!',
  Entregado: 'Entregado',
  Cancelado: 'Cancelado',
}

/** Cuántas etapas lleva el pedido (0 a 4); un pedido cancelado no avanza. */
export const etapaDePedido = (estado: string) => ETAPAS_PEDIDO.indexOf(estado as (typeof ETAPAS_PEDIDO)[number]) + 1

/** Hora a la que debería estar listo: dos horas después de recibido. */
export function horaEstimada(recibidoISO: string): string | null {
  const recibido = Date.parse(recibidoISO)
  if (Number.isNaN(recibido)) return null
  return new Date(recibido + 2 * 3_600_000).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
}
