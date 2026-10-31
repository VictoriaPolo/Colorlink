import type { Pedido } from '@/domain/tienda/types'
import { normalizar } from '@/domain/texto'
import { estaFinalizada } from './estadoMachine'
import { ORDEN_ESTADOS, type EstadoSolicitud, type PatologiaDetectada, type Solicitud } from './types'

/**
 * Lógica del panel del equipo: qué atender primero, cómo filtrar y qué resumir.
 * Todo es puro (recibe `hoy`) para poder probarlo sin reloj ni navegador.
 */

export type Prioridad = 'Alta' | 'Media' | 'Baja'
export const PRIORIDADES: Prioridad[] = ['Alta', 'Media', 'Baja']

const DIA_MS = 86_400_000
const plural = (n: number, singular: string, pluralTexto: string) => `${n} ${n === 1 ? singular : pluralTexto}`

/** Días enteros desde `hoy` hasta una fecha AAAA-MM-DD (negativo si ya pasó); null si la fecha no es válida. */
export function diasHasta(fecha: string, hoy: Date): number | null {
  const destino = new Date(`${fecha}T00:00:00`)
  if (Number.isNaN(destino.getTime())) return null
  const origen = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  return Math.round((destino.getTime() - origen.getTime()) / DIA_MS)
}

/** Qué tan urgente es una solicitud y por qué: el daño que muestra la foto y la fecha en que el cliente la necesita. */
export function evaluarPrioridad(s: Solicitud, hoy = new Date()): { prioridad: Prioridad; motivos: string[] } {
  if (estaFinalizada(s.estado) || s.gestion?.cancelacion) return { prioridad: 'Baja', motivos: [] }
  const dias = diasHasta(s.data.proyecto.fechaRequerida, hoy)
  const severidad = s.diagnostico?.severidad
  const motivos: string[] = []
  let nivel = 0 // 0 baja, 1 media, 2 alta

  if (dias !== null && dias < 0) {
    motivos.push(`La fecha requerida venció hace ${plural(-dias, 'día', 'días')}`)
    nivel = 2
  } else if (dias !== null && dias <= 7) {
    motivos.push(dias === 0 ? 'Se requiere hoy' : `Se requiere en ${plural(dias, 'día', 'días')}`)
    nivel = 2
  } else if (dias !== null && dias <= 21) {
    motivos.push(`Se requiere en ${dias} días`)
    nivel = 1
  }
  if (severidad === 'Severa') {
    motivos.push('Daño severo en la foto')
    nivel = 2
  } else if (severidad === 'Moderada') {
    motivos.push('Daño moderado en la foto')
    nivel = Math.max(nivel, 1)
  }
  return { prioridad: PRIORIDADES[2 - nivel], motivos }
}

export const prioridadDe = (s: Solicitud, hoy = new Date()): Prioridad => evaluarPrioridad(s, hoy).prioridad

/** Lo más urgente primero; las finalizadas al final, de la más reciente a la más antigua. */
export function ordenarPorUrgencia(lista: Solicitud[], hoy = new Date()): Solicitud[] {
  const rango = (s: Solicitud) => (estaFinalizada(s.estado) || s.gestion?.cancelacion ? 3 : PRIORIDADES.indexOf(prioridadDe(s, hoy)))
  return [...lista].sort((a, b) => rango(a) - rango(b) || b.fechaSolicitud.localeCompare(a.fechaSolicitud))
}

export interface FiltrosSolicitud {
  texto: string
  estado: EstadoSolicitud | ''
  problema: PatologiaDetectada | ''
  prioridad: Prioridad | ''
  /** Nombre de quien la atiende, 'sin-asignar' o vacío para todas. */
  asignado: string
}

export const SIN_FILTROS: FiltrosSolicitud = { texto: '', estado: '', problema: '', prioridad: '', asignado: '' }

