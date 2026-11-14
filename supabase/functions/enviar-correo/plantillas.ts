// Plantillas de los correos de la función `enviar-correo`.
//
// Sin dependencias de Deno para poder probarlas con vitest (src/data/correoPlantillas.test.ts).
// Todo lo que llega del navegador se trata como no confiable: se acota, se escapa antes de ir dentro del
// HTML y los números que no lo son cuentan como 0 (nunca "NaN" en el correo).

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

export interface Correo {
  asunto: string
  html: string
}

/** Texto plano acotado (sirve para el asunto). */
export const texto = (valor: unknown, max = 120) => String(valor ?? '').slice(0, max)

/** Lo que va dentro del HTML del correo. */
export const esc = (valor: unknown) => texto(valor).replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c)

const numero = (valor: unknown) => {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

const pesos = (valor: unknown) => `$${numero(valor).toLocaleString('es-CO')}`

const PIE = '<p style="color:#64748b; font-size: 12px;">Correo automático de un prototipo académico — no responder.</p>'

export function plantillaSolicitud(datos: Record<string, unknown>): Correo {
  return {
    asunto: `Recibimos tu solicitud ${texto(datos.id, 40)} — Colorlink`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color:#0f172a;">
        <h2 style="color:#0f2a4a;">¡Gracias, ${esc(datos.cliente)}!</h2>
        <p>Recibimos tu solicitud de diagnóstico <strong>${esc(datos.id)}</strong> para el proyecto en <strong>${esc(datos.ciudad)}</strong> (${esc(datos.tipoObra)}).</p>
        <p>Nuestro equipo ya está revisando la recomendación generada. Puedes ver el estado de tu solicitud ingresando a tu cuenta en Colorlink.</p>
        ${PIE}
      </div>`,
  }
}

export function plantillaPedido(datos: Record<string, unknown>): Correo {
  const items: Record<string, unknown>[] = Array.isArray(datos.items) ? datos.items.slice(0, 50) : []
  const filas = items
    .map((item) => {
      const cantidad = numero(item?.cantidad)
      return `<tr><td style="padding:4px 8px;">${esc(item?.nombre)}</td><td style="padding:4px 8px;">x${cantidad}</td><td style="padding:4px 8px;">${pesos(numero(item?.precioUnitario) * cantidad)}</td></tr>`
    })
    .join('')
  return {
    asunto: `Confirmación de tu pedido ${texto(datos.id, 40)} — Colorlink`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto; color:#0f172a;">
        <h2 style="color:#0f2a4a;">¡Pedido confirmado!</h2>
        <p>Tu pedido <strong>${esc(datos.id)}</strong> fue recibido correctamente.</p>
        <table style="width:100%; border-collapse: collapse;">${filas}</table>
        <p><strong>Total: ${pesos(datos.total)}</strong></p>
        ${datos.codigoRetiro ? `<p>Código de retiro: <strong>${esc(datos.codigoRetiro)}</strong></p>` : ''}
        ${datos.puntoRetiro ? `<p>Punto de retiro: ${esc(datos.puntoRetiro)}</p>` : ''}
        ${PIE}
      </div>`,
  }
}
