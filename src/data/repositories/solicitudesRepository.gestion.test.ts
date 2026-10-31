import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { diagnosticar } from '@/domain/diagnostico/diagnosticar'
import type { SolicitudFormData } from '@/domain/solicitud/types'
import { solicitudesRepository } from './solicitudesRepository'

function formData(fotos: string[] = []): SolicitudFormData {
  return {
    identificacion: { cliente: 'Cliente Demo', nit: '900000000-1', responsable: 'Test', canal: 'Página web' },
    proyecto: { ciudad: 'Cali', tipoObra: 'Oficina', areaAprox: '40', fechaRequerida: '2026-12-01' },
    tecnica: { superficie: 'Interior', ambiente: 'Interior seco', condicion: 'Nueva', colorAcabado: 'Mate' },
    evidencia: {
      descripcion: 'Prueba',
      imagenes: fotos.map((url, i) => ({ id: `f${i}`, nombre: `foto${i}.jpg`, url })),
      observaciones: '',
      consentimiento: true,
    },
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('solicitudesRepository: dueño, diagnóstico y gestión del equipo', () => {
  it('guarda el dueño y el diagnóstico, y la recomendación los tiene en cuenta', async () => {
    const diagnostico = diagnosticar({ zona: 'Techo', descripcion: 'gotera y humedad', metricas: [] })
    const nueva = await solicitudesRepository.crear(formData(), { propietario: 'ana@correo.com', diagnostico })
    const leida = await solicitudesRepository.obtener(nueva.id)
    expect(leida?.propietario).toBe('ana@correo.com')
    expect(leida?.diagnostico?.patologia).toBe('Humedad y filtración')
    expect(leida?.recomendacion.producto).toBe('Aquablock Fibratado')
  })

  it('sin opciones sigue creando solicitudes (sin dueño ni diagnóstico)', async () => {
    const nueva = await solicitudesRepository.crear(formData())
    expect(nueva.propietario).toBeUndefined()
    expect(nueva.diagnostico).toBeUndefined()
  })

  it('asigna una solicitud y la deja sin asignar otra vez', async () => {
    const { id } = await solicitudesRepository.crear(formData())
    const asignada = await solicitudesRepository.asignar(id, 'Camila Vargas')
    expect(asignada?.gestion?.asignadoA).toBe('Camila Vargas')
    expect((await solicitudesRepository.obtener(id))?.gestion?.asignadoA).toBe('Camila Vargas')
    const libre = await solicitudesRepository.asignar(id, undefined)
    expect(libre?.gestion?.asignadoA).toBeUndefined()
  })

  it('agrega notas internas firmadas y con fecha, sin perder las anteriores ni la asignación', async () => {
    const { id } = await solicitudesRepository.crear(formData())
    await solicitudesRepository.asignar(id, 'Andrés Moreno')
    await solicitudesRepository.agregarNota(id, 'Andrés Moreno', '  Llamé al cliente.  ')
    const conDos = await solicitudesRepository.agregarNota(id, 'Camila Vargas', 'Visita el martes.')
    expect(conDos?.gestion?.notas.map((n) => n.texto)).toEqual(['Llamé al cliente.', 'Visita el martes.'])
    expect(conDos?.gestion?.notas[0].autor).toBe('Andrés Moreno')
    expect(conDos?.gestion?.notas[0].fecha).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(conDos?.gestion?.asignadoA).toBe('Andrés Moreno')
  })

  it('asignar y agregarNota devuelven undefined si la solicitud no existe', async () => {
    expect(await solicitudesRepository.asignar('CL-NO-EXISTE', 'Camila Vargas')).toBeUndefined()
    expect(await solicitudesRepository.agregarNota('CL-NO-EXISTE', 'Camila Vargas', 'hola')).toBeUndefined()
  })

  it('cancela una solicitud con motivo y autor, y la reactiva sin perder el estado', async () => {
    const { id, estado } = await solicitudesRepository.crear(formData())
    const cancelada = await solicitudesRepository.cancelar(id, 'Camila Vargas', '  El cliente no respondió.  ')
    expect(cancelada?.gestion?.cancelacion?.motivo).toBe('El cliente no respondió.')
    expect(cancelada?.gestion?.cancelacion?.autor).toBe('Camila Vargas')
    expect(cancelada?.estado).toBe(estado)

    const reactivada = await solicitudesRepository.reactivar(id)
    expect(reactivada?.gestion?.cancelacion).toBeUndefined()
    expect(reactivada?.estado).toBe(estado)
  })

  it('cancelar y reactivar devuelven undefined si la solicitud no existe', async () => {
    expect(await solicitudesRepository.cancelar('CL-NO-EXISTE', 'Camila Vargas', 'motivo')).toBeUndefined()
    expect(await solicitudesRepository.reactivar('CL-NO-EXISTE')).toBeUndefined()
  })

  it('las solicitudes de ejemplo tienen dueño, diagnóstico y gestión, en varias etapas', async () => {
    const lista = await solicitudesRepository.listar()
    expect(lista.length).toBeGreaterThanOrEqual(6)
    expect(lista.every((s) => s.propietario)).toBe(true)
    expect(new Set(lista.map((s) => s.estado)).size).toBeGreaterThanOrEqual(4)
    expect(lista.some((s) => !s.gestion?.asignadoA)).toBe(true)
    const conFoto = lista.filter((s) => s.data.evidencia.imagenes.length > 0)
    expect(conFoto.length).toBeGreaterThanOrEqual(4)
    expect(conFoto.every((s) => s.diagnostico && s.diagnostico.fotos === s.data.evidencia.imagenes.length)).toBe(true)
  })

  it('los diagnósticos de ejemplo son coherentes con lo que cuenta cada cliente', async () => {
    const lista = await solicitudesRepository.listar()
    const patologia = (id: string) => lista.find((s) => s.id === id)?.diagnostico?.patologia
    expect(patologia('CL-1002')).toBe('Humedad y filtración')
    expect(patologia('CL-1003')).toBe('Fisuras y grietas')
    expect(patologia('CL-1004')).toBe('Óxido y corrosión')
    expect(patologia('CL-1005')).toBe('Moho y hongos')
    expect(patologia('CL-1006')).toBe('Fisuras y grietas')
    expect(patologia('CL-1008')).toBe('Sin daños evidentes')
  })

  it('si el almacenamiento se llena, no pierde la solicitud nueva: aligera las fotos de las viejas', async () => {
    // El setup de pruebas reemplaza localStorage por un almacén en memoria: se espía el suyo.
    const almacen = Object.getPrototypeOf(window.localStorage) as Storage
    const guardar = almacen.setItem
    vi.spyOn(almacen, 'setItem').mockImplementation(function (this: Storage, clave: string, valor: string) {
      if (valor.length > 150_000) throw new DOMException('Cuota', 'QuotaExceededError')
      guardar.call(this, clave, valor)
    })
    const pesada = `data:image/jpeg;base64,${'A'.repeat(100_000)}`
    const vieja = await solicitudesRepository.crear(formData([pesada]))
    const nueva = await solicitudesRepository.crear(formData([pesada]))

    const lista = await solicitudesRepository.listar()
    const fotos = (id: string) => lista.find((s) => s.id === id)?.data.evidencia.imagenes.length
    expect(fotos(nueva.id)).toBe(1)
    expect(fotos(vieja.id)).toBe(0)
  })
})
