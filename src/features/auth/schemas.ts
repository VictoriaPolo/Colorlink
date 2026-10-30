import { z } from 'zod'

const correo = z.email({ message: 'Escribe un correo válido.' })

export const loginSchema = z.object({
  email: correo,
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

export const registroSchema = z
  .object({
    nombre: z.string().trim().min(2, 'Escribe tu nombre completo.'),
    email: correo,
    password: z
      .string()
      .min(8, 'Usa al menos 8 caracteres.')
      .regex(/[a-zA-Z]/, 'Incluye al menos una letra.')
      .regex(/\d/, 'Incluye al menos un número.'),
    confirmar: z.string(),
    acepta: z.literal(true, { message: 'Debes aceptar los términos para crear tu cuenta.' }),
  })
  .refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden.' })

export const identidadDemoSchema = z.object({
  nombre: z.string().trim().min(2, 'Escribe tu nombre.'),
  email: correo,
})

/** Primer mensaje de error por campo, para mostrarlo bajo cada control. */
export function erroresPorCampo(issues: z.ZodIssue[]): Record<string, string> {
  const errores: Record<string, string> = {}
  for (const issue of issues) {
    const campo = String(issue.path[0])
    if (!(campo in errores)) errores[campo] = issue.message
  }
  return errores
}

/** 0 (vacía) a 4 (fuerte): largo, mayúsculas y minúsculas, números y símbolos. */
export function fuerzaPassword(password: string): 0 | 1 | 2 | 3 | 4 {
  if (!password) return 0
  let puntos = 0
  if (password.length >= 8) puntos++
  if (password.length >= 12) puntos++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++
  if (/\d/.test(password) && /[^a-zA-Z0-9]/.test(password)) puntos++
  return Math.max(1, puntos) as 1 | 2 | 3 | 4
}
