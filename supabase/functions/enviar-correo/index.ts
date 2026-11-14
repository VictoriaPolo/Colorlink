// Función Edge: enviar-correo
//
// Recibe { tipo: 'solicitud' | 'pedido', datos } desde el frontend (ver src/data/correo.ts) y manda el
// correo real con la API de Brevo. Solo le escribe a la cuenta con sesión (su correo sale del token): el
// `destinatario` que mande el navegador se ignora, así la función no sirve para escribirle a cualquiera
// con la cuenta de Brevo del proyecto.
//
// Necesita estos secretos en el proyecto de Supabase (Project Settings > Edge
// Functions > Secrets, o `supabase secrets set`):
//   BREVO_API_KEY        — clave API de Brevo (obligatoria)
//   BREVO_SENDER_EMAIL    — remitente verificado en Brevo (opcional, hay default)
//   BREVO_SENDER_NOMBRE   — nombre del remitente (opcional, hay default)
// SUPABASE_URL y SUPABASE_ANON_KEY los pone Supabase solos.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { plantillaPedido, plantillaSolicitud, type Correo } from './plantillas.ts'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'no-responder@colorlink.com'
const SENDER_NOMBRE = Deno.env.get('BREVO_SENDER_NOMBRE') ?? 'Colorlink'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Se llama desde el navegador (otro origen que el de la función), así que
// sin estos encabezados el navegador bloquea la respuesta por CORS antes de
// que el código de la app la vea.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })

/** Correo de la persona que hace la llamada, o null si el token no es de alguien con sesión
 * (la clave anon es pública y no cuenta). */
async function correoDeLaSesion(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace(/^Bearer /i, '')
  if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) return null
  const respuesta = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
  })
  if (!respuesta.ok) return null
  const usuario = await respuesta.json()
  return typeof usuario?.email === 'string' && usuario.email ? usuario.email : null
}

// ponytail: sin tope de envíos por cuenta; si alguien abusa, contarlos en una tabla o limitarlos en Brevo.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  const destinatario = await correoDeLaSesion(req)
  if (!destinatario) return json({ ok: false, error: 'Necesitas iniciar sesión' }, 401)

  if (!BREVO_API_KEY) {
    console.error('Falta la variable BREVO_API_KEY en los secretos del proyecto.')
    return json({ ok: false, error: 'Falta configurar BREVO_API_KEY' }, 500)
  }

  let payload: { tipo?: unknown; datos?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return json({ ok: false, error: 'JSON inválido' }, 400)
  }

  if (payload.tipo !== 'pedido' && payload.tipo !== 'solicitud') return json({ ok: false, error: 'Tipo de correo no válido' }, 400)

  let correo: Correo
  try {
    const datos = payload.datos ?? {}
    correo = payload.tipo === 'pedido' ? plantillaPedido(datos) : plantillaSolicitud(datos)
  } catch {
    return json({ ok: false, error: 'Datos inválidos' }, 400)
  }

  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: SENDER_NOMBRE, email: SENDER_EMAIL },
      to: [{ email: destinatario }],
      subject: correo.asunto,
      htmlContent: correo.html,
    }),
  })

  if (!respuesta.ok) {
    const textoError = await respuesta.text()
    console.error('Brevo rechazó el envío:', respuesta.status, textoError)
    return json({ ok: false, error: 'No se pudo enviar el correo' }, 502)
  }

  return json({ ok: true })
})
