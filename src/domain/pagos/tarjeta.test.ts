import { describe, it, expect } from 'vitest'
import {
  estadoVencimiento,
  formatearNumero,
  formatearVencimiento,
  longitudCvv,
  luhnValido,
  marcaDeTarjeta,
  validarTarjeta,
} from './tarjeta'

const OCTUBRE_2026 = new Date(2026, 9, 31)

describe('luhnValido', () => {
  it('acepta números bien digitados, con o sin espacios', () => {
    expect(luhnValido('4242424242424242')).toBe(true)
    expect(luhnValido('4242 4242 4242 4242')).toBe(true)
    expect(luhnValido('3782 822463 10005')).toBe(true)
  })

  it('detecta un dígito equivocado y los números demasiado cortos', () => {
    expect(luhnValido('4242 4242 4242 4241')).toBe(false)
    expect(luhnValido('1234')).toBe(false)
    expect(luhnValido('')).toBe(false)
  })
})

describe('marcaDeTarjeta', () => {
  it.each([
    ['4242 4242 4242 4242', 'visa'],
    ['5555 5555 5555 4444', 'mastercard'],
    ['2221 0000 0000 0009', 'mastercard'],
    ['3782 822463 10005', 'amex'],
    ['3056 930902 5904', 'diners'],
    ['6011 1111 1111 1117', 'desconocida'],
    ['', 'desconocida'],
  ])('%s es %s', (numero, marca) => {
    expect(marcaDeTarjeta(numero)).toBe(marca)
  })
})

describe('formatearNumero', () => {
  it('agrupa de a cuatro, y 4-6-5 en American Express', () => {
    expect(formatearNumero('4242424242424242')).toBe('4242 4242 4242 4242')
    expect(formatearNumero('378282246310005')).toBe('3782 822463 10005')
    expect(formatearNumero('30569309025904')).toBe('3056 930902 5904')
  })

  it('va formateando mientras se escribe, ignora lo que no es un dígito y corta lo que sobra', () => {
    expect(formatearNumero('4242')).toBe('4242')
    expect(formatearNumero('42424')).toBe('4242 4')
    expect(formatearNumero('abcd4242')).toBe('4242')
    expect(formatearNumero('42424242424242429999')).toBe('4242 4242 4242 4242')
  })
})

describe('formatearVencimiento', () => {
  it.each([
    ['1', '1'],
    ['3', '03'],
    ['12', '12'],
    ['122', '12/2'],
    ['1226', '12/26'],
    ['12/26', '12/26'],
    ['122699', '12/26'],
  ])('%s se escribe %s', (entrada, salida) => {
    expect(formatearVencimiento(entrada)).toBe(salida)
  })
})

describe('estadoVencimiento', () => {
  it('la tarjeta sirve hasta el final del mes que dice', () => {
    expect(estadoVencimiento('10/26', OCTUBRE_2026)).toBe('ok')
    expect(estadoVencimiento('12/26', OCTUBRE_2026)).toBe('ok')
    expect(estadoVencimiento('09/26', OCTUBRE_2026)).toBe('vencida')
    expect(estadoVencimiento('12/25', OCTUBRE_2026)).toBe('vencida')
  })

  it('rechaza lo que no es una fecha MM/AA', () => {
    for (const texto of ['', '1226', '13/26', '00/26', '12/50', '1/26']) {
      expect(estadoVencimiento(texto, OCTUBRE_2026)).toBe('formato')
    }
  })
})

describe('longitudCvv', () => {
  it('American Express usa 4 dígitos y el resto 3', () => {
    expect(longitudCvv('amex')).toBe(4)
    expect(longitudCvv('visa')).toBe(3)
    expect(longitudCvv('desconocida')).toBe(3)
  })
})

describe('validarTarjeta', () => {
  const buena = { numero: '4242 4242 4242 4242', titular: 'Laura Polo', vencimiento: '12/28', cvv: '123' }

  it('no marca errores en datos correctos', () => {
    expect(validarTarjeta(buena, OCTUBRE_2026)).toEqual({})
  })

  it('dice qué campo está mal y por qué', () => {
    const errores = validarTarjeta({ numero: '', titular: 'Al', vencimiento: '09/26', cvv: '12' }, OCTUBRE_2026)
    expect(errores.numero).toContain('Escribe el número')
    expect(errores.titular).toContain('nombre')
    expect(errores.vencimiento).toContain('vencida')
    expect(errores.cvv).toContain('3 dígitos')
    expect(validarTarjeta({ ...buena, numero: '4242 4242 4242 4241' }, OCTUBRE_2026).numero).toContain('no es válido')
    expect(validarTarjeta({ ...buena, vencimiento: '1228' }, OCTUBRE_2026).vencimiento).toContain('MM/AA')
  })

  it('American Express pide un código de 4 dígitos', () => {
    const amex = { ...buena, numero: '3782 822463 10005' }
    expect(validarTarjeta(amex, OCTUBRE_2026).cvv).toContain('4 dígitos')
    expect(validarTarjeta({ ...amex, cvv: '1234' }, OCTUBRE_2026)).toEqual({})
  })
})
