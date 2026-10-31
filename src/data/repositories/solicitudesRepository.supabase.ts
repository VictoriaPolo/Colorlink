import type {
  Ambiente,
  CanalEntrada,
  Cancelacion,
  ColorAcabado,
  CondicionActual,
  DiagnosticoImagen,
  EstadoSolicitud,
  NotaInterna,
  Solicitud,
  SolicitudFormData,
  Superficie,
  TipoObra,
} from '@/domain/solicitud/types'
import { generarRecomendacion } from '@/domain/solicitud/recommendationEngine'
import { avanzarEstado } from '@/domain/solicitud/estadoMachine'
import { supabase } from '@/data/supabaseClient'
import type { OpcionesCrearSolicitud, SolicitudesRepository } from './solicitudesRepository.types'

/**
 * Repositorio real: lee y escribe en las tablas de supabase/schema.sql.
 * Cada método solo se llama cuando `supabase` no es null (ver
 * solicitudesRepository.ts), pero igual se valida por si acaso.
 */
function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado (faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).')
  return supabase
}

const SELECT_SOLICITUD = `
  id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida,
  clientes ( nombre, nit ),
  especificaciones_tecnicas ( superficie, ambiente, condicion, color_acabado ),
  evidencias ( descripcion, observaciones, consentimiento, imagenes_evidencia ( id, nombre, url ) ),
  recomendaciones ( tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto, advertencias ( mensaje ) ),
  historial_estados ( estado, fecha )
`

// PostgREST embebe una relación 1:1 (por la UNIQUE en la FK) como objeto o
// como arreglo de un elemento según la versión — se normaliza para no
// depender de ese detalle.
function unoOMuchos<T>(valor: T | T[] | null | undefined): T | undefined {
  if (!valor) return undefined
  return Array.isArray(valor) ? valor[0] : valor
}

interface ImagenRow {
  id: number | string
  nombre: string
  url: string
}
interface EvidenciaRow {
  descripcion: string | null
  observaciones: string | null
  consentimiento: boolean
  imagenes_evidencia: ImagenRow[]
}
interface AdvertenciaRow {
  mensaje: string
}
interface RecomendacionRow {
  tipo_solucion: string
  producto: string
  acabado: string
  cantidad_estimada: string
  aplicacion: string
  tiempo_estimado: string
  estado_texto: string
  advertencias: AdvertenciaRow[]
}
interface HistorialRow {
  estado: string
  fecha: string
}
interface SolicitudRow {
  id: string
  responsable: string
  canal_entrada: string
  fecha_solicitud: string
  estado: string
  ciudad: string
  tipo_obra: string
  area_aprox_m2: number | null
  fecha_requerida: string | null
  clientes: { nombre: string; nit: string } | { nombre: string; nit: string }[] | null
  especificaciones_tecnicas:
    | { superficie: string; ambiente: string; condicion: string; color_acabado: string }
    | { superficie: string; ambiente: string; condicion: string; color_acabado: string }[]
    | null
  evidencias: EvidenciaRow | EvidenciaRow[] | null
  recomendaciones: RecomendacionRow | RecomendacionRow[] | null
  historial_estados: HistorialRow[]
}

function mapRowToSolicitud(row: SolicitudRow): Solicitud {
  const cliente = unoOMuchos(row.clientes)
  const especificacion = unoOMuchos(row.especificaciones_tecnicas)
  const evidencia = unoOMuchos(row.evidencias)
  const recomendacion = unoOMuchos(row.recomendaciones)

  return {
    id: row.id,
    fechaSolicitud: row.fecha_solicitud,
    estado: row.estado as EstadoSolicitud,
    data: {
      identificacion: {
        cliente: cliente?.nombre ?? '',
        nit: cliente?.nit ?? '',
        responsable: row.responsable ?? '',
        canal: (row.canal_entrada ?? '') as CanalEntrada | '',
      },
      proyecto: {
        ciudad: row.ciudad ?? '',
        tipoObra: (row.tipo_obra ?? '') as TipoObra | '',
        areaAprox: row.area_aprox_m2 != null ? String(row.area_aprox_m2) : '',
        fechaRequerida: row.fecha_requerida ?? '',
      },
      tecnica: {
        superficie: (especificacion?.superficie ?? '') as Superficie | '',
        ambiente: (especificacion?.ambiente ?? '') as Ambiente | '',
        condicion: (especificacion?.condicion ?? '') as CondicionActual | '',
        colorAcabado: (especificacion?.color_acabado ?? '') as ColorAcabado | '',
      },
      evidencia: {
        descripcion: evidencia?.descripcion ?? '',
        observaciones: evidencia?.observaciones ?? '',
        consentimiento: evidencia?.consentimiento ?? false,
        imagenes: (evidencia?.imagenes_evidencia ?? []).map((img) => ({
          id: String(img.id),
          nombre: img.nombre,
          url: img.url,
        })),
      },
    },
    recomendacion: {
      tipoSolucion: recomendacion?.tipo_solucion ?? '',
      producto: recomendacion?.producto ?? '',
      acabado: recomendacion?.acabado ?? '',
      cantidadEstimada: recomendacion?.cantidad_estimada ?? '',
      aplicacion: recomendacion?.aplicacion ?? '',
      tiempoEstimado: recomendacion?.tiempo_estimado ?? '',
      advertencias: (recomendacion?.advertencias ?? []).map((a) => a.mensaje),
      estadoTexto: recomendacion?.estado_texto ?? '',
    },
    historialEstados: (row.historial_estados ?? [])
      .slice()
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((h) => ({ estado: h.estado as EstadoSolicitud, fecha: h.fecha })),
  }
}