export function filtrarSolicitudes(lista: Solicitud[], f: FiltrosSolicitud, hoy = new Date()): Solicitud[] {
  const texto = normalizar(f.texto)
  return lista.filter((s) => {
    if (f.estado && s.estado !== f.estado) return false
    if (f.problema && s.diagnostico?.patologia !== f.problema) return false
    if (f.prioridad && prioridadDe(s, hoy) !== f.prioridad) return false
    if (f.asignado === 'sin-asignar' && s.gestion?.asignadoA) return false
    if (f.asignado && f.asignado !== 'sin-asignar' && s.gestion?.asignadoA !== f.asignado) return false
    if (!texto) return true
    const id = s.data.identificacion
    const pajar = [s.id, id.cliente, id.responsable, s.data.proyecto.ciudad, s.data.evidencia.descripcion, s.diagnostico?.patologia ?? '']
    return normalizar(pajar.join(' ')).includes(texto)
  })
}

export interface ResumenPanel {
  total: number
  activas: number
  finalizadas: number
  canceladas: number
  /** Activas que todavía no tienen a nadie del equipo. */
  sinAsignar: number
  prioridadAlta: number
  porEstado: Record<EstadoSolicitud, number>
  /** Solo las solicitudes con daño diagnosticado, de la más frecuente a la menos. */
  porProblema: { patologia: PatologiaDetectada; cantidad: number }[]
  /** Solicitudes recibidas en cada una de las últimas 8 semanas (de lunes a domingo). */
  porSemana: { desde: string; cantidad: number }[]
  pedidosPorAtender: number
  pedidosMes: number
  ventasMes: number
}

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

function lunesDe(d: Date): Date {
  const lunes = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  lunes.setDate(lunes.getDate() - ((lunes.getDay() + 6) % 7))
  return lunes
}

export function resumenPanel(solicitudes: Solicitud[], pedidos: Pedido[], hoy = new Date()): ResumenPanel {
  const canceladas = solicitudes.filter((s) => s.gestion?.cancelacion)
  const activas = solicitudes.filter((s) => !estaFinalizada(s.estado) && !s.gestion?.cancelacion)
  const porEstado = Object.fromEntries(ORDEN_ESTADOS.map((e) => [e, 0])) as Record<EstadoSolicitud, number>
  for (const s of solicitudes) porEstado[s.estado] += 1

  const conteo = new Map<PatologiaDetectada, number>()
  for (const s of solicitudes) {
    const p = s.diagnostico?.patologia
    if (p && p !== 'Sin daños evidentes') conteo.set(p, (conteo.get(p) ?? 0) + 1)
  }

  const inicioActual = lunesDe(hoy)
  const porSemana = Array.from({ length: 8 }, (_, i) => {
    const desde = new Date(inicioActual)
    desde.setDate(desde.getDate() - 7 * (7 - i))
    const hasta = new Date(desde)
    hasta.setDate(hasta.getDate() + 7)
    const [d, h] = [iso(desde), iso(hasta)]
    return { desde: d, cantidad: solicitudes.filter((s) => s.fechaSolicitud >= d && s.fechaSolicitud < h).length }
  })

  const mes = iso(hoy).slice(0, 7)
  const delMes = pedidos.filter((p) => p.fecha.startsWith(mes) && p.estado !== 'Cancelado')

  return {
    total: solicitudes.length,
    activas: activas.length,
    finalizadas: solicitudes.filter((s) => estaFinalizada(s.estado) && !s.gestion?.cancelacion).length,
    canceladas: canceladas.length,
    sinAsignar: activas.filter((s) => !s.gestion?.asignadoA).length,
    prioridadAlta: activas.filter((s) => prioridadDe(s, hoy) === 'Alta').length,
    porEstado,
    porProblema: [...conteo].map(([patologia, cantidad]) => ({ patologia, cantidad })).sort((a, b) => b.cantidad - a.cantidad),
    porSemana,
    pedidosPorAtender: pedidos.filter((p) => p.estado === 'Recibido' || p.estado === 'En preparación').length,
    pedidosMes: delMes.length,
    ventasMes: delMes.reduce((suma, p) => suma + p.total, 0),
  }
}

