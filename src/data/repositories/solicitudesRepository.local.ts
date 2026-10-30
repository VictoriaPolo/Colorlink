import type { NotaInterna, Solicitud } from '@/domain/solicitud/types'
import { generarRecomendacion } from '@/domain/solicitud/recommendationEngine'
import { historialInicial, avanzarEstado } from '@/domain/solicitud/estadoMachine'
import { solicitudesIniciales } from '@/data/solicitudesSemilla'
import { readStorage, writeStorage } from './storage'
import type { SolicitudesRepository } from './solicitudesRepository.types'

const STORAGE_KEY = 'colorlink:solicitudes'
const STORAGE_VERSION = 2

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

/** Quita las fotos guardadas en el navegador (las de Internet pesan unos bytes y se conservan). */
function sinFotosLocales(s: Solicitud): Solicitud {
  const imagenes = s.data.evidencia.imagenes.filter((img) => !img.url.startsWith('data:'))
  return { ...s, data: { ...s.data, evidencia: { ...s.data.evidencia, imagenes } } }
}

function guardar(solicitudes: Solicitud[]): void {
  // Las fotos pesan: si no cabe todo, se van aligerando las solicitudes más viejas.
  for (const conservar of [solicitudes.length, 3, 1, 0]) {
    const lista = solicitudes.map((s, i) => (i < conservar ? s : sinFotosLocales(s)))
    if (writeStorage(STORAGE_KEY, STORAGE_VERSION, lista)) return
  }
}

/** Aplica un cambio a una solicitud y lo guarda; undefined si no existe. */
function modificar(id: string, cambio: (s: Solicitud) => Solicitud): Solicitud | undefined {
  let resultado: Solicitud | undefined
  const siguientes = cargar().map((s) => (s.id === id ? (resultado = cambio(s)) : s))
  if (resultado) guardar(siguientes)
  return resultado
}

/**
 * Respaldo cuando no hay Supabase configurado (ver src/data/supabaseClient.ts).
 * Mismo contrato async que el repositorio real de Supabase — internamente es
 * síncrono (localStorage no tiene latencia de red) pero se envuelve en
 * Promise para que el resto de la app no necesite saber cuál está activo.
 */
export const solicitudesRepositoryLocal: SolicitudesRepository = {
  async listar() {
    return cargar()
  },

  async obtener(id) {
    return cargar().find((s) => s.id === id)
  },

  async crear(data, opciones = {}) {
    const solicitudes = cargar()
    const fecha = new Date().toISOString().slice(0, 10)
    const recibida: Solicitud = {
      id: siguienteId(solicitudes),
      fechaSolicitud: fecha,
      estado: 'Recibida',
      data,
      recomendacion: generarRecomendacion(data, opciones.diagnostico),
      historialEstados: historialInicial(fecha),
      propietario: opciones.propietario,
      diagnostico: opciones.diagnostico,
    }
    // El motor de recomendación ya corrió (la "IA" ya analizó la solicitud),
    // así que el estado avanza de una vez a "En análisis" para reflejar eso.
    const nueva = avanzarEstado(recibida, fecha)
    guardar([nueva, ...solicitudes])
    return nueva
  },

  async avanzar(id) {
    return modificar(id, (s) => avanzarEstado(s))
  },

  async asignar(id, responsable) {
    return modificar(id, (s) => ({ ...s, gestion: { notas: s.gestion?.notas ?? [], asignadoA: responsable } }))
  },

  async agregarNota(id, autor, texto) {
    const nota: NotaInterna = { id: `${id}-n${Date.now()}`, autor, texto: texto.trim(), fecha: new Date().toISOString() }
    return modificar(id, (s) => ({ ...s, gestion: { ...s.gestion, notas: [...(s.gestion?.notas ?? []), nota] } }))
  },
}
