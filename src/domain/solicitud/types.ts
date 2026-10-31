import type { PatologiaKit } from '@/domain/tienda/types'

export type CanalEntrada =
  | 'Página web'
  | 'WhatsApp'
  | 'Llamada'
  | 'Punto físico'
  | 'Otro'

export type TipoObra =
  | 'Vivienda'
  | 'Edificio'
  | 'Local comercial'
  | 'Oficina'
  | 'Bodega'
  | 'Proyecto industrial'
  | 'Otro'

export type Superficie =
  | 'Interior'
  | 'Exterior'
  | 'Fachada'
  | 'Metal'
  | 'Madera'
  | 'Concreto'
  | 'Otro'

export type Ambiente =
  | 'Interior seco'
  | 'Interior húmedo'
  | 'Exterior'
  | 'Industrial'
  | 'Alta exposición'

export type CondicionActual =
  | 'Nueva'
  | 'Buen estado'
  | 'Desgastada'
  | 'Con humedad'
  | 'Con grietas'
  | 'Con pintura deteriorada'
  | 'Requiere reparación'

export type ColorAcabado =
  | 'Mate'
  | 'Satinado'
  | 'Brillante'
  | 'Antideslizante'
  | 'No estoy seguro'

export type EstadoSolicitud =
  | 'Recibida'
  | 'En análisis'
  | 'Solución propuesta'
  | 'En abastecimiento'
  | 'Servicio programado'
  | 'Finalizada'

/** Orden de avance del ciclo de vida de una solicitud. Fuente única de verdad
 * para la máquina de estados (ver domain/solicitud/estadoMachine.ts). */
export const ORDEN_ESTADOS: EstadoSolicitud[] = [
  'Recibida',
  'En análisis',
  'Solución propuesta',
  'En abastecimiento',
  'Servicio programado',
  'Finalizada',
]

export interface HistorialEstado {
  estado: EstadoSolicitud
  fecha: string
}

export interface IdentificacionData {
  cliente: string
  nit: string
  responsable: string
  canal: CanalEntrada | ''
}

export interface ProyectoData {
  ciudad: string
  tipoObra: TipoObra | ''
  areaAprox: string
  fechaRequerida: string
}

export interface TecnicaData {
  superficie: Superficie | ''
  ambiente: Ambiente | ''
  condicion: CondicionActual | ''
  colorAcabado: ColorAcabado | ''
}

/** Dónde está el problema, que el cliente elige antes de describirlo y subir la foto. */
export type ZonaAfectada = 'Pared' | 'Techo' | 'Piso' | 'Fachada' | 'Metal o reja' | 'Otra'

export const ZONAS_AFECTADAS: ZonaAfectada[] = ['Pared', 'Techo', 'Piso', 'Fachada', 'Metal o reja', 'Otra']

export interface EvidenciaData {
  descripcion: string
  imagenes: EvidenciaImagen[]
  observaciones: string
  consentimiento: boolean
  zona?: ZonaAfectada
}

export interface EvidenciaImagen {
  id: string
  nombre: string
  url: string
}

export interface SolicitudFormData {
  identificacion: IdentificacionData
  proyecto: ProyectoData
  tecnica: TecnicaData
  evidencia: EvidenciaData
}

export interface Recomendacion {
  tipoSolucion: string
  producto: string
  acabado: string
  cantidadEstimada: string
  aplicacion: string
  tiempoEstimado: string
  advertencias: string[]
  estadoTexto: string
}

export type PatologiaDetectada =
  | 'Moho y hongos'
  | 'Humedad y filtración'
  | 'Fisuras y grietas'
  | 'Óxido y corrosión'
  | 'Pintura descascarada'
  | 'Salitre'
  | 'Sin daños evidentes'

export type Severidad = 'Leve' | 'Moderada' | 'Severa'

/** Resultado de analizar la foto y la descripción del cliente (ver domain/diagnostico). */
export interface DiagnosticoImagen {
  generadoEn: string
  zona: ZonaAfectada
  patologia: PatologiaDetectada
  /** null cuando no se ven daños. */
  severidad: Severidad | null
  /** 0-100: qué tan seguro está el análisis. Sin foto nunca pasa de 55. */
  confianza: number
  origen: 'foto' | 'descripción' | 'foto y descripción'
  fotos: number
  resumen: string
  causaProbable: string
  /** Todo lo que se detectó, de mayor a menor intensidad (0-100). */
  hallazgos: { patologia: PatologiaDetectada; intensidad: number }[]
  tratamiento: { kit: PatologiaKit | null; productos: string[]; pasos: string[] }
  advertencias: string[]
}

export interface NotaInterna {
  id: string
  autor: string
  texto: string
  /** Fecha y hora ISO. */
  fecha: string
}

export interface Cancelacion {
  motivo: string
  /** Quién la canceló (nombre de la persona del equipo). */
  autor: string
  /** Fecha y hora ISO. */
  fecha: string
}

/** Lo que el equipo agrega a una solicitud: quién la atiende, sus notas internas
 * y si quedó cancelada (orthogonal al avance normal de estados: una solicitud
 * cancelada conserva su último estado, solo deja de poder avanzar). */
export interface GestionSolicitud {
  asignadoA?: string
  notas: NotaInterna[]
  cancelacion?: Cancelacion
}

export interface Solicitud {
  id: string
  fechaSolicitud: string
  estado: EstadoSolicitud
  data: SolicitudFormData
  recomendacion: Recomendacion
  historialEstados: HistorialEstado[]
  /** Correo de la cuenta que la creó; sin dueño solo la ven las cuentas de demostración y el equipo. */
  propietario?: string
  diagnostico?: DiagnosticoImagen
  gestion?: GestionSolicitud
}
