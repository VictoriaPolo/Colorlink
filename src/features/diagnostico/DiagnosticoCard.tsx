import { AlertTriangle, Loader2, ScanSearch } from 'lucide-react'
import type { DiagnosticoImagen } from '@/domain/solicitud/types'
import { COLOR_PATOLOGIA } from './imagen'
import { ESTILO_SEVERIDAD, ICONO_PATOLOGIA } from './estilos'

function lecturaConfianza(confianza: number): string {
  if (confianza >= 75) return 'Alta: la foto y tu descripción coinciden.'
  if (confianza >= 50) return 'Media: un asesor la confirmará.'
  return 'Baja: agrega una foto o más detalles para mejorarla.'
}

/**
 * El informe del diagnóstico por imagen: qué se encontró, qué tan grave es, qué tan seguro
 * está el análisis y qué hacer. `compacto` es la versión del asistente (sin pasos ni causa).
 */
export default function DiagnosticoCard({
  diagnostico: d,
  compacto = false,
  analizando = false,
}: {
  diagnostico: DiagnosticoImagen
  compacto?: boolean
  /** Hay fotos en proceso: el resultado puede cambiar en un instante. */
  analizando?: boolean
}) {
  const Icono = ICONO_PATOLOGIA[d.patologia]
  const color = COLOR_PATOLOGIA[d.patologia]
  const hallazgos = d.hallazgos.slice(0, 4)

  return (
    <section aria-label="Diagnóstico preliminar" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-soft">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-navy px-5 py-3 text-white">
        <div className="flex items-center gap-2">
          <ScanSearch size={18} />
          <h3 className="text-sm font-bold">Diagnóstico preliminar</h3>
        </div>
        {analizando ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <Loader2 size={12} className="animate-spin" /> Analizando la foto…
          </span>
        ) : (
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">Según {d.origen}</span>
        )}
      </header>

      <div className={`flex flex-col gap-5 p-5 transition-opacity ${analizando ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${color}1a`, color }}
          >
            <Icono size={24} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-lg font-extrabold text-navy">{d.patologia}</h4>
              {d.severidad && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${ESTILO_SEVERIDAD[d.severidad]}`}>
                  {d.severidad}
                </span>
              )}
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-body">{d.zona}</span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-body">{d.resumen}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-navy">Confianza del análisis</span>
            <span className="font-bold tabular-nums" style={{ color }}>
              {d.confianza}%
            </span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100" role="presentation">
            <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${d.confianza}%`, background: color }} />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{lecturaConfianza(d.confianza)}</p>
        </div>

        {hallazgos.length > 1 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Lo que se detectó</p>
            <ul className="mt-2 flex flex-col gap-2">
              {hallazgos.map((h) => (
                <li key={h.patologia} className="grid grid-cols-[minmax(0,9.5rem)_1fr_2.5rem] items-center gap-3 text-xs">
                  <span className="truncate font-medium text-navy">{h.patologia}</span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full" style={{ width: `${h.intensidad}%`, background: COLOR_PATOLOGIA[h.patologia] }} />
                  </span>
                  <span className="text-right font-semibold text-body tabular-nums">{h.intensidad}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!compacto && (
          <>
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Causa probable</p>
              <p className="mt-1 text-sm leading-relaxed text-body">{d.causaProbable}</p>
            </div>

            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Qué hacer, paso a paso</p>
              <ol className="mt-2 flex flex-col gap-2.5">
                {d.tratamiento.pasos.map((paso, i) => (
                  <li key={paso} className="flex items-start gap-3 text-sm text-body">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{paso}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Productos sugeridos</span>
              {d.tratamiento.productos.map((p) => (
                <span key={p} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-primary">
                  {p}
                </span>
              ))}
              {d.tratamiento.kit && (
                <span className="rounded-full bg-accent/25 px-3 py-1 text-xs font-semibold text-navy">Kit: {d.tratamiento.kit}</span>
              )}
            </div>
          </>
        )}

        {d.advertencias.length > 0 && (
          <ul className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
            {d.advertencias.map((a) => (
              <li key={a} className="flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{a}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="border-t border-slate-100 bg-surface-muted px-5 py-2.5 text-xs text-slate-500">
        Análisis automático de la imagen y del texto, a modo de orientación. Un asesor técnico de COLORLINK lo revisa antes de cotizar.
      </footer>
    </section>
  )
}
