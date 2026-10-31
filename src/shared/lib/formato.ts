export const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** '2026-10-30' (o una fecha con hora) → '30 oct'. */
export function fechaCorta(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return fecha
  return `${dia} ${MESES[mes - 1]}`
}

/** '2026-10-30T15:10:00Z' → '30 oct, 10:10 a. m.' (en la hora del navegador). */
export function fechaConHora(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return fechaCorta(iso)
  const hora = fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}, ${hora}`
}

const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

/** '2026-10-30' (o una fecha con hora) → '30 de octubre de 2026'. */
export function fechaLarga(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number)
  if (!anio || !mes || !dia) return fecha
  return `${dia} de ${MESES_LARGOS[mes - 1]} de ${anio}`
}
