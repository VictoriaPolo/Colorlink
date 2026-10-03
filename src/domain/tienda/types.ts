export type CategoriaProducto =
  | 'Impermeabilizantes'
  | 'Fachadas y exteriores'
  | 'Esmaltes y metales'
  | 'Interiores'

export type PatologiaKit =
  | 'Fachada exterior'
  | 'Humedad y moho'
  | 'Goteras y terrazas'
  | 'Metales oxidados'

export interface Producto {
  id: number
  nombre: string
  categoria: CategoriaProducto
  descripcion: string
  precio: number
  unidadMedida: string
  destacado: boolean
  badge: string | null
  /** m² cubiertos por galón (a 1 mano) -- varía por producto real, no es un valor fijo. */
  rendimientoM2PorGalon: number
}

export interface Kit {
  id: number
  patologia: PatologiaKit
  nombre: string
  descripcion: string
  componentes: string[]
  precioEstimado: number
  descuentoPct: number
}

export interface ItemCarrito {
  productoId: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

export interface Pedido {
  id: string
  clienteNombre: string
  clienteEmail: string
  items: ItemCarrito[]
  total: number
  estado: string
  fecha: string
}
