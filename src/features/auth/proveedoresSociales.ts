import type { IdentidadSocial, ProveedorSocial } from '@/data/repositories/authRepository.types'

/**
 * Acceso con la ventana real de Google o de Facebook, solo con sus librerías
 * oficiales de navegador (sin servidor): se abre la ventana donde se elige la
 * cuenta y vuelven el nombre, el correo y la foto. Cada proveedor se activa con
 * su identificador público en `.env.local` (ver docs/CUENTAS_SOCIALES.md); sin
 * él, los botones abren el modo demostración.
 */

const IDS: Record<ProveedorSocial, string | undefined> = {
  google: import.meta.env.VITE_GOOGLE_CLIENT_ID || undefined,
  facebook: import.meta.env.VITE_FACEBOOK_APP_ID || undefined,
}

export type ModoProveedor = 'redireccion' | 'ventana' | 'demo'

/** Cómo entra cada botón: Supabase Auth (redirección), la ventana del proveedor o el modo demostración. */
export function modoProveedor(proveedor: ProveedorSocial, conSupabase: boolean, ids = IDS): ModoProveedor {
  if (conSupabase) return 'redireccion'
  return ids[proveedor] ? 'ventana' : 'demo'
}

/** Un fallo del acceso, con el mensaje que se le muestra a la persona. */
export class ErrorAcceso extends Error {
  /** Cerró la ventana o no dio permiso: no es un fallo y no se le avisa de nada. */
  cancelado: boolean
  constructor(mensaje: string, cancelado = false) {
    super(mensaje)
    this.cancelado = cancelado
  }
}

const GENERICO = 'No pudimos completar el acceso. Inténtalo de nuevo.'
export const mensajeDeError = (error: unknown) => (error instanceof ErrorAcceso && error.message ? error.message : GENERICO)

// Lo que se usa de cada librería (no traen tipos en lib.dom).
interface ConfigTokenGoogle {
  client_id: string
  scope: string
  prompt: string
  callback: (respuesta: { access_token?: string; error?: string }) => void
  error_callback: (error: { type?: string }) => void
}
interface SdkFacebook {
  init: (opciones: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
  login: (callback: (respuesta: { authResponse?: unknown }) => void, opciones: { scope: string }) => void
  api: (ruta: string, parametros: object, callback: (respuesta: PerfilFacebook) => void) => void
}
interface PerfilFacebook {
  name?: string
  email?: string
  picture?: { data?: { url?: string } }
  error?: unknown
}
const librerias = () =>
  window as unknown as {
    google?: { accounts?: { oauth2?: { initTokenClient: (config: ConfigTokenGoogle) => { requestAccessToken: () => void } } } }
    FB?: SdkFacebook
  }

const URL_GOOGLE = 'https://accounts.google.com/gsi/client'
const URL_FACEBOOK = 'https://connect.facebook.net/es_LA/sdk.js'
const VERSION_FACEBOOK = 'v26.0'

const cargas = new Map<string, Promise<void>>()

/** Carga una librería externa una sola vez; si falla (sin red, bloqueador de anuncios) se puede reintentar. */
function cargarScript(url: string): Promise<void> {
  let carga = cargas.get(url)
  if (!carga) {
    carga = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = url
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        cargas.delete(url)
        script.remove()
        reject(new Error(`No cargó ${url}`))
      }
      document.head.appendChild(script)
    })
    cargas.set(url, carga)
  }
  return carga
}

const sinLibreria = (nombre: string) =>
  new ErrorAcceso(`No pudimos cargar ${nombre}. Revisa tu conexión (o el bloqueador de anuncios) e inténtalo de nuevo.`)

/** Empieza a cargar la librería del proveedor (al acercarse al botón), para abrir la ventana sin esperas al hacer clic. */
export function precargarProveedor(proveedor: ProveedorSocial): void {
  cargarScript(proveedor === 'google' ? URL_GOOGLE : URL_FACEBOOK).catch(() => {})
}

