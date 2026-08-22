import type { Solicitud, SolicitudFormData } from '@/domain/solicitud/types'
import { generarRecomendacion } from '@/domain/solicitud/recommendationEngine'
import { historialInicial, avanzarEstado } from '@/domain/solicitud/estadoMachine'
import { solicitudesIniciales } from '@/data/mockData'
import { readStorage, writeStorage } from './storage'

const STORAGE_KEY = 'colorlink:solicitudes'
const STORAGE_VERSION = 1

function siguienteId(solicitudes: Solicitud[]): string {
  const maximo = solicitudes.reduce((max, s) => {
    const n = Number(s.id.replace('CL-', ''))
    return Number.isFinite(n) && n > max ? n : max
  }, 1000)
  return `CL-${maximo + 1}`
}

function cargar(): Solicitud[] {
  return readStorage<Solicitud[]>(STORAGE_KEY, STORAGE_VERSION) ?? solicitudesIniciales
}

function guardar(solicitudes: Solicitud[]): void {
  writeStorage(STORAGE_KEY, STORAGE_VERSION, solicitudes)
}

/**
 * Repositorio de solicitudes. Encapsula el acceso a datos (hoy localStorage,
 * sembrado con solicitudesIniciales) detrás de una interfaz estable, para
 * que SolicitudesContext no conozca el mecanismo de persistencia — el día
 * que exista un backend real, solo cambia este archivo.
 */
export const solicitudesRepository = {
  listar(): Solicitud[] {
    return cargar()
  },

  obtener(id: string): Solicitud | undefined {
    return cargar().find((s) => s.id === id)
  },

  crear(data: SolicitudFormData): Solicitud {
    const solicitudes = cargar()
    const fecha = new Date().toISOString().slice(0, 10)
    const recibida: Solicitud = {
      id: siguienteId(solicitudes),
      fechaSolicitud: fecha,
      estado: 'Recibida',
      data,
      recomendacion: generarRecomendacion(data),
      historialEstados: historialInicial(fecha),
    }
    // El motor de recomendación ya corrió (la "IA" ya analizó la solicitud),
    // así que el estado avanza de una vez a "En análisis" para reflejar eso.
    const nueva = avanzarEstado(recibida, fecha)
    guardar([nueva, ...solicitudes])
    return nueva
  },

  avanzar(id: string): Solicitud | undefined {
    const solicitudes = cargar()
    let actualizada: Solicitud | undefined
    const siguientes = solicitudes.map((s) => {
      if (s.id !== id) return s
      actualizada = avanzarEstado(s)
      return actualizada
    })
    if (actualizada) guardar(siguientes)
    return actualizada
  },

  reiniciar(): Solicitud[] {
    guardar(solicitudesIniciales)
    return solicitudesIniciales
  },
}
