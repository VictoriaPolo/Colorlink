import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Trash2, Minus, Plus, CheckCircle2 } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { useCart } from '@/features/tienda/CartContext'
import { useAuth } from '@/features/auth/AuthContext'
import { useToast } from '@/shared/lib/toast'
import type { Pedido } from '@/domain/tienda/types'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

export default function Carrito() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { items, total, actualizarCantidad, quitarItem, confirmarPedido } = useCart()
  const { mostrarToast } = useToast()
  const [email, setEmail] = useState(usuario?.email ?? '')
  const [enviando, setEnviando] = useState(false)
  const [pedidoConfirmado, setPedidoConfirmado] = useState<Pedido | null>(null)

  const handleConfirmar = async () => {
    setEnviando(true)
    try {
      const pedido = await confirmarPedido(usuario?.nombre ?? 'Cliente', email)
      setPedidoConfirmado(pedido)
    } catch {
      mostrarToast('No se pudo confirmar el pedido. Intenta de nuevo.', 'error')
    } finally {
      setEnviando(false)
    }
  }

  if (pedidoConfirmado) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 text-center sm:px-6 lg:px-8">
        <CheckCircle2 className="mx-auto mb-4 text-success" size={48} />
        <h1 className="text-2xl font-extrabold text-navy">¡Pedido confirmado!</h1>
        <p className="mt-2 text-body">
          Tu pedido <span className="font-semibold text-navy">{pedidoConfirmado.id}</span> por{' '}
          {formatoCOP.format(pedidoConfirmado.total)} fue recibido. Te contactaremos para coordinar el retiro.
        </p>
        <Button className="mt-6" onClick={() => navigate('/catalogo')}>
          Seguir comprando
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center gap-2.5">
        <ShoppingCart className="text-primary" size={22} />
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Tu carrito</h1>
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-14 text-center">
          <p className="text-sm text-slate-400">Tu carrito está vacío.</p>
          <Button onClick={() => navigate('/catalogo')}>Ir al catálogo</Button>
        </Card>
      ) : (
        <>
          <Card className="mb-6 divide-y divide-slate-50">
            {items.map((item) => (
              <div key={item.productoId} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-sm font-bold text-navy">{item.nombre}</p>
                  <p className="text-xs text-slate-400">{formatoCOP.format(item.precioUnitario)} c/u</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
                    <button
                      onClick={() => actualizarCantidad(item.productoId, item.cantidad - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-navy hover:bg-white"
                      aria-label="Restar"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold text-navy">{item.cantidad}</span>
                    <button
                      onClick={() => actualizarCantidad(item.productoId, item.cantidad + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-navy hover:bg-white"
                      aria-label="Sumar"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <p className="w-24 text-right text-sm font-bold text-navy">
                    {formatoCOP.format(item.precioUnitario * item.cantidad)}
                  </p>
                  <button
                    onClick={() => quitarItem(item.productoId)}
                    className="text-slate-300 hover:text-red-500"
                    aria-label={`Quitar ${item.nombre}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </Card>

          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
              <span className="text-sm font-semibold text-body">Total</span>
              <span className="text-2xl font-extrabold text-primary">{formatoCOP.format(total)}</span>
            </div>

            <FormField label="Correo para confirmación (opcional)">
              <input
                type="email"
                className={controlClass()}
                placeholder="tucorreo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <Button className="mt-5" size="lg" fullWidth disabled={enviando} onClick={handleConfirmar}>
              {enviando ? 'Confirmando...' : 'Confirmar pedido'}
            </Button>
            <p className="mt-2 text-center text-xs text-slate-400">
              Prototipo académico — no se procesa ningún pago real.
            </p>
          </Card>
        </>
      )}
    </div>
  )
}
