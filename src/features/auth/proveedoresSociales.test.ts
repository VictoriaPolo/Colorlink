import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ErrorAcceso, abrirVentanaProveedor, mensajeDeError, modoProveedor } from './proveedoresSociales'

/** Librerías de Google y Facebook simuladas: sin ventanas ni red reales. */
const ventana = window as unknown as { google?: unknown; FB?: unknown }

type ConfigToken = {
  client_id: string
  scope: string
  prompt: string
  callback: (r: { access_token?: string; error?: string }) => void
  error_callback: (e: { type?: string }) => void
}

/** Google que, al abrir la ventana, responde lo que haga `alAbrir` (elige cuenta, cierra, bloquea...). */
function simularGoogle(alAbrir: (config: ConfigToken) => void) {
  const configs: ConfigToken[] = []
  ventana.google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: ConfigToken) => {
          configs.push(config)
          return { requestAccessToken: () => alAbrir(config) }
        },
      },
    },
  }
  return configs
}

function simularPerfilGoogle(perfil: object, ok = true) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok, json: async () => perfil })))
}

beforeEach(() => {
  delete ventana.google
  delete ventana.FB
  document.head.querySelectorAll('script').forEach((s) => s.remove())
})

afterEach(() => vi.unstubAllGlobals())

describe('modoProveedor', () => {
  const ids = { google: 'cliente.apps.googleusercontent.com', facebook: undefined }

  it('con Supabase, redirige; sin él, abre la ventana si hay clave y si no, modo demostración', () => {
    expect(modoProveedor('google', true, ids)).toBe('redireccion')
    expect(modoProveedor('google', false, ids)).toBe('ventana')
    expect(modoProveedor('facebook', false, ids)).toBe('demo')
  })

  it('en las pruebas no hay claves: todo es modo demostración', () => {
    expect(modoProveedor('google', false)).toBe('demo')
    expect(modoProveedor('facebook', false)).toBe('demo')
  })
})

describe('abrirVentanaProveedor — Google', () => {
  it('abre la lista de cuentas y devuelve el nombre, el correo y la foto de la elegida', async () => {
    const configs = simularGoogle((config) => config.callback({ access_token: 'token-de-prueba' }))
    simularPerfilGoogle({ name: 'Laura Polo', email: 'laura@gmail.com', email_verified: true, picture: 'https://foto/laura.jpg' })

    const cuenta = await abrirVentanaProveedor('google', 'mi-cliente.apps.googleusercontent.com')

    expect(cuenta).toEqual({ nombre: 'Laura Polo', email: 'laura@gmail.com', avatarUrl: 'https://foto/laura.jpg' })
    expect(configs[0]).toMatchObject({ client_id: 'mi-cliente.apps.googleusercontent.com', scope: 'openid email profile', prompt: 'select_account' })
    expect(fetch).toHaveBeenCalledWith('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: 'Bearer token-de-prueba' } })
  })

  it('si Google no trae el nombre, usa la parte inicial del correo', async () => {
    simularGoogle((config) => config.callback({ access_token: 't' }))
    simularPerfilGoogle({ email: 'sin.nombre@gmail.com', email_verified: true })
    expect((await abrirVentanaProveedor('google', 'id')).nombre).toBe('sin.nombre')
  })

  it('cerrar la ventana o negar el permiso es una cancelación, no un error', async () => {
    simularGoogle((config) => config.error_callback({ type: 'popup_closed' }))
    await expect(abrirVentanaProveedor('google', 'id')).rejects.toMatchObject({ cancelado: true })

    simularGoogle((config) => config.callback({ error: 'access_denied' }))
    await expect(abrirVentanaProveedor('google', 'id')).rejects.toMatchObject({ cancelado: true })
  })

  it('si el navegador bloquea la ventana, lo explica', async () => {
    simularGoogle((config) => config.error_callback({ type: 'popup_failed_to_open' }))
    const error = await abrirVentanaProveedor('google', 'id').catch((e) => e)
    expect(error).toBeInstanceOf(ErrorAcceso)
    expect(error.cancelado).toBe(false)
    expect(mensajeDeError(error)).toContain('ventanas emergentes')
  })

  it('rechaza una cuenta sin correo verificado o sin correo', async () => {
    simularGoogle((config) => config.callback({ access_token: 't' }))
    simularPerfilGoogle({ name: 'Ana', email: 'ana@gmail.com', email_verified: false })
    await expect(abrirVentanaProveedor('google', 'id')).rejects.toThrow('no está verificado')

    simularPerfilGoogle({ name: 'Ana' })
    await expect(abrirVentanaProveedor('google', 'id')).rejects.toThrow('no nos compartió tu correo')
  })

  it('si Google no responde el perfil, falla con un mensaje claro', async () => {
    simularGoogle((config) => config.callback({ access_token: 't' }))
    simularPerfilGoogle({}, false)
    await expect(abrirVentanaProveedor('google', 'id')).rejects.toThrow('No pudimos leer tu perfil de Google')
  })

  it('carga la librería de Google cuando todavía no está, y avisa si no se puede', async () => {
    const entrada = abrirVentanaProveedor('google', 'id')
    const script = document.head.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]')!
    expect(script).not.toBeNull()
    script.dispatchEvent(new Event('error'))
    await expect(entrada).rejects.toThrow('No pudimos cargar Google')

    // Reintento: la carga fallida no queda guardada.
    simularGoogle((config) => config.callback({ access_token: 't' }))
    simularPerfilGoogle({ name: 'Ana', email: 'ana@gmail.com', email_verified: true })
    const segundo = abrirVentanaProveedor('google', 'id')
    document.head.querySelector('script[src="https://accounts.google.com/gsi/client"]')?.dispatchEvent(new Event('load'))
    await expect(segundo).resolves.toMatchObject({ email: 'ana@gmail.com' })
  })

  it('sin clave configurada, no abre nada', async () => {
    await expect(abrirVentanaProveedor('google', undefined)).rejects.toThrow('todavía no está configurado')
  })
})

