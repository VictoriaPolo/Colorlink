import { describe, it, expect } from 'vitest'
import { calcularGalones, calcularEmpaqueOptimo, precioPresentacion } from './calculadora'

describe('calcularGalones', () => {
  it('calcula proporcional al área y al rendimiento del producto', () => {
    // 88 m² a 2 manos / 22 m² por galón = 8 galones exactos
    expect(calcularGalones(88, 22)).toBe(8)
  })

  it('aumenta con superficies más porosas', () => {
    const sellada = calcularGalones(100, 20, 'Sellada')
    const porosa = calcularGalones(100, 20, 'Concreto poroso')
    expect(porosa).toBeGreaterThan(sellada)
  })

  it('escala con el número de manos', () => {
    const unaMano = calcularGalones(100, 20, 'Sellada', 1)
    const dosManos = calcularGalones(100, 20, 'Sellada', 2)
    expect(dosManos).toBeCloseTo(unaMano * 2)
  })

  it('devuelve 0 para área o rendimiento inválidos', () => {
    expect(calcularGalones(0, 20)).toBe(0)
    expect(calcularGalones(-10, 20)).toBe(0)
    expect(calcularGalones(100, 0)).toBe(0)
  })
})

describe('calcularEmpaqueOptimo', () => {
  it('combina cuñetes de 5 galones con galones sueltos', () => {
    const empaque = calcularEmpaqueOptimo(8.11, 142900)
    expect(empaque.cunetes).toBe(1)
    expect(empaque.galonesSueltos).toBe(4)
  })

  it('no deja sueltos cuando el total es múltiplo de 5', () => {
    const empaque = calcularEmpaqueOptimo(10, 100000)
    expect(empaque.cunetes).toBe(2)
    expect(empaque.galonesSueltos).toBe(0)
  })

  it('calcula el costo total combinando ambos precios', () => {
    const empaque = calcularEmpaqueOptimo(6, 100000)
    // 1 cuñete a 88% de 5 galones + 1 galón suelto
    expect(empaque.costoTotal).toBe(440000 + 100000)
  })
})

describe('precioPresentacion', () => {
  it('cobra el galón a precio de lista y el cuñete con el descuento mayorista', () => {
    expect(precioPresentacion(100000, 'Galón (3.78 L)')).toBe(100000)
    expect(precioPresentacion(100000, 'Cuñete 5 galones (18.9 L)')).toBe(440000)
  })
})
