import { describe, expect, it } from 'vitest'
import { fechaCorta, fechaConHora, formatoCOP } from './formato'

describe('formato', () => {
  it('muestra una fecha como día y mes abreviado', () => {
    expect(fechaCorta('2026-10-30')).toBe('30 oct')
    expect(fechaCorta('2026-01-05T08:00:00Z')).toBe('5 ene')
  })

  it('devuelve el texto tal cual si no es una fecha', () => {
    expect(fechaCorta('pronto')).toBe('pronto')
  })

  it('agrega la hora cuando la hay', () => {
    expect(fechaConHora('2026-10-30T12:00:00')).toMatch(/^30 oct, /)
    expect(fechaConHora('nunca')).toBe('nunca')
  })

  it('formatea pesos colombianos sin decimales', () => {
    expect(formatoCOP.format(1133000).replace(/\s/g, ' ')).toMatch(/1\.133\.000/)
  })
})
