import { formatoCOP } from '@/shared/lib/formato'

export interface Cupon {
  codigo: string
  descripcion: string
  tipo: 'porcentaje' | 'monto'
  valor: number
  /** Lo máximo que descuenta (solo en los de porcentaje). */
  tope?: number
  /** Desde cuánto de compra aplica. */
  minimo?: number
}

export const CUPONES: Cupon[] = [
  { codigo: 'BIENVENIDA10', descripcion: '10% menos en tu pedido (hasta $100.000)', tipo: 'porcentaje', valor: 10, tope: 100_000 },
  { codigo: 'COLOR5', descripcion: '5% menos en tu pedido', tipo: 'porcentaje', valor: 5 },
  { codigo: 'RETIRO20', descripcion: '$20.000 menos en pedidos desde $200.000', tipo: 'monto', valor: 20_000, minimo: 200_000 },
]

export type ResultadoCupon = { ok: true; cupon: Cupon; descuento: number } | { ok: false; motivo: string }

/** Revisa un código sobre el subtotal del carrito y dice cuánto descuenta, o por qué no aplica. */
export function aplicarCupon(codigo: string, subtotal: number): ResultadoCupon {
  const buscado = codigo.replace(/\s+/g, '').toUpperCase()
  if (!buscado) return { ok: false, motivo: 'Escribe el código del cupón.' }
  const cupon = CUPONES.find((c) => c.codigo === buscado)
  if (!cupon) return { ok: false, motivo: 'Ese cupón no existe. Revisa que esté bien escrito.' }
  if (cupon.minimo && subtotal < cupon.minimo) {
    return { ok: false, motivo: `Este cupón aplica en pedidos desde ${formatoCOP.format(cupon.minimo)}.` }
  }
  const bruto = cupon.tipo === 'porcentaje' ? Math.round((subtotal * cupon.valor) / 100) : cupon.valor
  const descuento = Math.min(bruto, cupon.tope ?? Infinity, subtotal)
  return { ok: true, cupon, descuento }
}