async function obtenerPorId(id: string): Promise<Solicitud | undefined> {
  const { data, error } = await requireClient()
    .from('solicitudes')
    .select(SELECT_SOLICITUD)
    .eq('id', id)
    .order('fecha', { referencedTable: 'historial_estados', ascending: true })
    .maybeSingle()
  if (error) throw error
  if (!data) return undefined
  const extras = await leerExtras(id)
  return conExtras(mapRowToSolicitud(data), extras.get(id))
}

/**
 * Dueño, diagnóstico, asignación y notas viven en la tabla extras_solicitud
 * (supabase/schema_cuentas_y_panel.sql) para no tocar el esquema original.
 */
interface ExtrasRow {
  solicitud_id: string
  usuario_email: string | null
  diagnostico: DiagnosticoImagen | null
  asignado_a: string | null
  notas: NotaInterna[] | null
  cancelacion: Cancelacion | null
}

const FALTA_EXTRAS =
  'Falta la tabla extras_solicitud en Supabase: ejecuta supabase/schema_cuentas_y_panel.sql en el SQL Editor y vuelve a intentar.'

/** Sin la tabla (todavía no se corrió el SQL) la lectura sigue funcionando, solo que sin dueño ni gestión. */
async function leerExtras(id?: string): Promise<Map<string, ExtrasRow>> {
  const consulta = requireClient().from('extras_solicitud').select('*')
  const { data, error } = await (id ? consulta.eq('solicitud_id', id) : consulta)
  if (error) return new Map()
  return new Map((data as ExtrasRow[]).map((fila) => [fila.solicitud_id, fila]))
}

function conExtras(solicitud: Solicitud, extras: ExtrasRow | undefined): Solicitud {
  if (!extras) return solicitud
  return {
    ...solicitud,
    propietario: extras.usuario_email ?? undefined,
    diagnostico: extras.diagnostico ?? undefined,
    gestion: { asignadoA: extras.asignado_a ?? undefined, notas: extras.notas ?? [], cancelacion: extras.cancelacion ?? undefined },
  }
}

async function guardarExtras(id: string, cambios: Partial<Omit<ExtrasRow, 'solicitud_id'>>): Promise<void> {
  const { error } = await requireClient()
    .from('extras_solicitud')
    .upsert({ solicitud_id: id, ...cambios }, { onConflict: 'solicitud_id' })
  if (error) throw new Error(FALTA_EXTRAS)
}

