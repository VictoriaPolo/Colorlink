import type { Solicitud } from './types'

/** Lo mínimo que hace falta saber de quien mira (lo cumple el usuario de la sesión). */
export interface Observador {
  email: string
  rol: 'cliente' | 'admin'
  /** Cuenta de demostración: puede ver las solicitudes de ejemplo que no tienen dueño. */
  demo?: boolean
}

const mismoCorreo = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/**
 * Qué solicitudes ve cada quien: el equipo, todas; un cliente, solo las suyas.
 * Las de ejemplo (sin dueño) solo las ven las cuentas de demostración, para que
 * un cliente recién registrado no vea los datos de otra empresa.
 * ponytail: es un filtro de pantalla; con Supabase la protección real son las
 * políticas RLS por usuario (ver supabase/schema_cuentas_y_panel.sql).
 */
export function puedeVerSolicitud(solicitud: Solicitud, quien: Observador | null | undefined): boolean {
  if (!quien) return false
  if (quien.rol === 'admin') return true
  if (solicitud.propietario) return mismoCorreo(solicitud.propietario, quien.email)
  return quien.demo === true
}