async function accederConGoogle(clientId: string): Promise<IdentidadSocial> {
  if (!librerias().google?.accounts?.oauth2) await cargarScript(URL_GOOGLE).catch(() => Promise.reject(sinLibreria('Google')))
  const oauth2 = librerias().google?.accounts?.oauth2
  if (!oauth2) throw sinLibreria('Google')

  const token = await new Promise<string>((resolve, reject) => {
    oauth2
      .initTokenClient({
        client_id: clientId,
        scope: 'openid email profile',
        prompt: 'select_account', // siempre muestra la lista de cuentas para elegir
        callback: ({ access_token, error }) => {
          if (access_token) resolve(access_token)
          else reject(new ErrorAcceso(error === 'access_denied' ? '' : 'Google no nos dio acceso a tu cuenta. Inténtalo de nuevo.', error === 'access_denied'))
        },
        error_callback: ({ type }) =>
          reject(
            type === 'popup_failed_to_open'
              ? new ErrorAcceso('Tu navegador bloqueó la ventana de Google. Permite las ventanas emergentes para este sitio e inténtalo de nuevo.')
              : new ErrorAcceso('', true),
          ),
      })
      .requestAccessToken()
  })

  // Los datos salen de la API de Google con ese token: no se confía en nada que escriba el navegador.
  const respuesta = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
  if (!respuesta?.ok) throw new ErrorAcceso('No pudimos leer tu perfil de Google. Inténtalo de nuevo.')
  const perfil = (await respuesta.json()) as { name?: string; given_name?: string; email?: string; email_verified?: boolean; picture?: string }
  if (!perfil.email) throw new ErrorAcceso('Google no nos compartió tu correo. Entra con tu correo y contraseña.')
  if (perfil.email_verified === false) throw new ErrorAcceso('El correo de tu cuenta de Google no está verificado.')
  return { nombre: perfil.name ?? perfil.given_name ?? perfil.email.split('@')[0], email: perfil.email, avatarUrl: perfil.picture }
}

let facebookIniciado = false

async function accederConFacebook(appId: string): Promise<IdentidadSocial> {
  if (!librerias().FB) await cargarScript(URL_FACEBOOK).catch(() => Promise.reject(sinLibreria('Facebook')))
  const FB = librerias().FB
  if (!FB) throw sinLibreria('Facebook')
  if (!facebookIniciado) {
    FB.init({ appId, cookie: false, xfbml: false, version: VERSION_FACEBOOK })
    facebookIniciado = true
  }

  await new Promise<void>((resolve, reject) =>
    FB.login((respuesta) => (respuesta.authResponse ? resolve() : reject(new ErrorAcceso('', true))), { scope: 'public_profile,email' }),
  )
  const perfil = await new Promise<PerfilFacebook>((resolve) =>
    FB.api('/me', { fields: 'name,email,picture.width(160).height(160)' }, resolve),
  )
  if (perfil.error) throw new ErrorAcceso('No pudimos leer tu perfil de Facebook. Inténtalo de nuevo.')
  if (!perfil.email) throw new ErrorAcceso('Facebook no nos compartió tu correo. Entra con Google o con tu correo y contraseña.')
  return { nombre: perfil.name ?? perfil.email.split('@')[0], email: perfil.email, avatarUrl: perfil.picture?.data?.url }
}

/**
 * Abre la ventana del proveedor y devuelve la cuenta elegida. Debe llamarse
 * directamente al hacer clic: si no, el navegador bloquea la ventana. Falla con
 * `ErrorAcceso` (`cancelado` si la persona la cerró).
 */
export function abrirVentanaProveedor(proveedor: ProveedorSocial, id = IDS[proveedor]): Promise<IdentidadSocial> {
  if (!id) return Promise.reject(new ErrorAcceso('Este acceso todavía no está configurado.'))
  return proveedor === 'google' ? accederConGoogle(id) : accederConFacebook(id)
}
