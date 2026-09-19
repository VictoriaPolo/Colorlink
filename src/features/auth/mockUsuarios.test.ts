import { describe, it, expect } from 'vitest'
import { validarCredenciales, cuentasDemo } from './mockUsuarios'

describe('validarCredenciales', () => {
  it('reconoce una cuenta de cliente y devuelve rol "cliente"', () => {
    const cliente = cuentasDemo.find((c) => c.rol === 'cliente')!
    const usuario = validarCredenciales(cliente.email, cliente.password)
    expect(usuario?.rol).toBe('cliente')
  })

  it('reconoce una cuenta de administrador y devuelve rol "admin"', () => {
    const admin = cuentasDemo.find((c) => c.rol === 'admin')!
    const usuario = validarCredenciales(admin.email, admin.password)
    expect(usuario?.rol).toBe('admin')
  })

  it('rechaza credenciales incorrectas', () => {
    expect(validarCredenciales('nadie@colorlink.com', 'mala-clave')).toBeNull()
  })
})
