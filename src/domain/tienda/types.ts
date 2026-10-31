import type { Pago } from '@/domain/pagos/tipos'

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

export type Presentacion = 'Galón (3.78 L)' | 'Cuñete 5 galones (18.9 L)'

export interface ItemCarrito {
  productoId: number
  nombre: string
  precioUnitario: number
  cantidad: number
}

/** Etapas por las que pasa un pedido, en orden; "Cancelado" puede ocurrir antes de entregarse. */
export const ESTADOS_PEDIDO = ['Recibido', 'En preparación', 'Listo para retiro', 'Entregado', 'Cancelado'] as const

export interface NotaPedido {
  id: string
  autor: string
  texto: string
  /** Fecha y hora ISO. */
  fecha: string
}

export interface Pedido {
  id: string
  clienteNombre: string
  clienteEmail: string
  items: ItemCarrito[]
  total: number
  estado: string
  fecha: string
  /** Dónde el cliente va a retirarlo — ver data/puntosDeRetiro.ts. */
  puntoRetiro?: string
  /** Cupón que se usó y cuánto descontó (el `total` ya viene descontado). */
  cupon?: string
  descuento?: number
  /** Cómo se pagó y en qué estado va el pago. Los pedidos de antes de los pagos no lo traen: ver `pagoDe`. */
  pago?: Pago
  /** Seis caracteres que la persona muestra en la tienda para retirar el pedido. */
  codigoRetiro?: string
  /** Cuándo pasó el pedido por cada etapa (fecha y hora ISO): es lo que se le muestra al cliente al rastrearlo. */
  historial?: { estado: string; fecha: string }[]
  /** Notas internas del equipo, igual que en las solicitudes. */
  notas?: NotaPedido[]
}
