import { describe, it, expect } from 'vitest'
import { loginSchema, registroSchema, erroresPorCampo, fuerzaPassword } from './schemas'

const valido = { nombre: 'Ana Gómez', email: 'ana@correo.com', password: 'pintura2026', confirmar: 'pintura2026', acepta: true as const }

describe('registroSchema', () => {
  it('acepta un registro completo', () => {
    expect(registroSchema.safeParse(valido).success).toBe(true)
  })

  it('exige correo válido, contraseña de 8+ con letra y número, y que coincidan', () => {
    const casos: [Partial<typeof valido>, string, string][] = [
      [{ email: 'no-es-correo' }, 'email', 'correo válido'],
      [{ password: 'corta1', confirmar: 'corta1' }, 'password', '8 caracteres'],
      [{ password: 'sololetras', confirmar: 'sololetras' }, 'password', 'número'],
      [{ password: '12345678', confirmar: '12345678' }, 'password', 'letra'],
      [{ confirmar: 'distinta123' }, 'confirmar', 'no coinciden'],
      [{ nombre: 'A' }, 'nombre', 'nombre completo'],
    ]
    for (const [cambio, campo, texto] of casos) {
      const r = registroSchema.safeParse({ ...valido, ...cambio })
      expect(r.success).toBe(false)
      if (!r.success) expect(erroresPorCampo(r.error.issues)[campo]).toContain(texto)
    }
  })

  it('exige aceptar los términos', () => {
    const r = registroSchema.safeParse({ ...valido, acepta: false })
    expect(r.success).toBe(false)
    if (!r.success) expect(erroresPorCampo(r.error.issues).acepta).toContain('términos')
  })
})

describe('loginSchema', () => {
  it('pide correo válido y contraseña', () => {
    expect(loginSchema.safeParse({ email: 'ana@correo.com', password: 'x' }).success).toBe(true)
    expect(loginSchema.safeParse({ email: 'ana', password: '' }).success).toBe(false)
  })
})

describe('fuerzaPassword', () => {
  it('sube con el largo y la variedad de caracteres', () => {
    expect(fuerzaPassword('')).toBe(0)
    expect(fuerzaPassword('abc')).toBe(1)
    expect(fuerzaPassword('pintura2026')).toBeLessThan(fuerzaPassword('Pintura#2026-Azul'))
    expect(fuerzaPassword('Pintura#2026-Azul')).toBe(4)
  })
})
