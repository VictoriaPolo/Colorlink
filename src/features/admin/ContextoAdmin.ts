import { useOutletContext } from 'react-router-dom'
import type { Pedido } from '@/domain/tienda/types'

/** Lo que el contenedor de la consola comparte con sus páginas: los pedidos se cargan una sola vez. */
export interface ContextoAdmin {
  pedidos: Pedido[]
  cargandoPedidos: boolean
  cambiarEstadoPedido: (id: string, estado: string) => Promise<void>
}

export const useContextoAdmin = () => useOutletContext<ContextoAdmin>()
