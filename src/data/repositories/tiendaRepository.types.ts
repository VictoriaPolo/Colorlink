import type { ItemCarrito, Kit, Pedido, Producto } from '@/domain/tienda/types'
import type { EstadoPago, Pago } from '@/domain/pagos/tipos'

/** Lo que acompaña a un pedido nuevo: cómo se pagó, el cupón y el código de retiro. */
export interface ExtrasPedido {
  pago?: Pago
  cupon?: string
  /** Cuánto descontó el cupón: el total del pedido es la suma de los productos menos esto. */
  descuento?: number
  /** Si no se da, el repositorio genera uno. */
  codigoRetiro?: string
}

/** Contrato común entre el catálogo de localStorage y el de Supabase —
 * mismo patrón que SolicitudesRepository. */
export interface TiendaRepository {
  listarProductos(): Promise<Producto[]>
  listarKits(): Promise<Kit[]>
  crearPedido(
    items: ItemCarrito[],
    clienteNombre: string,
    clienteEmail: string,
    puntoRetiro?: string,
    extras?: ExtrasPedido,
  ): Promise<Pedido>
  listarPedidosPorEmail(clienteEmail: string): Promise<Pedido[]>
  /** Equipo: todos los pedidos, el más reciente primero. */
  listarPedidos(): Promise<Pedido[]>
  /** Equipo: un pedido por id. */
  obtenerPedido(id: string): Promise<Pedido | undefined>
  /** Equipo: cambia la etapa de un pedido. */
  actualizarEstadoPedido(id: string, estado: string): Promise<Pedido | undefined>
  /** Equipo: cambia el estado del pago (cobrar un pedido que se paga al retirar, o registrar un reembolso). */
  actualizarPagoPedido(id: string, estado: EstadoPago): Promise<Pedido | undefined>
  /** Equipo: nota interna sobre un pedido, que el cliente no ve. */
  agregarNotaPedido(id: string, autor: string, texto: string): Promise<Pedido | undefined>
}