export const solicitudesRepositorySupabase: SolicitudesRepository = {
  async listar() {
    const { data, error } = await requireClient()
      .from('solicitudes')
      .select(SELECT_SOLICITUD)
      .order('created_at', { ascending: false })
      .order('fecha', { referencedTable: 'historial_estados', ascending: true })
    if (error) throw error
    const extras = await leerExtras()
    return (data ?? []).map((fila) => conExtras(mapRowToSolicitud(fila), extras.get(fila.id)))
  },

  async obtener(id) {
    return obtenerPorId(id)
  },

  async crear(data: SolicitudFormData, opciones: OpcionesCrearSolicitud = {}) {
    const client = requireClient()
    // Sin la tabla no se puede guardar el dueño: mejor avisar antes de crear nada a medias.
    const { error: sinExtras } = await client.from('extras_solicitud').select('solicitud_id').limit(1)
    if (sinExtras) throw new Error(FALTA_EXTRAS)
    const { identificacion, proyecto, tecnica, evidencia } = data

    // 1) Cliente: upsert por NIT para no crear una fila nueva por cada
    // solicitud de la misma empresa.
    const { data: cliente, error: clienteError } = await client
      .from('clientes')
      .upsert({ nombre: identificacion.cliente, nit: identificacion.nit }, { onConflict: 'nit' })
      .select('id')
      .single()
    if (clienteError) throw clienteError

    // 2) Solicitud (el id 'CL-XXXX' y fecha_solicitud los genera la base de datos).
    const { data: solicitudRow, error: solicitudError } = await client
      .from('solicitudes')
      .insert({
        cliente_id: cliente.id,
        responsable: identificacion.responsable,
        canal_entrada: identificacion.canal,
        ciudad: proyecto.ciudad,
        tipo_obra: proyecto.tipoObra,
        area_aprox_m2: proyecto.areaAprox ? Number(proyecto.areaAprox) : null,
        fecha_requerida: proyecto.fechaRequerida || null,
        estado: 'Recibida',
      })
      .select('id, fecha_solicitud')
      .single()
    if (solicitudError) throw solicitudError
    const solicitudId = solicitudRow.id as string
    const fecha = solicitudRow.fecha_solicitud as string

    // 3) Especificación técnica
    const { error: especError } = await client.from('especificaciones_tecnicas').insert({
      solicitud_id: solicitudId,
      superficie: tecnica.superficie,
      ambiente: tecnica.ambiente,
      condicion: tecnica.condicion,
      color_acabado: tecnica.colorAcabado,
    })
    if (especError) throw especError

    // 4) Evidencia + imágenes. Nota: las imágenes hoy son blob URLs locales
    // del navegador (ver FileDropzone.tsx) — se guarda la referencia tal cual
    // por ahora; para que sobrevivan a un reload real hace falta subirlas a
    // Supabase Storage, fuera del alcance de esta integración inicial.
    const { data: evidenciaRow, error: evidenciaError } = await client
      .from('evidencias')
      .insert({
        solicitud_id: solicitudId,
        descripcion: evidencia.descripcion,
        observaciones: evidencia.observaciones,
        consentimiento: evidencia.consentimiento,
      })
      .select('id')
      .single()
    if (evidenciaError) throw evidenciaError

    if (evidencia.imagenes.length > 0) {
      const { error: imagenesError } = await client.from('imagenes_evidencia').insert(
        evidencia.imagenes.map((img) => ({
          evidencia_id: evidenciaRow.id,
          nombre: img.nombre,
          url: img.url,
        })),
      )
      if (imagenesError) throw imagenesError
    }

    // 5) Recomendación (la "IA" sigue siendo el motor de reglas en el
    // navegador, ver recommendationEngine.ts) + advertencias.
    const recomendacion = generarRecomendacion(data, opciones.diagnostico)
    const { data: recomendacionRow, error: recomendacionError } = await client
      .from('recomendaciones')
      .insert({
        solicitud_id: solicitudId,
        tipo_solucion: recomendacion.tipoSolucion,
        producto: recomendacion.producto,
        acabado: recomendacion.acabado,
        cantidad_estimada: recomendacion.cantidadEstimada,
        aplicacion: recomendacion.aplicacion,
        tiempo_estimado: recomendacion.tiempoEstimado,
        estado_texto: recomendacion.estadoTexto,
      })
      .select('id')
      .single()
    if (recomendacionError) throw recomendacionError

    if (recomendacion.advertencias.length > 0) {
      const { error: advertenciasError } = await client
        .from('advertencias')
        .insert(recomendacion.advertencias.map((mensaje) => ({ recomendacion_id: recomendacionRow.id, mensaje })))
      if (advertenciasError) throw advertenciasError
    }

    // 6) Historial + avance automático a "En análisis" — misma regla que el
    // repositorio local: la recomendación ya corrió, la solicitud ya no está
    // "recién recibida".
    const { error: historialError } = await client.from('historial_estados').insert([
      { solicitud_id: solicitudId, estado: 'Recibida', fecha },
      { solicitud_id: solicitudId, estado: 'En análisis', fecha },
    ])
    if (historialError) throw historialError

    const { error: avanceError } = await client
      .from('solicitudes')
      .update({ estado: 'En análisis' })
      .eq('id', solicitudId)
    if (avanceError) throw avanceError

    await guardarExtras(solicitudId, {
      usuario_email: opciones.propietario ?? null,
      diagnostico: opciones.diagnostico ?? null,
    })

    const creada = await obtenerPorId(solicitudId)
    if (!creada) throw new Error('La solicitud se creó pero no se pudo volver a leer.')
    return creada
  },

  async avanzar(id) {
    const client = requireClient()
    const actual = await obtenerPorId(id)
    if (!actual) return undefined

    const avanzada = avanzarEstado(actual)
    if (avanzada.estado === actual.estado) return actual

    const fecha = new Date().toISOString().slice(0, 10)
    const { error: updateError } = await client.from('solicitudes').update({ estado: avanzada.estado }).eq('id', id)
    if (updateError) throw updateError

    const { error: historialError } = await client
      .from('historial_estados')
      .insert({ solicitud_id: id, estado: avanzada.estado, fecha })
    if (historialError) throw historialError

    return obtenerPorId(id)
  },

  async asignar(id, responsable) {
    if (!(await obtenerPorId(id))) return undefined
    await guardarExtras(id, { asignado_a: responsable ?? null })
    return obtenerPorId(id)
  },

  async agregarNota(id, autor, texto) {
    const actual = await obtenerPorId(id)
    if (!actual) return undefined
    const nota: NotaInterna = { id: `${id}-n${Date.now()}`, autor, texto: texto.trim(), fecha: new Date().toISOString() }
    await guardarExtras(id, { notas: [...(actual.gestion?.notas ?? []), nota] })
    return obtenerPorId(id)
  },

  async cancelar(id, autor, motivo) {
    if (!(await obtenerPorId(id))) return undefined
    const cancelacion: Cancelacion = { motivo: motivo.trim(), autor, fecha: new Date().toISOString() }
    await guardarExtras(id, { cancelacion })
    return obtenerPorId(id)
  },

  async reactivar(id) {
    if (!(await obtenerPorId(id))) return undefined
    await guardarExtras(id, { cancelacion: null })
    return obtenerPorId(id)
  },
}
