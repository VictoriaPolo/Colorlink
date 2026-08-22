import { describe, it, expect, beforeEach } from 'vitest'
import { solicitudesRepository } from './solicitudesRepository'
import type { SolicitudFormData } from '@/domain/solicitud/types'

const formData: SolicitudFormData = {
  identificacion: { cliente: 'Cliente Demo', nit: '900000000-1', responsable: 'Test', canal: 'Página web' },
  proyecto: { ciudad: 'Cali', tipoObra: 'Oficina', areaAprox: '40', fechaRequerida: '2026-12-01' },
  tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Nueva', colorAcabado: 'Mate' },
  evidencia: { descripcion: 'Prueba', imagenes: [], observaciones: '', consentimiento: true },
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('solicitudesRepository', () => {
  it('siembra la lista con las solicitudes iniciales cuando no hay nada guardado', () => {
    const solicitudes = solicitudesRepository.listar()
    expect(solicitudes.length).toBeGreaterThan(0)
  })

  it('crea una solicitud con id único, estado "En análisis" y la persiste', () => {
    const antes = solicitudesRepository.listar().length
    const nueva = solicitudesRepository.crear(formData)

    expect(nueva.estado).toBe('En análisis')
    expect(nueva.historialEstados).toHaveLength(2)
    expect(solicitudesRepository.listar().length).toBe(antes + 1)
    expect(solicitudesRepository.obtener(nueva.id)?.id).toBe(nueva.id)
  })

  it('persiste entre "recargas" simuladas (nueva lectura desde localStorage)', () => {
    const nueva = solicitudesRepository.crear(formData)
    const relectura = solicitudesRepository.listar()
    expect(relectura.some((s) => s.id === nueva.id)).toBe(true)
  })

  it('avanza el estado de una solicitud existente', () => {
    const nueva = solicitudesRepository.crear(formData)
    const avanzada = solicitudesRepository.avanzar(nueva.id)
    expect(avanzada?.estado).toBe('Solución propuesta')
    expect(solicitudesRepository.obtener(nueva.id)?.estado).toBe('Solución propuesta')
  })

  it('avanzar() devuelve undefined para un id inexistente', () => {
    expect(solicitudesRepository.avanzar('CL-NO-EXISTE')).toBeUndefined()
  })
})
