import { supabase } from '@/data/supabaseClient'

/**
 * Las cuentas de demostración (cliente y equipo) y los botones "Entrar como…".
 *
 * Sin base de datos (todo en el navegador) son la única forma de probar la consola del equipo, así que
 * siempre están. Con Supabase hay datos compartidos de verdad (nombres, correos y fotos de quienes se
 * registran) y un botón público para entrar como equipo dejaría verlos a cualquiera: ahí se apagan,
 * salvo que se pida lo contrario con VITE_MODO_DEMO=true.
 */
export const MODO_DEMO = !supabase || import.meta.env.VITE_MODO_DEMO === 'true'
