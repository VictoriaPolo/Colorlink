import { describe, it, expect } from 'vitest'
import {
  TARJETAS_DE_PRUEBA,
  celularValido,
  codigoRetiro,
  construirPago,
  detalleNequi,
  detallePse,
  detalleTarjeta,
  formatearCelular,
  pagarConNequi,
  pagarConPse,
  pagarConTarjeta,
  pagoDe,
  referenciaPago,
} from './pasarela'
import { luhnValido, marcaDeTarjeta } from './tarjeta'

describe('pagarConTarjeta', () => {
  it('aprueba las tarjetas de prueba que se aprueban, con o sin espacios', () => {
    expect(pagarConTarjeta('4242 4242 4242 4242')).toEqual({ aprobado: true })
    expect(pagarConTarjeta('5555555555554444')).toEqual({ aprobado: true })
    expect(pagarConTarjeta('3782 822463 10005')).toEqual({ aprobado: true })
  })

  it('rechaza con el motivo de cada tarjeta de prueba', () => {
    expect(pagarConTarjeta('4000 0000 0000 0002')).toMatchObject({ aprobado: false, codigo: 'rechazada' })
    expect(pagarConTarjeta('4000 0000 0000 9995')).toMatchObject({ aprobado: false, codigo: 'sin-fondos' })
    expect(pagarConTarjeta('4000 0000 0000 0127')).toMatchObject({ aprobado: false, codigo: 'cvv' })
  })

  it('no acepta una tarjeta real: es una pasarela de práctica', () => {
    const salida = pagarConTarjeta('4111 1111 1111 1111') // válida según Luhn, pero no es de prueba
    expect(salida).toMatchObject({ aprobado: false, codigo: 'no-es-de-prueba' })
    expect(salida.aprobado === false && salida.motivo).toContain('pasarela de práctica')
  })

  it('todas las tarjetas de prueba son números válidos y de la marca que dicen', () => {
    for (const t of TARJETAS_DE_PRUEBA) {
      expect(luhnValido(t.numero)).toBe(true)
      expect(marcaDeTarjeta(t.numero)).toBe(t.marca)
    }
  })
})

describe('PSE y Nequi', () => {
  it('PSE se aprueba si el banco autoriza y se cancela si no', () => {
    expect(pagarConPse('autorizar')).toEqual({ aprobado: true })
    expect(pagarConPse('cancelar')).toMatchObject({ aprobado: false, codigo: 'cancelada' })
  })

  it('Nequi se aprueba, se rechaza o se vence', () => {
    expect(pagarConNequi('aprobar')).toEqual({ aprobado: true })
    expect(pagarConNequi('rechazar')).toMatchObject({ aprobado: false, codigo: 'cancelada' })
    expect(pagarConNequi('vencer')).toMatchObject({ aprobado: false, codigo: 'vencida' })
  })

  it('valida y da formato al celular', () => {
    expect(celularValido('300 123 4567')).toBe(true)
    expect(celularValido('2001234567')).toBe(false)
    expect(celularValido('300123456')).toBe(false)
    expect(formatearCelular('3001234567')).toBe('300 123 4567')
    expect(formatearCelular('30012')).toBe('300 12')
  })
})

describe('detalle del pago', () => {
  it('muestra solo los últimos cuatro dígitos', () => {
    expect(detalleTarjeta('4242 4242 4242 4242')).toBe('Visa ···· 4242')
    expect(detalleTarjeta('3782 822463 10005')).toBe('American Express ···· 0005')
    expect(detalleNequi('300 123 4567')).toBe('Nequi ···· 4567')
    expect(detallePse('Bancolombia')).toBe('PSE · Bancolombia')
  })
})

describe('referencias', () => {
  it('la referencia y el código de retiro usan solo letras y números fáciles de dictar', () => {
    for (let i = 0; i < 50; i++) {
      expect(referenciaPago()).toMatch(/^PAY-[A-HJ-NP-Z2-9]{8}$/)
      expect(codigoRetiro()).toMatch(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('se pueden generar de forma predecible para las pruebas', () => {
    expect(referenciaPago(() => 0)).toBe('PAY-AAAAAAAA')
    expect(codigoRetiro(() => 0.999)).toBe('999999')
  })
})

describe('construirPago', () => {
  const ahora = new Date('2026-10-31T15:00:00Z')

  it('un pago aprobado queda aprobado, con su referencia y fecha', () => {
    const pago = construirPago({ metodo: 'tarjeta', monto: 250000, detalle: 'Visa ···· 4242', salida: { aprobado: true }, ahora, referencia: 'PAY-TEST2345' })
    expect(pago).toEqual({
      metodo: 'tarjeta',
      estado: 'Aprobado',
      referencia: 'PAY-TEST2345',
      monto: 250000,
      fecha: '2026-10-31T15:00:00.000Z',
      detalle: 'Visa ···· 4242',
    })
  })

  it('un pago rechazado guarda el motivo', () => {
    const pago = construirPago({ metodo: 'tarjeta', monto: 1000, detalle: 'Visa ···· 0002', salida: pagarConTarjeta('4000000000000002'), ahora })
    expect(pago.estado).toBe('Rechazado')
    expect(pago.motivo).toContain('banco emisor')
  })

  it('el pago al retirar queda pendiente hasta que la tienda lo cobre', () => {
    expect(construirPago({ metodo: 'efectivo', monto: 1000, detalle: 'Pagas al retirar', ahora }).estado).toBe('Pendiente')
  })
})

describe('pagoDe', () => {
  const base = { estado: 'Recibido', total: 90000, fecha: '2026-08-20' }

  it('devuelve el pago guardado', () => {
    const pago = construirPago({ metodo: 'pse', monto: 90000, detalle: 'PSE · Bancolombia', salida: { aprobado: true } })
    expect(pagoDe({ ...base, pago })).toBe(pago)
  })

  it('un pedido de antes de los pagos se lee como pago al retirar', () => {
    expect(pagoDe(base)).toMatchObject({ metodo: 'efectivo', estado: 'Pendiente', monto: 90000 })
    expect(pagoDe({ ...base, estado: 'Entregado' }).estado).toBe('Aprobado')
  })
})
