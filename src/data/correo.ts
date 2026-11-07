import { supabase } from '@/data/supabaseClient'

/**
 * Pide a la función Edge `enviar-correo` (ver supabase/functions/enviar-correo)
 * que mande el correo de confirmación por Brevo. Si falla (sin Supabase, sin
 * BREVO_API_KEY configurada, etc.) solo se registra en consola: nunca debe
 * tumbar la creación del pedido o la solicitud, que ya quedó guardada en la
 * base de datos.
 */
export async function enviarCorreoConfirmacion(
  tipo: 'solicitud' | 'pedido',
  destinatario: string | undefined,
  datos: Record<string, unknown>,
): Promise<void> {
  if (!supabase || !destinatario) return
  try {
    const { error } = await supabase.functions.invoke('enviar-correo', { body: { tipo, destinatario, datos } })
    if (error) console.error('No se pudo enviar el correo de confirmación:', error)
  } catch (error) {
    console.error('No se pudo enviar el correo de confirmación:', error)
  }
}
