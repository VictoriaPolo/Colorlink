export const IVA = 0.19

export interface Totales {
  subtotal: number
  descuento: number
  total: number
  /** Cuánto del total es IVA: los precios del catálogo ya lo incluyen. */
  ivaIncluido: number
}

export function calcularTotales(items: { precioUnitario: number; cantidad: number }[], descuento = 0): Totales {
  const subtotal = items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0)
  const aplicado = Math.min(Math.max(0, Math.round(descuento)), subtotal)
  const total = subtotal - aplicado
  return { subtotal, descuento: aplicado, total, ivaIncluido: Math.round(total - total / (1 + IVA)) }
}
