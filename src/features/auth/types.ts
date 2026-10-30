export type RolUsuario = 'cliente' | 'admin'

export type ProveedorAuth = 'correo' | 'google' | 'facebook'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  /** Cómo entró: con correo y contraseña o con una cuenta de Google/Facebook. */
  proveedor?: ProveedorAuth
  /** Foto de perfil que entrega Google o Facebook. */
  avatarUrl?: string
  /** Cuenta de demostración del prototipo (ve las solicitudes de ejemplo sin dueño). */
  demo?: boolean
}
