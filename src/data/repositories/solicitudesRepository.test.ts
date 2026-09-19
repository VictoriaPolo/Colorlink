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

describe('solicitudesRepository (respaldo localStorage — sin Supabase configurado en las pruebas)', () => {
  it('siembra la lista con las solicitudes iniciales cuando no hay nada guardado', async () => {
    const solicitudes = await solicitudesRepository.listar()
    expect(solicitudes.length).toBeGreaterThan(0)
  })

  it('crea una solicitud con id único, estado "En análisis" y la persiste', async () => {
    const antes = (await solicitudesRepository.listar()).length
    const nueva = await solicitudesRepository.crear(formData)

    expect(nueva.estado).toBe('En análisis')
    expect(nueva.historialEstados).toHaveLength(2)
    expect((await solicitudesRepository.listar()).length).toBe(antes + 1)
    expect((await solicitudesRepository.obtener(nueva.id))?.id).toBe(nueva.id)
  })

  it('persiste entre "recargas" simuladas (nueva lectura desde localStorage)', async () => {
    const nueva = await solicitudesRepository.crear(formData)
    const relectura = await solicitudesRepository.listar()
    expect(relectura.some((s) => s.id === nueva.id)).toBe(true)
  })

  it('avanza el estado de una solicitud existente', async () => {
    const nueva = await solicitudesRepository.crear(formData)
    const avanzada = await solicitudesRepository.avanzar(nueva.id)
    expect(avanzada?.estado).toBe('Solución propuesta')
    expect((await solicitudesRepository.obtener(nueva.id))?.estado).toBe('Solución propuesta')
  })

  it('avanzar() devuelve undefined para un id inexistente', async () => {
    expect(await solicitudesRepository.avanzar('CL-NO-EXISTE')).toBeUndefined()
  })
})
