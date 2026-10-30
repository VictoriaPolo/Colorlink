import type { ProveedorAuth, Usuario } from '@/features/auth/types'

export interface DatosRegistro {
  nombre: string
  email: string
  password: string
}

/** Cuenta con la que se entra con Google/Facebook cuando no hay proveedor real (modo demostración). */
export interface IdentidadDemo {
  nombre: string
  email: string
}

export type ProveedorSocial = Exclude<ProveedorAuth, 'correo'>

export type ResultadoAuth =
  | { ok: true; usuario: Usuario }
  /** No hay sesión todavía: falta confirmar el correo, o el navegador se está yendo a Google/Facebook. */
  | { ok: true; pendiente: 'confirmar-correo' | 'redireccion' }
  | { ok: false; error: string }

/** Contrato común entre el acceso local (demostración) y Supabase Auth. */
export interface AuthRepository {
  /** true si Google/Facebook son reales (Supabase Auth); false en el modo demostración local. */
  readonly proveedoresReales: boolean
  restaurarSesion(): Promise<Usuario | null>
  iniciarSesion(email: string, password: string): Promise<ResultadoAuth>
  registrar(datos: DatosRegistro): Promise<ResultadoAuth>
  iniciarConProveedor(proveedor: ProveedorSocial, identidadDemo?: IdentidadDemo): Promise<ResultadoAuth>
  cerrarSesion(): Promise<void>
  /** Solo Supabase: avisa cuando la sesión cambia fuera de la app (volver de Google, sesión vencida). */
  alCambiarSesion?(callback: (usuario: Usuario | null) => void): () => void
}