describe('abrirVentanaProveedor — Facebook', () => {
  type RespuestaLogin = { authResponse?: unknown }
  function simularFacebook(login: (cb: (r: RespuestaLogin) => void) => void, perfil: object) {
    const init = vi.fn()
    const scopes: string[] = []
    ventana.FB = {
      init,
      login: (cb: (r: RespuestaLogin) => void, opciones: { scope: string }) => {
        scopes.push(opciones.scope)
        login(cb)
      },
      api: (_ruta: string, _params: object, cb: (r: object) => void) => cb(perfil),
    }
    return { init, scopes }
  }

  it('abre la ventana de Facebook y devuelve la cuenta', async () => {
    const { init, scopes } = simularFacebook((cb) => cb({ authResponse: {} }), {
      name: 'Carlos Ruiz',
      email: 'carlos@correo.com',
      picture: { data: { url: 'https://foto/carlos.jpg' } },
    })
    const cuenta = await abrirVentanaProveedor('facebook', '123456')
    expect(cuenta).toEqual({ nombre: 'Carlos Ruiz', email: 'carlos@correo.com', avatarUrl: 'https://foto/carlos.jpg' })
    expect(init).toHaveBeenCalledWith(expect.objectContaining({ appId: '123456', cookie: false, version: 'v26.0' }))
    expect(scopes).toEqual(['public_profile,email'])
  })

  it('cerrar la ventana es una cancelación', async () => {
    simularFacebook((cb) => cb({}), {})
    await expect(abrirVentanaProveedor('facebook', '123456')).rejects.toMatchObject({ cancelado: true })
  })

  it('si Facebook no comparte el correo, lo explica', async () => {
    simularFacebook((cb) => cb({ authResponse: {} }), { name: 'Sin Correo' })
    await expect(abrirVentanaProveedor('facebook', '123456')).rejects.toThrow('Facebook no nos compartió tu correo')
  })
})

describe('mensajeDeError', () => {
  it('muestra el mensaje de un fallo de acceso y uno genérico para cualquier otro', () => {
    expect(mensajeDeError(new ErrorAcceso('Mensaje claro'))).toBe('Mensaje claro')
    expect(mensajeDeError(new Error('boom'))).toBe('No pudimos completar el acceso. Inténtalo de nuevo.')
    expect(mensajeDeError(new ErrorAcceso('', true))).toBe('No pudimos completar el acceso. Inténtalo de nuevo.')
  })
})
