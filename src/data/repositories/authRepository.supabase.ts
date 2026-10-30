import type { User } from '@supabase/supabase-js'
import type { ProveedorAuth, RolUsuario, Usuario } from '@/features/auth/types'
import { supabase } from '@/data/supabaseClient'
import { olvidarSesionLocal, sesionDemo, sesionLocalGuardada } from './authRepository.local'
import type { AuthRepository } from './authRepository.types'

function requireClient() {
  if (!supabase) throw new Error('Supabase no está configurado (faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).')
  return supabase
}

const MENSAJES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Correo o contraseña incorrectos.'],
  [/already registered|already been registered/i, 'Ya existe una cuenta con ese correo. Inicia sesión.'],
  [/email not confirmed/i, 'Confirma tu correo: te enviamos un enlace al registrarte.'],
  [/password should be at least|weak password/i, 'La contraseña es muy débil. Usa al menos 8 caracteres.'],
  [/rate limit|too many/i, 'Demasiados intentos. Espera un momento e inténtalo de nuevo.'],
  [/failed to fetch|network|fetch failed/i, 'No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.'],
  [/provider is not enabled|unsupported provider/i, 'Este acceso aún no está activado en Supabase (Authentication → Providers).'],
]

function traducir(error: { message?: string } | unknown): string {
  const mensaje = (error as { message?: string })?.message ?? ''
  return MENSAJES.find(([patron]) => patron.test(mensaje))?.[1] ?? 'No pudimos completar la operación. Inténtalo de nuevo.'
}

/** Usuario de la app a partir del de Supabase. El rol sale de la tabla `perfiles`
 * (supabase/schema_cuentas_y_panel.sql); si no existe, todos entran como clientes. */
async function aUsuario(user: User): Promise<Usuario> {
  const meta = (user.user_metadata ?? {}) as Record<string, string | undefined>
  const proveedorBruto = user.app_metadata?.provider
  const proveedor: ProveedorAuth = proveedorBruto === 'google' || proveedorBruto === 'facebook' ? proveedorBruto : 'correo'
  let rol: RolUsuario = 'cliente'
  try {
    const { data } = await requireClient().from('perfiles').select('rol').eq('id', user.id).maybeSingle()
    if (data?.rol === 'admin') rol = 'admin'
  } catch {
    // sin tabla de perfiles: todos son clientes
  }
  return {
    id: user.id,
    nombre: meta.full_name ?? meta.name ?? meta.nombre ?? user.email?.split('@')[0] ?? 'Cliente',
    email: user.email ?? '',
    rol,
    proveedor,
    avatarUrl: meta.avatar_url ?? meta.picture,
  }
}

/** Supabase Auth: registro con correo, Google y Facebook. Las cuentas de
 * demostración siguen funcionando (se resuelven antes, sin servidor). */
export const authRepositorySupabase: AuthRepository = {
  proveedoresReales: true,

  async restaurarSesion() {
    const local = sesionLocalGuardada()
    if (local) return local
    const { data } = await requireClient().auth.getSession()
    return data.session ? aUsuario(data.session.user) : null
  },

  async iniciarSesion(email, password) {
    const demo = sesionDemo(email, password)
    if (demo) return demo
    try {
      const { data, error } = await requireClient().auth.signInWithPassword({ email: email.trim(), password })
      if (error) return { ok: false, error: traducir(error) }
      olvidarSesionLocal()
      return { ok: true, usuario: await aUsuario(data.user) }
    } catch (error) {
      return { ok: false, error: traducir(error) }
    }
  },

  async registrar({ nombre, email, password }) {
    try {
      const { data, error } = await requireClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { nombre: nombre.trim(), full_name: nombre.trim() },
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      if (error) return { ok: false, error: traducir(error) }
      // Con la confirmación de correo activada, Supabase no avisa que el correo ya existe:
      // devuelve un usuario sin identidades.
      if (data.user?.identities?.length === 0) {
        return { ok: false, error: 'Ya existe una cuenta con ese correo. Inicia sesión.' }
      }
      if (!data.session || !data.user) return { ok: true, pendiente: 'confirmar-correo' }
      olvidarSesionLocal()
      return { ok: true, usuario: await aUsuario(data.user) }
    } catch (error) {
      return { ok: false, error: traducir(error) }
    }
  },

  async iniciarConProveedor(proveedor) {
    try {
      const { error } = await requireClient().auth.signInWithOAuth({
        provider: proveedor,
        options: { redirectTo: `${window.location.origin}/` },
      })
      return error ? { ok: false, error: traducir(error) } : { ok: true, pendiente: 'redireccion' }
    } catch (error) {
      return { ok: false, error: traducir(error) }
    }
  },

  async cerrarSesion() {
    olvidarSesionLocal()
    await requireClient().auth.signOut().catch(() => {})
  },

  alCambiarSesion(callback) {
    const { data } = requireClient().auth.onAuthStateChange((evento, sesion) => {
      if (sesion && (evento === 'SIGNED_IN' || evento === 'USER_UPDATED' || evento === 'TOKEN_REFRESHED')) {
        // Supabase pide no llamar a su propia API dentro de este callback: se difiere.
        setTimeout(() => void aUsuario(sesion.user).then(callback), 0)
      } else if (evento === 'SIGNED_OUT') {
        callback(null)
      }
    })
    return () => data.subscription.unsubscribe()
  },
}
