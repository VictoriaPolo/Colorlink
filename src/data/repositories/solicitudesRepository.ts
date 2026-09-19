import { supabase } from '@/data/supabaseClient'
import { solicitudesRepositoryLocal } from './solicitudesRepository.local'
import { solicitudesRepositorySupabase } from './solicitudesRepository.supabase'
import type { SolicitudesRepository } from './solicitudesRepository.types'

export type { SolicitudesRepository } from './solicitudesRepository.types'

/**
 * Repositorio de solicitudes. Usa Supabase cuando el proyecto tiene
 * VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY configuradas (ver
 * src/data/supabaseClient.ts y supabase/schema.sql); si no, cae a
 * localStorage para que el proyecto siga funcionando sin backend real.
 */
export const solicitudesRepository: SolicitudesRepository = supabase
  ? solicitudesRepositorySupabase
  : solicitudesRepositoryLocal
