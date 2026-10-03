export type CondicionSuperficie = 'Sellada' | 'Revoque nuevo' | 'Concreto poroso'

/** Sustratos más porosos consumen más pintura por m² -- multiplicador sobre
 * el rendimiento base del producto. */
export const MULTIPLICADOR_CONDICION: Record<CondicionSuperficie, number> = {
  Sellada: 1,
  'Revoque nuevo': 1.25,
  'Concreto poroso': 1.35,
}

/** Galones exactos (con decimales, como "8.11") necesarios para cubrir un
 * área, según el rendimiento propio del producto, el estado de la superficie
 * y el número de manos. 0 si el área o el rendimiento no son válidos. */
export function calcularGalones(
  areaM2: number,
  rendimientoM2PorGalon: number,
  condicion: CondicionSuperficie = 'Sellada',
  manos = 2,
): number {
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return 0
  if (!Number.isFinite(rendimientoM2PorGalon) || rendimientoM2PorGalon <= 0) return 0
  const galones = (areaM2 * MULTIPLICADOR_CONDICION[condicion] * manos) / rendimientoM2PorGalon
  return Math.round(galones * 100) / 100
}

export interface Empaque {
  cunetes: number
  galonesSueltos: number
  precioCunete: number
  costoTotal: number
}

/**
 * Combina cuñetes de 5 galones + galones sueltos para cubrir `galonesNecesarios`,
 * priorizando cuñetes porque su precio por galón es menor (se asume 12% de
 * descuento mayorista sobre 5 galones sueltos, no hay un precio de cuñete real
 * en el catálogo).
 * ponytail: no evalúa si comprar un cuñete de más sale más barato que las
 * unidades sueltas del resto -- simplificación razonable para el alcance del
 * prototipo, ajustar si algún caso real lo requiere.
 */
export function calcularEmpaqueOptimo(galonesNecesarios: number, precioGalon: number): Empaque {
  const totalGalones = Math.ceil(galonesNecesarios)
  const precioCunete = Math.round(precioGalon * 5 * 0.88)
  const cunetes = Math.floor(totalGalones / 5)
  const galonesSueltos = totalGalones - cunetes * 5
  const costoTotal = cunetes * precioCunete + galonesSueltos * precioGalon
  return { cunetes, galonesSueltos, precioCunete, costoTotal }
}
