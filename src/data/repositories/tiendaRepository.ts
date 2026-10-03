import { supabase } from '@/data/supabaseClient'
import { tiendaRepositoryLocal } from './tiendaRepository.local'
import { tiendaRepositorySupabase } from './tiendaRepository.supabase'
import type { TiendaRepository } from './tiendaRepository.types'

export type { TiendaRepository } from './tiendaRepository.types'

/** Mismo criterio que solicitudesRepository.ts: Supabase si está configurado,
 * localStorage si no. */
export const tiendaRepository: TiendaRepository = supabase ? tiendaRepositorySupabase : tiendaRepositoryLocal
