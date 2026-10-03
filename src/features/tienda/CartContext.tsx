import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ItemCarrito, Kit, Pedido, Producto } from '@/domain/tienda/types'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { readStorage, writeStorage, clearStorage } from '@/data/repositories/storage'

const STORAGE_KEY = 'colorlink:carrito'
const STORAGE_VERSION = 1

interface CartContextValue {
  items: ItemCarrito[]
  totalItems: number
  total: number
  agregarProducto: (producto: Producto, cantidad?: number) => void
  agregarKit: (kit: Kit) => void
  actualizarCantidad: (productoId: number, cantidad: number) => void
  quitarItem: (productoId: number) => void
  vaciarCarrito: () => void
  confirmarPedido: (clienteNombre: string, clienteEmail: string) => Promise<Pedido>
}

const CartContext = createContext<CartContextValue | null>(null)

/** Los kits se guardan en el carrito como un ítem con id negativo (-kit.id)
 * para no chocar con los ids reales de productos, que empiezan en 1. */
function idDeKit(kit: Kit): number {
  return -kit.id
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([])

  useEffect(() => {
    setItems(readStorage<ItemCarrito[]>(STORAGE_KEY, STORAGE_VERSION) ?? [])
  }, [])

  // Se escribe en localStorage directamente en cada acción (no con un efecto
  // reactivo sobre `items`): un efecto separado se dispara también en el
  // montaje con el `items` inicial (antes de que el efecto de carga de arriba
  // aplique el valor guardado) y lo pisa con [] — mismo motivo por el que
  // solicitudesRepository.local.ts guarda dentro de cada acción, no con un
  // useEffect sobre el estado completo.
  const actualizar = (nuevo: ItemCarrito[]) => {
    setItems(nuevo)
    writeStorage(STORAGE_KEY, STORAGE_VERSION, nuevo)
  }

  const agregarProducto = (producto: Producto, cantidad = 1) => {
    const existente = items.find((i) => i.productoId === producto.id)
    const nuevo = existente
      ? items.map((i) => (i.productoId === producto.id ? { ...i, cantidad: i.cantidad + cantidad } : i))
      : [...items, { productoId: producto.id, nombre: producto.nombre, precioUnitario: producto.precio, cantidad }]
    actualizar(nuevo)
  }

  const agregarKit = (kit: Kit) => {
    const id = idDeKit(kit)
    const precioConDescuento = Math.round(kit.precioEstimado * (1 - kit.descuentoPct / 100))
    const existente = items.find((i) => i.productoId === id)
    const nuevo = existente
      ? items.map((i) => (i.productoId === id ? { ...i, cantidad: i.cantidad + 1 } : i))
      : [...items, { productoId: id, nombre: `Kit: ${kit.nombre}`, precioUnitario: precioConDescuento, cantidad: 1 }]
    actualizar(nuevo)
  }

  const actualizarCantidad = (productoId: number, cantidad: number) => {
    if (cantidad <= 0) return quitarItem(productoId)
    actualizar(items.map((i) => (i.productoId === productoId ? { ...i, cantidad } : i)))
  }

  const quitarItem = (productoId: number) => {
    actualizar(items.filter((i) => i.productoId !== productoId))
  }

  const vaciarCarrito = () => {
    setItems([])
    clearStorage(STORAGE_KEY)
  }

  const confirmarPedido = async (clienteNombre: string, clienteEmail: string): Promise<Pedido> => {
    const pedido = await tiendaRepository.crearPedido(items, clienteNombre, clienteEmail)
    vaciarCarrito()
    return pedido
  }

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)
  const total = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)

  const value = useMemo(
    () => ({
      items,
      totalItems,
      total,
      agregarProducto,
      agregarKit,
      actualizarCantidad,
      quitarItem,
      vaciarCarrito,
      confirmarPedido,
    }),
    [items, totalItems, total],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
