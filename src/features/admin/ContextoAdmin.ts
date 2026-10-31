import { useOutletContext } from 'react-router-dom'
import type { Pedido } from '@/domain/tienda/types'

/** Lo que el contenedor de la consola comparte con sus páginas: los pedidos se cargan una sola vez. */
export interface ContextoAdmin {
  pedidos: Pedido[]
  cargandoPedidos: boolean
  cambiarEstadoPedido: (id: string, estado: string) => Promise<void>
  agregarNotaPedido: (id: string, texto: string) => Promise<void>
  /** Con qué nombre quedan firmadas las notas y asignaciones de quien está usando
   * la cuenta compartida del equipo — ver el selector en AdminLayout. */
  identidad: string
  cambiarIdentidad: (nombre: string) => void
}

export const useContextoAdmin = () => useOutletContext<ContextoAdmin>()
