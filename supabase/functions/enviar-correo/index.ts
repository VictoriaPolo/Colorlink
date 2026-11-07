// Función Edge: enviar-correo
//
// Recibe { tipo: 'solicitud' | 'pedido', destinatario, datos } desde el frontend
// (ver src/data/correo.ts) y manda el correo real con la API de Brevo.
//
// Necesita estos secretos en el proyecto de Supabase (Project Settings > Edge
// Functions > Secrets, o `supabase secrets set`):
//   BREVO_API_KEY        — clave API de Brevo (obligatoria)
//   BREVO_SENDER_EMAIL    — remitente verificado en Brevo (opcional, hay default)
//   BREVO_SENDER_NOMBRE   — nombre del remitente (opcional, hay default)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

type TipoCorreo = 'solicitud' | 'pedido'

interface Payload {
  tipo: TipoCorreo
  destinatario: string
  datos: Record<string, unknown>
}

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const SENDER_EMAIL = Deno.env.get('BREVO_SENDER_EMAIL') ?? 'no-responder@colorlink.com'
const SENDER_NOMBRE = Deno.env.get('BREVO_SENDER_NOMBRE') ?? 'Colorlink'

// Se llama desde el navegador (otro origen que el de la función), así que
// sin estos encabezados el navegador bloquea la respuesta por CORS antes de
// que el código de la app la vea.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function plantillaSolicitud(datos: Record<string, unknown>) {
  const { id, cliente, tipoObra, ciudad } = datos as { id: string; cliente: string; tipoObra: string; ciudad: string }
  return {
    asunto: `Recibimos tu solicitud ${id} — Colorlink`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color:#0f172a;">
        <h2 style="color:#0f2a4a;">¡Gracias, ${cliente}!</h2>
        <p>Recibimos tu solicitud de diagnóstico <strong>${id}</strong> para el proyecto en <strong>${ciudad}</strong> (${tipoObra}).</p>
        <p>Nuestro equipo ya está revisando la recomendación generada. Puedes ver el estado de tu solicitud ingresando a tu cuenta en Colorlink.</p>
        <p style="color:#64748b; font-size: 12px;">Correo automático de un prototipo académico — no responder.</p>
      </div>`,
  }
}

function plantillaPedido(datos: Record<string, unknown>) {
  const { id, items, total, codigoRetiro, puntoRetiro } = datos as {
    id: string
    items: { nombre: string; cantidad: number; precioUnitario: number }[]
    total: number
    codigoRetiro?: string
    puntoRetiro?: string
  }
  const filas = items
    .map(
      (i) =>
        `<tr><td style="padding:4px 8px;">${i.nombre}</td><td style="padding:4px 8px;">x${i.cantidad}</td><td style="padding:4px 8px;">$${(i.precioUnitario * i.cantidad).toLocaleString('es-CO')}</td></tr>`,
    )
    .join('')
  return {
    asunto: `Confirmación de tu pedido ${id} — Colorlink`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color:#0f172a;">
        <h2 style="color:#0f2a4a;">¡Pedido confirmado!</h2>
        <p>Tu pedido <strong>${id}</strong> fue recibido correctamente.</p>
        <table style="width:100%; border-collapse: collapse;">${filas}</table>
        <p><strong>Total: $${total.toLocaleString('es-CO')}</strong></p>
        ${codigoRetiro ? `<p>Código de retiro: <strong>${codigoRetiro}</strong></p>` : ''}
        ${puntoRetiro ? `<p>Punto de retiro: ${puntoRetiro}</p>` : ''}
        <p style="color:#64748b; font-size: 12px;">Correo automático de un prototipo académico — no responder.</p>
      </div>`,
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })

  if (!BREVO_API_KEY) {
    console.error('Falta la variable BREVO_API_KEY en los secretos del proyecto.')
    return new Response(JSON.stringify({ ok: false, error: 'Falta configurar BREVO_API_KEY' }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  let payload: Payload
  try {
    payload = await req.json()
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  if (!payload.destinatario || !payload.tipo) {
    return new Response(JSON.stringify({ ok: false, error: 'Falta destinatario o tipo' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  const { asunto, html } = payload.tipo === 'pedido' ? plantillaPedido(payload.datos) : plantillaSolicitud(payload.datos)

  const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: SENDER_NOMBRE, email: SENDER_EMAIL },
      to: [{ email: payload.destinatario }],
      subject: asunto,
      htmlContent: html,
    }),
  })

  if (!respuesta.ok) {
    const texto = await respuesta.text()
    console.error('Brevo rechazó el envío:', respuesta.status, texto)
    return new Response(JSON.stringify({ ok: false, error: 'No se pudo enviar el correo' }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } })
})
