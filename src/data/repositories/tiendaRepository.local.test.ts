import { describe, it, expect, beforeEach } from 'vitest'
import { construirPago } from '@/domain/pagos/pasarela'
import { tiendaRepositoryLocal as repo } from './tiendaRepository.local'

beforeEach(() => window.localStorage.clear())

const items = [{ productoId: 1, nombre: 'Viniltex', precioUnitario: 100_000, cantidad: 2 }]
const punto = 'Centro de Pinturas Colorlink - El Prado'

describe('tiendaRepositoryLocal — pedidos con pago', () => {
  it('guarda el pago, el cupón y el código de retiro, y descuenta del total', async () => {
    const pago = construirPago({ metodo: 'tarjeta', monto: 180_000, detalle: 'Visa ···· 4242', salida: { aprobado: true } })
    const pedido = await repo.crearPedido(items, 'Ana Gómez', 'ana@correo.com', punto, { pago, cupon: 'BIENVENIDA10', descuento: 20_000 })

    expect(pedido).toMatchObject({ total: 180_000, cupon: 'BIENVENIDA10', descuento: 20_000, estado: 'Recibido', puntoRetiro: punto })
    expect(pedido.pago).toEqual(pago)
    expect(pedido.codigoRetiro).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    expect(await repo.obtenerPedido(pedido.id)).toMatchObject({ pago: { referencia: pago.referencia }, codigoRetiro: pedido.codigoRetiro })
    expect((await repo.listarPedidosPorEmail('ana@correo.com'))[0].id).toBe(pedido.id)
  })

  it('sin cupón no guarda descuento, y el descuento nunca pasa de lo que se compra', async () => {
    const sinCupon = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto)
    expect(sinCupon.total).toBe(200_000)
    expect(sinCupon.cupon).toBeUndefined()
    expect(sinCupon.descuento).toBeUndefined()

    const exagerado = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto, { cupon: 'X', descuento: 999_999 })
    expect(exagerado.total).toBe(0)
    expect(exagerado.descuento).toBe(200_000)
  })

  it('cada pedido nuevo recibe un código de retiro distinto de los demás pedidos', async () => {
    const uno = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto)
    const dos = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto)
    expect(uno.codigoRetiro).not.toBe(dos.codigoRetiro)
    expect(uno.id).not.toBe(dos.id)
  })

  it('el equipo cobra un pedido que se paga al retirar y queda su referencia', async () => {
    const pago = construirPago({ metodo: 'efectivo', monto: 200_000, detalle: 'Pagas al retirar en la tienda' })
    const pedido = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto, { pago })
    expect(pedido.pago?.estado).toBe('Pendiente')

    const cobrado = await repo.actualizarPagoPedido(pedido.id, 'Aprobado')
    expect(cobrado?.pago).toMatchObject({ estado: 'Aprobado', referencia: pago.referencia, metodo: 'efectivo' })
    expect((await repo.listarPedidos()).find((p) => p.id === pedido.id)?.pago?.estado).toBe('Aprobado')
  })

  it('un pedido sin pago guardado también se puede cobrar, y recibe referencia', async () => {
    const pedido = await repo.crearPedido(items, 'Ana', 'ana@correo.com')
    expect(pedido.pago).toBeUndefined()
    const cobrado = await repo.actualizarPagoPedido(pedido.id, 'Aprobado')
    expect(cobrado?.pago).toMatchObject({ metodo: 'efectivo', estado: 'Aprobado', monto: 200_000 })
    expect(cobrado?.pago?.referencia).toMatch(/^PAY-[A-HJ-NP-Z2-9]{8}$/)
  })

  it('se puede registrar el reembolso de un pedido pagado', async () => {
    const reembolsado = await repo.actualizarPagoPedido('PED-1003', 'Reembolsado')
    expect(reembolsado?.pago).toMatchObject({ estado: 'Reembolsado', referencia: 'PAY-X2H7PQ9M' })
  })

  it('un pedido que no existe no se cobra', async () => {
    expect(await repo.actualizarPagoPedido('PED-9999', 'Aprobado')).toBeUndefined()
  })

  it('un pedido nuevo empieza su historial en "Recibido", con la hora', async () => {
    const pedido = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto)
    expect(pedido.historial).toHaveLength(1)
    expect(pedido.historial?.[0].estado).toBe('Recibido')
    expect(Number.isNaN(Date.parse(pedido.historial![0].fecha))).toBe(false)
  })

  it('cada cambio de etapa queda anotado con su hora, sin repetir la misma etapa', async () => {
    const pedido = await repo.crearPedido(items, 'Ana', 'ana@correo.com', punto)
    await repo.actualizarEstadoPedido(pedido.id, 'En preparación')
    await repo.actualizarEstadoPedido(pedido.id, 'En preparación')
    const listo = await repo.actualizarEstadoPedido(pedido.id, 'Listo para retiro')
    expect(listo?.estado).toBe('Listo para retiro')
    expect(listo?.historial?.map((h) => h.estado)).toEqual(['Recibido', 'En preparación', 'Listo para retiro'])
    expect((await repo.obtenerPedido(pedido.id))?.historial).toEqual(listo?.historial)
  })

  it('una cancelación también queda anotada, y los pedidos de ejemplo ya traen su historial', async () => {
    const cancelado = await repo.actualizarEstadoPedido('PED-1003', 'Cancelado')
    expect(cancelado?.historial?.at(-1)?.estado).toBe('Cancelado')
    const entregado = (await repo.listarPedidos()).find((p) => p.id === 'PED-1005')
    expect(entregado?.historial?.map((h) => h.estado)).toEqual(['Recibido', 'En preparación', 'Listo para retiro', 'Entregado'])
  })

  it('los pedidos de ejemplo traen su pago, con todos los medios y estados', async () => {
    const pedidos = await repo.listarPedidos()
    expect(pedidos.every((p) => p.pago)).toBe(true)
    expect(new Set(pedidos.map((p) => p.pago?.metodo))).toEqual(new Set(['tarjeta', 'pse', 'nequi', 'efectivo']))
    expect(pedidos.find((p) => p.id === 'PED-1002')?.pago?.estado).toBe('Pendiente')
    expect(pedidos.find((p) => p.id === 'PED-1006')?.pago?.estado).toBe('Reembolsado')
  })
})
