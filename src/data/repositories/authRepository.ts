import { supabase } from '@/data/supabaseClient'
import { authRepositoryLocal } from './authRepository.local'
import { authRepositorySupabase } from './authRepository.supabase'
import type { AuthRepository } from './authRepository.types'

export type { AuthRepository } from './authRepository.types'

/** Mismo criterio que los demás repositorios: Supabase Auth si está configurado,
 * acceso local de demostración si no. */
export const authRepository: AuthRepository = supabase ? authRepositorySupabase : authRepositoryLocal
