import type { Usuario } from './types'

interface CuentaDemo extends Usuario {
  password: string
}

/**
 * Cuentas de demostración, siempre disponibles aunque no haya registro ni
 * Supabase: dos clientes (ven las solicitudes de ejemplo) y la cuenta del
 * equipo, que recibe las solicitudes de todos los clientes y ejecuta la
 * solución. Los clientes nuevos se crean con "Crear cuenta".
 */
export const cuentasDemo: CuentaDemo[] = [
  {
    id: 'usr-1',
    nombre: 'Laura Polo',
    email: 'laura@colorlink.com',
    password: 'colorlink123',
    rol: 'cliente',
    proveedor: 'correo',
    demo: true,
  },
  {
    id: 'usr-2',
    nombre: 'Carlos Restrepo',
    email: 'carlos@colorlink.com',
    password: 'colorlink123',
    rol: 'cliente',
    proveedor: 'correo',
    demo: true,
  },
  {
    id: 'usr-admin',
    nombre: 'Equipo COLORLINK',
    email: 'admin@colorlink.com',
    password: 'admin123',
    rol: 'admin',
    proveedor: 'correo',
    demo: true,
  },
]

export function validarCredenciales(email: string, password: string): Usuario | null {
  const cuenta = cuentasDemo.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
  )
  if (!cuenta) return null
  const { password: _omitida, ...usuario } = cuenta
  return usuario
}

export function esCorreoDemo(email: string): boolean {
  return cuentasDemo.some((c) => c.email.toLowerCase() === email.trim().toLowerCase())
}
