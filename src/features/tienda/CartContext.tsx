import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { ItemCarrito, Kit, Pedido, Presentacion, Producto } from '@/domain/tienda/types'
import type { Pago } from '@/domain/pagos/tipos'
import { aplicarCupon as evaluarCupon, type Cupon, type ResultadoCupon } from '@/domain/pagos/cupones'
import { calcularTotales, type Totales } from '@/domain/pagos/totales'
import { precioPresentacion } from '@/domain/tienda/calculadora'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { readStorage, writeStorage, clearStorage } from '@/data/repositories/storage'
import { puntosDeRetiro, type PuntoDeRetiro } from '@/data/puntosDeRetiro'
import type { ColorPaleta } from '@/data/paletaColores'

const STORAGE_KEY = 'colorlink:carrito'
const STORAGE_VERSION = 1
const PUNTO_KEY = 'colorlink:punto-retiro'
const CUPON_KEY = 'colorlink:cupon'

interface CartContextValue {
  items: ItemCarrito[]
  totalItems: number
  /** Lo que valen los productos, antes de cualquier cupón. */
  subtotal: number
  /** Lo que se paga: el subtotal menos el cupón. */
  total: number
  /** Subtotal, descuento, total y el IVA que ya trae el precio. */
  totales: Totales
  /** El cupón aplicado, mientras el carrito siga cumpliendo sus condiciones. */
  cupon: Cupon | null
  aplicarCupon: (codigo: string) => ResultadoCupon
  quitarCupon: () => void
  agregarProducto: (producto: Producto, cantidad?: number, presentacion?: Presentacion, color?: ColorPaleta) => void
  agregarKit: (kit: Kit) => void
  actualizarCantidad: (item: ItemCarrito, cantidad: number) => void
  quitarItem: (item: ItemCarrito) => void
  vaciarCarrito: () => void
  /** Vuelve a poner en el carrito lo que se compró en un pedido anterior. */
  repetirPedido: (pedido: Pedido) => void
  /** Crea el pedido con su pago (aprobado, o pendiente si se paga al retirar) y vacía el carrito. */
  confirmarPedido: (clienteNombre: string, clienteEmail: string, pago: Pago) => Promise<Pedido>
  puntoRetiro: PuntoDeRetiro
  elegirPuntoRetiro: (punto: PuntoDeRetiro) => void
}

const CartContext = createContext<CartContextValue | null>(null)

/** Los kits se guardan en el carrito como un ítem con id negativo (-kit.id)
 * para no chocar con los ids reales de productos, que empiezan en 1. */
function idDeKit(kit: Kit): number {
  return -kit.id
}

/** El nombre de la línea lleva la presentación y el color: así el pedido
 * guardado dice exactamente qué preparar, y el mismo producto en otra
 * presentación o color queda como una línea aparte. */
function nombreLinea(producto: Producto, presentacion: Presentacion, color?: ColorPaleta): string {
  const partes = [producto.nombre, presentacion]
  if (color) partes.push(`${color.nombre} (${color.codigo})`)
  return partes.join(' · ')
}

