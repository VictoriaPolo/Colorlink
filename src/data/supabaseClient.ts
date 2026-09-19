import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * `null` cuando el proyecto no tiene `.env.local` con las credenciales de
 * Supabase (ver `.env.example`). Los repositorios usan esto para decidir si
 * persisten contra la base de datos real o contra localStorage — así el
 * proyecto sigue corriendo para cualquiera que lo clone sin tener que
 * configurar Supabase primero.
 */
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

if (!supabase) {
  console.info(
    '[colorlink] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY no configuradas — usando localStorage. Ver .env.example y docs/SUPABASE.md.',
  )
}
