import { describe, it, expect, beforeEach } from 'vitest'
import type { jsPDF } from 'jspdf'
import { tiendaRepositoryLocal as repo } from '@/data/repositories/tiendaRepository.local'
import type { Pedido } from '@/domain/tienda/types'
import { construirComprobantePdf } from './comprobantePdf'

beforeEach(() => window.localStorage.clear())

/** El PDF sin comprimir, leído byte a byte (Latin-1) para buscar su texto. */
const leer = (doc: jsPDF) => new TextDecoder('latin1').decode(doc.output('arraybuffer'))
const texto = async (pedido: Pedido) => leer(await construirComprobantePdf(pedido, { comprimir: false }))
const ejemplo = async (id: string) => (await repo.obtenerPedido(id))!

describe('construirComprobantePdf', () => {
  it('genera un comprobante para cada pedido de ejemplo, con su número, el pago y el aviso de práctica', async () => {
    for (const pedido of await repo.listarPedidos()) {
      const pdf = await texto(pedido)
      expect(pdf.startsWith('%PDF-'), pedido.id).toBe(true)
      expect(pdf, pedido.id).toContain(pedido.id)
      expect(pdf, pedido.id).toContain('Comprobante de pedido')
      expect(pdf, pedido.id).toContain(pedido.pago!.referencia)
      expect(pdf, pedido.id).toContain('no es una factura')
    }
  })

  it('un pedido en curso lleva el código de retiro, la tienda y cómo se pagó', async () => {
    const pedido = await ejemplo('PED-1003')
    const pdf = await texto(pedido)
    expect(pdf).toContain('Retiro en tienda')
    expect(pdf).toContain(pedido.codigoRetiro!)
    expect(pdf).toContain('Pago aprobado')
    expect(pdf).toContain('Visa')
  })

  it('un pedido que se paga al retirar lo dice', async () => {
    const pdf = await texto(await ejemplo('PED-1002'))
    expect(pdf).toContain('Pagas al retirar')
    expect(pdf).toContain('Al retirar en tienda')
  })

  it('un pedido cancelado no trae código de retiro y avisa del reembolso', async () => {
    const pedido = await ejemplo('PED-1006')
    const pdf = await texto(pedido)
    expect(pdf).toContain('Este pedido fue cancelado')
    expect(pdf).toContain('Reembolsado')
    expect(pdf).not.toContain('Retiro en tienda')
    expect(pdf).not.toContain('Tu código de retiro')
  })

  it('con cupón, muestra el descuento y el total ya descontado', async () => {
    const base = await ejemplo('PED-1004')
    const pdf = await texto({ ...base, cupon: 'BIENVENIDA10', descuento: 12_490, total: base.total - 12_490 })
    expect(pdf).toContain('cupón BIENVENIDA10')
    expect(pdf).toContain('Descuento')
  })

  it('un pedido de antes de los pagos sale como pago al retirar', async () => {
    const { pago: _pago, ...sinPago } = await ejemplo('PED-1004')
    const pdf = await texto(sinPago)
    expect(pdf).toContain('Al retirar en tienda')
  })

  it('con muchos productos sigue en otra hoja y no se corta', async () => {
    const base = await ejemplo('PED-1003')
    const items = Array.from({ length: 70 }, (_, i) => ({ productoId: 1, nombre: `Producto de prueba número ${i + 1}`, precioUnitario: 10_000, cantidad: 1 }))
    const doc = await construirComprobantePdf({ ...base, items, total: 700_000 }, { comprimir: false })
    expect(doc.getNumberOfPages()).toBeGreaterThan(1)
    expect(leer(doc)).toContain(`Página 2 de ${doc.getNumberOfPages()}`)
  })
})
