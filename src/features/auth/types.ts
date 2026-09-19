export type RolUsuario = 'cliente' | 'admin'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
}
