import type { DiagnosticoImagen, Solicitud, SolicitudFormData } from '@/domain/solicitud/types'

export interface OpcionesCrearSolicitud {
  /** Correo de la cuenta que la crea: solo esa cuenta (y el equipo) la verá. */
  propietario?: string
  /** Diagnóstico por imagen calculado en el asistente; también orienta la recomendación. */
  diagnostico?: DiagnosticoImagen
}

/** Contrato común entre el repositorio de localStorage y el de Supabase —
 * SolicitudesContext no necesita saber cuál de los dos está activo. */
export interface SolicitudesRepository {
  listar(): Promise<Solicitud[]>
  obtener(id: string): Promise<Solicitud | undefined>
  crear(data: SolicitudFormData, opciones?: OpcionesCrearSolicitud): Promise<Solicitud>
  avanzar(id: string): Promise<Solicitud | undefined>
  /** Equipo: quién atiende la solicitud (sin responsable, la deja sin asignar). */
  asignar(id: string, responsable: string | undefined): Promise<Solicitud | undefined>
  /** Equipo: nota interna que el cliente no ve. */
  agregarNota(id: string, autor: string, texto: string): Promise<Solicitud | undefined>
  /** Equipo: cierra el caso sin avanzarlo más (el cliente no respondió, no aplica, etc.). */
  cancelar(id: string, autor: string, motivo: string): Promise<Solicitud | undefined>
  /** Equipo: deshace una cancelación, por si se marcó por error. */
  reactivar(id: string): Promise<Solicitud | undefined>
}
