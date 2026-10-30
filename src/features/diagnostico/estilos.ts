import { Droplets, Layers, ShieldCheck, Snowflake, Sprout, Wrench, Zap, type LucideIcon } from 'lucide-react'
import type { PatologiaDetectada, Severidad } from '@/domain/solicitud/types'

export const ICONO_PATOLOGIA: Record<PatologiaDetectada, LucideIcon> = {
  'Moho y hongos': Sprout,
  'Humedad y filtración': Droplets,
  'Fisuras y grietas': Zap,
  'Óxido y corrosión': Wrench,
  'Pintura descascarada': Layers,
  Salitre: Snowflake,
  'Sin daños evidentes': ShieldCheck,
}

export const ESTILO_SEVERIDAD: Record<Severidad, string> = {
  Leve: 'bg-green-50 text-green-700 ring-green-600/25',
  Moderada: 'bg-amber-50 text-amber-800 ring-amber-600/30',
  Severa: 'bg-red-50 text-red-700 ring-red-600/25',
}