const mismaLinea = (a: ItemCarrito, b: ItemCarrito) => a.productoId === b.productoId && a.nombre === b.nombre

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>(
    () => readStorage<ItemCarrito[]>(STORAGE_KEY, STORAGE_VERSION) ?? [],
  )
  const [puntoRetiro, setPuntoRetiro] = useState<PuntoDeRetiro>(() => {
    const guardado = readStorage<string>(PUNTO_KEY, STORAGE_VERSION)
    return puntosDeRetiro.find((p) => p.nombre === guardado) ?? puntosDeRetiro[0]
  })
  const [codigoCupon, setCodigoCupon] = useState<string | null>(() => readStorage<string>(CUPON_KEY, STORAGE_VERSION))

  // Se guarda en localStorage dentro de cada acción, como actualización
  // funcional: así dos acciones en el mismo clic (ej. cuñetes + galones
  // sueltos desde la calculadora) no se pisan leyendo el mismo `items` viejo.
  const actualizar = (cambio: (prev: ItemCarrito[]) => ItemCarrito[]) => {
    setItems((prev) => {
      const nuevo = cambio(prev)
      writeStorage(STORAGE_KEY, STORAGE_VERSION, nuevo)
      return nuevo
    })
  }

  const sumarLinea = (linea: ItemCarrito) => {
    actualizar((prev) =>
      prev.some((i) => mismaLinea(i, linea))
        ? prev.map((i) => (mismaLinea(i, linea) ? { ...i, cantidad: i.cantidad + linea.cantidad } : i))
        : [...prev, linea],
    )
  }

  const agregarProducto = (
    producto: Producto,
    cantidad = 1,
    presentacion: Presentacion = 'Galón (3.78 L)',
    color?: ColorPaleta,
  ) => {
    sumarLinea({
      productoId: producto.id,
      nombre: nombreLinea(producto, presentacion, color),
      precioUnitario: precioPresentacion(producto.precio, presentacion),
      cantidad,
    })
  }

  const agregarKit = (kit: Kit) => {
    sumarLinea({
      productoId: idDeKit(kit),
      nombre: `Kit: ${kit.nombre}`,
      precioUnitario: Math.round(kit.precioEstimado * (1 - kit.descuentoPct / 100)),
      cantidad: 1,
    })
  }

  const quitarItem = (item: ItemCarrito) => {
    actualizar((prev) => prev.filter((i) => !mismaLinea(i, item)))
  }

  const actualizarCantidad = (item: ItemCarrito, cantidad: number) => {
    if (cantidad <= 0) return quitarItem(item)
    actualizar((prev) => prev.map((i) => (mismaLinea(i, item) ? { ...i, cantidad } : i)))
  }

  const quitarCupon = () => {
    setCodigoCupon(null)
    clearStorage(CUPON_KEY)
  }

  const vaciarCarrito = () => {
    setItems([])
    clearStorage(STORAGE_KEY)
    quitarCupon()
  }

  const repetirPedido = (pedido: Pedido) => {
    for (const linea of pedido.items) sumarLinea({ ...linea })
  }

  const subtotal = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0)
  // El cupón se revisa contra el carrito de ahora: si cambia lo que se compra y ya no cumple, deja de aplicar.
  const resultadoCupon = codigoCupon ? evaluarCupon(codigoCupon, subtotal) : null
  const cupon = resultadoCupon?.ok ? resultadoCupon.cupon : null
  const descuento = resultadoCupon?.ok ? resultadoCupon.descuento : 0
  const totales = calcularTotales(items, descuento)

  const aplicarCupon = (codigo: string): ResultadoCupon => {
    const resultado = evaluarCupon(codigo, subtotal)
    if (resultado.ok) {
      setCodigoCupon(resultado.cupon.codigo)
      writeStorage(CUPON_KEY, STORAGE_VERSION, resultado.cupon.codigo)
    }
    return resultado
  }

  const confirmarPedido = async (clienteNombre: string, clienteEmail: string, pago: Pago): Promise<Pedido> => {
    const pedido = await tiendaRepository.crearPedido(items, clienteNombre, clienteEmail, puntoRetiro.nombre, {
      pago,
      cupon: cupon?.codigo,
      descuento: totales.descuento,
    })
    vaciarCarrito()
    return pedido
  }

  const elegirPuntoRetiro = (punto: PuntoDeRetiro) => {
    setPuntoRetiro(punto)
    writeStorage(PUNTO_KEY, STORAGE_VERSION, punto.nombre)
  }

  const totalItems = items.reduce((sum, i) => sum + i.cantidad, 0)

  const value = useMemo(
    () => ({
      items,
      totalItems,
      subtotal,
      total: totales.total,
      totales,
      cupon,
      aplicarCupon,
      quitarCupon,
      agregarProducto,
      agregarKit,
      actualizarCantidad,
      quitarItem,
      vaciarCarrito,
      repetirPedido,
      confirmarPedido,
      puntoRetiro,
      elegirPuntoRetiro,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, codigoCupon, puntoRetiro],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
