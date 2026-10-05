import type { Producto } from './types'

/** Coincidencia por nombre, categoría o uso (descripción), sin distinguir mayúsculas. */
export function coincideConBusqueda(producto: Producto, texto: string): boolean {
  const q = texto.trim().toLowerCase()
  return [producto.nombre, producto.categoria, producto.descripcion].some((t) => t.toLowerCase().includes(q))
}
