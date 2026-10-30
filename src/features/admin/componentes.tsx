import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, UserRound, type LucideIcon } from 'lucide-react'
import type { Prioridad } from '@/domain/solicitud/panel'
import type { PatologiaDetectada, Solicitud } from '@/domain/solicitud/types'
import { COLOR_PATOLOGIA } from '@/features/diagnostico/imagen'
import { ESTILO_SEVERIDAD, ICONO_PATOLOGIA } from '@/features/diagnostico/estilos'
import Avatar from '@/shared/ui/Avatar'

type Tono = 'normal' | 'alerta' | 'peligro'

const TONO_ICONO: Record<Tono, string> = {
  normal: 'bg-brand-50 text-primary',
  alerta: 'bg-amber-100 text-amber-700',
  peligro: 'bg-red-100 text-red-600',
}

/** Un indicador del panel: número grande, qué es y una aclaración; con enlace si lleva a una lista. */
export function KpiCard({
  icono: Icono,
  etiqueta,
  valor,
  detalle,
  tono = 'normal',
  to,
}: {
  icono: LucideIcon
  etiqueta: string
  valor: ReactNode
  detalle?: string
  tono?: Tono
  to?: string
}) {
  const contenido = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${TONO_ICONO[tono]}`}>
        <Icono size={20} />
      </span>
      <span className="w-full min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">{etiqueta}</span>
        <span className="mt-0.5 block text-xl font-extrabold whitespace-nowrap text-navy tabular-nums sm:text-2xl">{valor}</span>
        {detalle && <span className="mt-0.5 block truncate text-xs text-slate-400">{detalle}</span>}
      </span>
    </>
  )
  const clases = 'flex flex-col items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-4 shadow-soft sm:flex-row sm:gap-3.5'
  return to ? (
    <Link to={to} className={`${clases} transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft-lg`}>
      {contenido}
    </Link>
  ) : (
    <div className={clases}>{contenido}</div>
  )
}

const ESTILO_PRIORIDAD: Record<Prioridad, { chip: string; punto: string }> = {
  Alta: { chip: 'bg-red-50 text-red-700 ring-red-600/25', punto: 'bg-red-500' },
  Media: { chip: 'bg-amber-50 text-amber-800 ring-amber-600/30', punto: 'bg-amber-500' },
  Baja: { chip: 'bg-slate-100 text-slate-600 ring-slate-500/20', punto: 'bg-slate-400' },
}

export function ChipPrioridad({ prioridad, motivo }: { prioridad: Prioridad; motivo?: string }) {
  const estilo = ESTILO_PRIORIDAD[prioridad]
  return (
    <span
      title={motivo}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${estilo.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
      {prioridad}
    </span>
  )
}

/** El problema que diagnosticó el análisis y qué tan grave es. */
export function ChipProblema({ solicitud }: { solicitud: Solicitud }) {
  const d = solicitud.diagnostico
  if (!d) return <span className="text-xs text-slate-400">Sin diagnóstico</span>
  const Icono = ICONO_PATOLOGIA[d.patologia]
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy">
        <Icono size={14} style={{ color: COLOR_PATOLOGIA[d.patologia] }} />
        {d.patologia}
      </span>
      {d.severidad && (
        <span className={`rounded-full px-2 py-px text-[11px] font-bold ring-1 ring-inset ${ESTILO_SEVERIDAD[d.severidad]}`}>{d.severidad}</span>
      )}
    </span>
  )
}

/** Quién atiende la solicitud: su avatar y nombre, o un aviso si nadie la tiene. */
export function Asignado({ nombre }: { nombre?: string }) {
  if (!nombre) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-amber-400 bg-amber-50">
          <UserRound size={13} />
        </span>
        Sin asignar
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy">
      <Avatar nombre={nombre} className="h-6 w-6 text-[10px]" />
      {nombre}
    </span>
  )
}

/** Primera foto de la solicitud; si no hay (o no carga), el ícono del problema. */
export function Miniatura({ solicitud, className = 'h-12 w-12' }: { solicitud: Solicitud; className?: string }) {
  const [rota, setRota] = useState(false)
  const url = solicitud.data.evidencia.imagenes[0]?.url
  const patologia: PatologiaDetectada | undefined = solicitud.diagnostico?.patologia
  const Icono = patologia ? ICONO_PATOLOGIA[patologia] : ImageOff

  if (!url || rota) {
    return (
      <span className={`flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400 ${className}`}>
        <Icono size={18} />
      </span>
    )
  }
  return <img src={url} alt="" loading="lazy" onError={() => setRota(true)} className={`shrink-0 rounded-lg object-cover ${className}`} />
}
