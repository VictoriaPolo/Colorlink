import { describe, expect, it } from 'vitest'
import { diagnosticar } from '@/domain/diagnostico/diagnosticar'
import { generarRecomendacion } from './recommendationEngine'
import type { SolicitudFormData } from './types'

function formData(tecnica: Partial<SolicitudFormData['tecnica']> = {}): SolicitudFormData {
  return {
    identificacion: { cliente: 'Cliente Demo', nit: '900000000-1', responsable: 'Test', canal: 'Página web' },
    proyecto: { ciudad: 'Bogotá', tipoObra: 'Vivienda', areaAprox: '60', fechaRequerida: '2026-12-01' },
    tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Buen estado', colorAcabado: 'Mate', ...tecnica },
    evidencia: { descripcion: 'Prueba', imagenes: [], observaciones: '', consentimiento: true },
  }
}

describe('generarRecomendacion con diagnóstico por imagen', () => {
  it('manda sobre las reglas de superficie: primero se trata el moho', () => {
    const diagnostico = diagnosticar({ zona: 'Pared', descripcion: 'moho negro por todo el muro', metricas: [] })
    const resultado = generarRecomendacion(formData(), diagnostico)
    expect(resultado.producto).toBe('Aquablock Fibratado')
    expect(resultado.tipoSolucion).toMatch(/moho/i)
    expect(resultado.aplicacion).toMatch(/tratamiento previo/i)
    expect(resultado.advertencias.join(' ')).toMatch(/diagnóstico por imagen/i)
  })

  it('advierte de la revisión estructural cuando las grietas son serias', () => {
    const diagnostico = diagnosticar({ zona: 'Fachada', descripcion: 'grieta enorme que atraviesa el muro', metricas: [] })
    const resultado = generarRecomendacion(formData({ superficie: 'Fachada', ambiente: 'Exterior' }), diagnostico)
    expect(resultado.advertencias.join(' ')).toMatch(/estructural/i)
  })

  it('si no hay daños evidentes, deja las reglas de siempre', () => {
    const diagnostico = diagnosticar({ zona: 'Pared', descripcion: 'quiero cambiar el color', metricas: [] })
    expect(generarRecomendacion(formData(), diagnostico)).toEqual(generarRecomendacion(formData()))
  })

  it('un diagnóstico poco seguro no cambia la recomendación', () => {
    const diagnostico = { ...diagnosticar({ zona: 'Pared', descripcion: 'moho', metricas: [] }), confianza: 30 }
    expect(generarRecomendacion(formData(), diagnostico)).toEqual(generarRecomendacion(formData()))
  })
})
