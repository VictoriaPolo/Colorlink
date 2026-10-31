import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/AuthContext'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import type { Pedido } from '@/domain/tienda/types'

/** El pedido más reciente del cliente que todavía no se entrega ni se cancela, para rastrearlo desde cualquier página. */
export function usePedidoActivo(): Pedido | null {
  const { usuario } = useAuth()
  // Al cambiar de página se vuelve a mirar: así el pedido recién pagado aparece en la cabecera sin esperar al sondeo.
  const { pathname } = useLocation()
  // Se guarda con el correo de quien lo pidió: si cambia la sesión, no se le muestra a otra persona el pedido de la anterior.
  const [guardado, setGuardado] = useState<{ correo: string; pedido: Pedido | null } | null>(null)
  const correo = usuario?.rol === 'cliente' ? usuario.email : null

  useEffect(() => {
    if (!correo) return
    let vivo = true
    const cargar = () =>
      tiendaRepository
        .listarPedidosPorEmail(correo)
        .then((lista) => vivo && setGuardado({ correo, pedido: lista.find((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado') ?? null }))
        .catch(() => {})
    void cargar()
    // Cuando el equipo avanza el pedido, el cliente lo ve al volver a la ventana o a los pocos segundos.
    window.addEventListener('focus', cargar)
    const sondeo = window.setInterval(() => void cargar(), 30_000)
    return () => {
      vivo = false
      window.removeEventListener('focus', cargar)
      window.clearInterval(sondeo)
    }
  }, [correo, pathname])

  return correo && guardado?.correo === correo ? guardado.pedido : null
}
