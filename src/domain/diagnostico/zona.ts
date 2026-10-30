import type { TecnicaData, ZonaAfectada } from '@/domain/solicitud/types'

/** Zona que se propone mientras el cliente no elige una, según la superficie que indicó en el paso técnico. */
export function zonaSugerida(tecnica: Pick<TecnicaData, 'superficie'>): ZonaAfectada {
  switch (tecnica.superficie) {
    case 'Metal':
      return 'Metal o reja'
    case 'Exterior':
    case 'Fachada':
      return 'Fachada'
    default:
      return 'Pared'
  }
}
