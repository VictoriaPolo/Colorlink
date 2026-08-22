import type { Usuario } from './types'

interface CuentaDemo extends Usuario {
  password: string
}

/**
 * Directorio de cuentas de demostración. No hay backend de autenticación
 * real: esto simula la validación de credenciales contra una base de
 * usuarios, suficiente para el alcance del proyecto (solo cliente).
 */
export const cuentasDemo: CuentaDemo[] = [
  {
    id: 'usr-1',
    nombre: 'Laura Polo',
    email: 'laura@colorlink.com',
    password: 'colorlink123',
  },
  {
    id: 'usr-2',
    nombre: 'Carlos Restrepo',
    email: 'carlos@colorlink.com',
    password: 'colorlink123',
  },
]

export function validarCredenciales(email: string, password: string): Usuario | null {
  const cuenta = cuentasDemo.find(
    (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
  )
  if (!cuenta) return null
  return { id: cuenta.id, nombre: cuenta.nombre, email: cuenta.email }
}
