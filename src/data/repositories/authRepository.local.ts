import type { Usuario } from '@/features/auth/types'
import { validarCredenciales, esCorreoDemo } from '@/features/auth/mockUsuarios'
import { readStorage, writeStorage, clearStorage } from './storage'
import type { AuthRepository, ResultadoAuth } from './authRepository.types'

const USUARIOS_KEY = 'colorlink:usuarios'
const SESION_KEY = 'colorlink:sesion'
const VERSION = 1

interface UsuarioGuardado extends Usuario {
  sal?: string
  huella?: string
}

const NOMBRE_PROVEEDOR = { google: 'Google', facebook: 'Facebook', correo: 'correo' } as const

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

/** PBKDF2-SHA256 con sal propia: así la contraseña no queda en texto plano en el navegador. */
async function huella(password: string, sal: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: new TextEncoder().encode(sal), iterations: 100_000 },
    material,
    256,
  )
  return hex(new Uint8Array(bits))
}

/** Compara sin cortar en la primera diferencia. */
function iguales(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diferencia = 0
  for (let i = 0; i < a.length; i++) diferencia |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diferencia === 0
}

const guardados = () => readStorage<UsuarioGuardado[]>(USUARIOS_KEY, VERSION) ?? []

function publico({ sal: _sal, huella: _huella, ...usuario }: UsuarioGuardado): Usuario {
  return usuario
}

function abrirSesion(usuario: Usuario): ResultadoAuth {
  writeStorage(SESION_KEY, VERSION, usuario)
  return { ok: true, usuario }
}

/** Cuentas de demostración + cuentas registradas en este navegador (localStorage).
 * ponytail: no hay servidor; esto sirve para probar el flujo completo sin
 * Supabase. Con Supabase configurado, ver authRepository.supabase.ts. */
export const authRepositoryLocal: AuthRepository = {
  proveedoresReales: false,

  async restaurarSesion() {
    return readStorage<Usuario>(SESION_KEY, VERSION)
  },

  async iniciarSesion(email, password) {
    const demo = validarCredenciales(email, password)
    if (demo) return abrirSesion(demo)

    const correo = email.trim().toLowerCase()
    const cuenta = guardados().find((u) => u.email === correo)
    if (cuenta && !cuenta.huella) {
      const de = NOMBRE_PROVEEDOR[cuenta.proveedor ?? 'correo']
      return { ok: false, error: `Esta cuenta se creó con ${de}. Entra con el botón de ${de}.` }
    }
    if (cuenta?.sal && cuenta.huella && iguales(await huella(password, cuenta.sal), cuenta.huella)) {
      return abrirSesion(publico(cuenta))
    }
    return { ok: false, error: 'Correo o contraseña incorrectos.' }
  },

  async registrar({ nombre, email, password }) {
    const correo = email.trim().toLowerCase()
    if (esCorreoDemo(correo) || guardados().some((u) => u.email === correo)) {
      return { ok: false, error: 'Ya existe una cuenta con ese correo. Inicia sesión.' }
    }
    const sal = hex(crypto.getRandomValues(new Uint8Array(16)))
    const nuevo: UsuarioGuardado = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      nombre: nombre.trim(),
      email: correo,
      rol: 'cliente',
      proveedor: 'correo',
      sal,
      huella: await huella(password, sal),
    }
    writeStorage(USUARIOS_KEY, VERSION, [...guardados(), nuevo])
    return abrirSesion(publico(nuevo))
  },

  async iniciarConProveedor(proveedor, identidad) {
    if (!identidad) return { ok: false, error: 'Escribe tu nombre y correo para continuar.' }
    const correo = identidad.email.trim().toLowerCase()
    if (esCorreoDemo(correo)) {
      return { ok: false, error: 'Ese correo es de una cuenta de demostración. Usa otro.' }
    }
    // Misma persona: si el correo ya tiene cuenta, se entra a ella (como hacen Google y Facebook).
    const existente = guardados().find((u) => u.email === correo)
    if (existente) return abrirSesion(publico(existente))

    const nuevo: UsuarioGuardado = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      nombre: identidad.nombre.trim(),
      email: correo,
      rol: 'cliente',
      proveedor,
    }
    writeStorage(USUARIOS_KEY, VERSION, [...guardados(), nuevo])
    return abrirSesion(publico(nuevo))
  },

  async cerrarSesion() {
    clearStorage(SESION_KEY)
  },
}

/** Sesión de una cuenta de demostración, para que el repositorio de Supabase la reutilice. */
export function sesionDemo(email: string, password: string): ResultadoAuth | null {
  const demo = validarCredenciales(email, password)
  return demo ? abrirSesion(demo) : null
}

export function sesionLocalGuardada(): Usuario | null {
  return readStorage<Usuario>(SESION_KEY, VERSION)
}

export function olvidarSesionLocal(): void {
  clearStorage(SESION_KEY)
}
