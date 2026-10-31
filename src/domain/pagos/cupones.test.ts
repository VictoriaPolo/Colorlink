import { describe, it, expect } from 'vitest'
import { aplicarCupon } from './cupones'
import { calcularTotales } from './totales'

describe('aplicarCupon', () => {
  it('calcula el porcentaje, sin importar mayúsculas ni espacios', () => {
    expect(aplicarCupon('bienvenida10', 500_000)).toMatchObject({ ok: true, descuento: 50_000 })
    expect(aplicarCupon(' color 5 ', 100_000)).toMatchObject({ ok: true, descuento: 5_000 })
  })

  it('respeta el tope del cupón', () => {
    expect(aplicarCupon('BIENVENIDA10', 2_000_000)).toMatchObject({ ok: true, descuento: 100_000 })
  })

  it('un cupón de monto exige su compra mínima', () => {
    const corto = aplicarCupon('RETIRO20', 150_000)
    expect(corto.ok).toBe(false)
    expect(!corto.ok && corto.motivo).toContain('200.000')
    expect(aplicarCupon('RETIRO20', 250_000)).toMatchObject({ ok: true, descuento: 20_000 })
  })

  it('explica por qué un código no sirve', () => {
    expect(aplicarCupon('NOEXISTE', 500_000)).toEqual({ ok: false, motivo: 'Ese cupón no existe. Revisa que esté bien escrito.' })
    expect(aplicarCupon('   ', 500_000)).toEqual({ ok: false, motivo: 'Escribe el código del cupón.' })
  })
})

describe('calcularTotales', () => {
  const items = [
    { precioUnitario: 100_000, cantidad: 2 },
    { precioUnitario: 50_000, cantidad: 1 },
  ]

  it('suma, descuenta y calcula el IVA que ya trae el precio', () => {
    expect(calcularTotales(items)).toEqual({ subtotal: 250_000, descuento: 0, total: 250_000, ivaIncluido: 39_916 })
    expect(calcularTotales(items, 25_000)).toEqual({ subtotal: 250_000, descuento: 25_000, total: 225_000, ivaIncluido: 35_924 })
  })

  it('el descuento nunca pasa del subtotal ni es negativo', () => {
    expect(calcularTotales(items, 999_999)).toMatchObject({ descuento: 250_000, total: 0 })
    expect(calcularTotales(items, -5_000)).toMatchObject({ descuento: 0, total: 250_000 })
  })

  it('un carrito vacío da ceros', () => {
    expect(calcularTotales([])).toEqual({ subtotal: 0, descuento: 0, total: 0, ivaIncluido: 0 })
  })
})