function diasEntreFechas(desde: string, hasta: string): number | null {
  const a = new Date(`${desde}T00:00:00`)
  const b = new Date(`${hasta}T00:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null
  return Math.round((b.getTime() - a.getTime()) / DIA_MS)
}

export interface TiempoEtapa {
  estado: EstadoSolicitud
  diasPromedio: number
  /** Cuántas solicitudes ya pasaron por esa etapa y se usaron para el promedio. */
  muestras: number
}

/** Cuánto tarda en promedio una solicitud en cada etapa antes de pasar a la
 * siguiente (SLA operativo) — solo cuenta tramos ya completados, a partir de
 * `historialEstados`. "Finalizada" no tiene tramo siguiente, así que no aplica. */
export function tiempoPromedioPorEtapa(solicitudes: Solicitud[]): TiempoEtapa[] {
  const sumas = new Map<EstadoSolicitud, { total: number; n: number }>()
  for (const s of solicitudes) {
    const historial = s.historialEstados
    for (let i = 0; i < historial.length - 1; i++) {
      const dias = diasEntreFechas(historial[i].fecha, historial[i + 1].fecha)
      if (dias === null || dias < 0) continue
      const acc = sumas.get(historial[i].estado) ?? { total: 0, n: 0 }
      acc.total += dias
      acc.n += 1
      sumas.set(historial[i].estado, acc)
    }
  }
  return ORDEN_ESTADOS.filter((e) => e !== 'Finalizada').map((estado) => {
    const acc = sumas.get(estado)
    return { estado, diasPromedio: acc ? acc.total / acc.n : 0, muestras: acc?.n ?? 0 }
  })
}

export interface EventoActividad {
  solicitudId: string
  /** AAAA-MM-DD, o con hora si fue una nota. */
  fecha: string
  texto: string
}

/** Lo último que pasó en las solicitudes: nuevas, cambios de estado y notas del equipo. */
export function actividadReciente(solicitudes: Solicitud[], limite = 6): EventoActividad[] {
  const eventos: EventoActividad[] = []
  for (const s of solicitudes) {
    s.historialEstados.forEach((h, i) => {
      const texto = i === 0 ? `Nueva solicitud de ${s.data.identificacion.cliente || 'un cliente'}` : `Pasó a "${h.estado}"`
      eventos.push({ solicitudId: s.id, fecha: h.fecha, texto })
    })
    for (const n of s.gestion?.notas ?? []) {
      eventos.push({ solicitudId: s.id, fecha: n.fecha, texto: `${n.autor} dejó una nota` })
    }
  }
  return eventos.sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, limite)
}

export interface ResumenCliente {
  clave: string
  nombre: string
  email: string
  ciudad: string
  solicitudes: number
  activas: number
  pedidos: number
  comprado: number
  ultimaActividad: string
}

/** Quién es cada cliente, juntando lo que pidió y lo que compró (por correo; sin correo, por nombre). */
export function clientesDe(solicitudes: Solicitud[], pedidos: Pedido[]): ResumenCliente[] {
  const clientes = new Map<string, ResumenCliente>()
  const obtener = (email: string, nombre: string, fecha: string) => {
    const clave = email.trim().toLowerCase() || normalizar(nombre)
    let c = clientes.get(clave)
    if (!c) {
      c = { clave, nombre, email: email.trim().toLowerCase(), ciudad: '', solicitudes: 0, activas: 0, pedidos: 0, comprado: 0, ultimaActividad: '' }
      clientes.set(clave, c)
    }
    if (fecha > c.ultimaActividad) {
      c.ultimaActividad = fecha
      c.nombre = nombre || c.nombre
    }
    return c
  }

  for (const s of solicitudes) {
    const ultima = s.historialEstados.reduce((max, h) => (h.fecha > max ? h.fecha : max), s.fechaSolicitud)
    const c = obtener(s.propietario ?? '', s.data.identificacion.cliente || s.data.identificacion.responsable, ultima)
    c.solicitudes += 1
    if (!estaFinalizada(s.estado)) c.activas += 1
    c.ciudad = c.ciudad || s.data.proyecto.ciudad
  }
  for (const p of pedidos) {
    const c = obtener(p.clienteEmail, p.clienteNombre, p.fecha)
    c.pedidos += 1
    if (p.estado !== 'Cancelado') c.comprado += p.total
  }
  return [...clientes.values()].sort((a, b) => b.ultimaActividad.localeCompare(a.ultimaActividad))
}
