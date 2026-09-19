import type { Solicitud, SolicitudFormData } from '@/domain/solicitud/types'

/** Contrato común entre el repositorio de localStorage y el de Supabase —
 * SolicitudesContext no necesita saber cuál de los dos está activo. */
export interface SolicitudesRepository {
  listar(): Promise<Solicitud[]>
  obtener(id: string): Promise<Solicitud | undefined>
  crear(data: SolicitudFormData): Promise<Solicitud>
  avanzar(id: string): Promise<Solicitud | undefined>
}
