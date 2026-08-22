import { describe, it, expect } from 'vitest'
import { siguienteEstado, puedeTransicionar, estaFinalizada, avanzarEstado, etapaDelNegocio } from './estadoMachine'
import type { Solicitud } from './types'

const solicitudBase: Solicitud = {
  id: 'CL-9999',
  fechaSolicitud: '2026-01-01',
  estado: 'Recibida',
  historialEstados: [{ estado: 'Recibida', fecha: '2026-01-01' }],
  data: {
    identificacion: { cliente: 'Test', nit: '1', responsable: 'Test', canal: 'Otro' },
    proyecto: { ciudad: 'Bogotá', tipoObra: 'Otro', areaAprox: '10', fechaRequerida: '2026-01-02' },
    tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Nueva', colorAcabado: 'Mate' },
    evidencia: { descripcion: 'x', imagenes: [], observaciones: '', consentimiento: true },
  },
  recomendacion: {
    tipoSolucion: 'x',
    producto: 'x',
    acabado: 'x',
    cantidadEstimada: 'x',
    aplicacion: 'x',
    tiempoEstimado: 'x',
    advertencias: [],
    estadoTexto: 'x',
  },
}

describe('máquina de estados de Solicitud', () => {
  it('avanza en el orden correcto: Recibida -> En análisis -> ... -> Finalizada', () => {
    expect(siguienteEstado('Recibida')).toBe('En análisis')
    expect(siguienteEstado('En análisis')).toBe('Solución propuesta')
    expect(siguienteEstado('Solución propuesta')).toBe('En abastecimiento')
    expect(siguienteEstado('En abastecimiento')).toBe('Servicio programado')
    expect(siguienteEstado('Servicio programado')).toBe('Finalizada')
  })

  it('no permite avanzar más allá de Finalizada', () => {
    expect(siguienteEstado('Finalizada')).toBeNull()
    expect(estaFinalizada('Finalizada')).toBe(true)
  })

  it('solo permite transiciones de un paso hacia adelante, no saltos', () => {
    expect(puedeTransicionar('Recibida', 'En análisis')).toBe(true)
    expect(puedeTransicionar('Recibida', 'En abastecimiento')).toBe(false)
    expect(puedeTransicionar('Recibida', 'Recibida')).toBe(false)
  })

  it('avanzarEstado agrega una entrada al historial sin mutar la solicitud original', () => {
    const avanzada = avanzarEstado(solicitudBase, '2026-01-05')
    expect(solicitudBase.estado).toBe('Recibida')
    expect(avanzada.estado).toBe('En análisis')
    expect(avanzada.historialEstados).toHaveLength(2)
    expect(avanzada.historialEstados[1]).toEqual({ estado: 'En análisis', fecha: '2026-01-05' })
  })

  it('avanzarEstado no hace nada si ya está Finalizada', () => {
    const finalizada: Solicitud = { ...solicitudBase, estado: 'Finalizada' }
    const resultado = avanzarEstado(finalizada, '2026-02-01')
    expect(resultado).toBe(finalizada)
  })

  it('mapea cada estado a la etapa correcta del negocio (1 a 5)', () => {
    expect(etapaDelNegocio('Recibida')).toBe(1)
    expect(etapaDelNegocio('En análisis')).toBe(2)
    expect(etapaDelNegocio('Solución propuesta')).toBe(2)
    expect(etapaDelNegocio('En abastecimiento')).toBe(3)
    expect(etapaDelNegocio('Servicio programado')).toBe(4)
    expect(etapaDelNegocio('Finalizada')).toBe(5)
  })
})
