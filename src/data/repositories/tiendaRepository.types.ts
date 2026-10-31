import type { ItemCarrito, Kit, Pedido, Producto } from '@/domain/tienda/types'

/** Contrato común entre el catálogo de localStorage y el de Supabase —
 * mismo patrón que SolicitudesRepository. */
export interface TiendaRepository {
  listarProductos(): Promise<Producto[]>
  listarKits(): Promise<Kit[]>
  crearPedido(items: ItemCarrito[], clienteNombre: string, clienteEmail: string, puntoRetiro?: string): Promise<Pedido>
  listarPedidosPorEmail(clienteEmail: string): Promise<Pedido[]>
  /** Equipo: todos los pedidos, el más reciente primero. */
  listarPedidos(): Promise<Pedido[]>
  /** Equipo: un pedido por id. */
  obtenerPedido(id: string): Promise<Pedido | undefined>
  /** Equipo: cambia la etapa de un pedido. */
  actualizarEstadoPedido(id: string, estado: string): Promise<Pedido | undefined>
  /** Equipo: nota interna sobre un pedido, que el cliente no ve. */
  agregarNotaPedido(id: string, autor: string, texto: string): Promise<Pedido | undefined>
}
