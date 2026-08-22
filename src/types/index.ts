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

export interface EvidenciaData {
  descripcion: string
  imagenes: EvidenciaImagen[]
  observaciones: string
  consentimiento: boolean
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

export interface Solicitud {
  id: string
  fechaSolicitud: string
  estado: EstadoSolicitud
  data: SolicitudFormData
  recomendacion: Recomendacion
}
