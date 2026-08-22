import { describe, it, expect } from 'vitest'
import { generarRecomendacion } from './recommendationEngine'
import type { SolicitudFormData } from './types'

function baseFormData(overrides: Partial<SolicitudFormData['tecnica']> = {}, areaAprox = '100'): SolicitudFormData {
  return {
    identificacion: { cliente: 'Cliente Demo', nit: '900000000-1', responsable: 'Test', canal: 'Página web' },
    proyecto: { ciudad: 'Bogotá', tipoObra: 'Vivienda', areaAprox, fechaRequerida: '2026-12-01' },
    tecnica: {
      superficie: 'Interior',
      ambiente: 'Interior seco',
      condicion: 'Buen estado',
      colorAcabado: 'Mate',
      ...overrides,
    },
    evidencia: { descripcion: 'Prueba', imagenes: [], observaciones: '', consentimiento: true },
  }
}

describe('generarRecomendacion', () => {
  it('recomienda un sistema de exterior cuando la superficie o el ambiente son exteriores', () => {
    const resultado = generarRecomendacion(baseFormData({ superficie: 'Exterior', ambiente: 'Exterior' }))
    expect(resultado.tipoSolucion).toContain('exterior')
  })

  it('agrega advertencia de grietas cuando la condición es "Con grietas"', () => {
    const resultado = generarRecomendacion(baseFormData({ condicion: 'Con grietas' }))
    expect(resultado.advertencias.some((a) => a.toLowerCase().includes('superficie'))).toBe(true)
  })

  it('agrega advertencia de humedad cuando la condición es "Con humedad"', () => {
    const resultado = generarRecomendacion(baseFormData({ condicion: 'Con humedad' }))
    expect(resultado.advertencias.some((a) => a.toLowerCase().includes('humedad'))).toBe(true)
  })

  it('sugiere un acabado por defecto cuando el cliente selecciona "No estoy seguro"', () => {
    const resultado = generarRecomendacion(baseFormData({ colorAcabado: 'No estoy seguro' }))
    expect(resultado.acabado.length).toBeGreaterThan(0)
    expect(resultado.acabado).not.toBe('No estoy seguro')
  })

  it('no genera advertencias cuando la condición es buena y no hay riesgos', () => {
    const resultado = generarRecomendacion(baseFormData())
    expect(resultado.advertencias).toHaveLength(0)
  })

  it('calcula una cantidad estimada mayor a cero en función del área', () => {
    const resultado = generarRecomendacion(baseFormData({}, '150'))
    expect(resultado.cantidadEstimada).toMatch(/\d+ unidades/)
  })
})
