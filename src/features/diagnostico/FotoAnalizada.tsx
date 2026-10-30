import { useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, ImageOff } from 'lucide-react'
import type { ClaseDano, MetricasImagen } from '@/domain/diagnostico/analizarPixeles'
import { analizarImagenUrl, clasesVisibles, COLOR_CLASE, dibujarZonas, ETIQUETA_CLASE } from './imagen'

/**
 * Una foto del cliente con las zonas que el análisis marcó encima (se pueden ocultar)
 * y una leyenda de lo que encontró. Mientras analiza, una línea de escaneo recorre la imagen.
 */
export default function FotoAnalizada({
  url,
  nombre,
  clases,
  className = '',
}: {
  url: string
  nombre: string
  /** Las zonas que reclama el diagnóstico (ver clasesDeDiagnostico); sin ellas se muestran todas las seguras. */
  clases?: ClaseDano[]
  className?: string
}) {
  const [metricas, setMetricas] = useState<MetricasImagen | null>(null)
  const [sinAnalisis, setSinAnalisis] = useState(false)
  const [fotoRota, setFotoRota] = useState(false)
  const [zonas, setZonas] = useState(true)
  const lienzo = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let vivo = true
    analizarImagenUrl(url)
      .then((m) => vivo && setMetricas(m))
      .catch(() => vivo && setSinAnalisis(true))
    return () => {
      vivo = false
    }
  }, [url])

  useEffect(() => {
    if (metricas && lienzo.current) dibujarZonas(lienzo.current, metricas, clases)
    // `clases` se arma en cada render; su contenido es lo que importa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricas, clases?.join('|')])

  const encontradas = metricas ? clasesVisibles(metricas, clases) : []

  if (fotoRota) {
    return (
      <div className={`flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-400 ${className}`}>
        <ImageOff size={22} />
        No se pudo cargar la foto
      </div>
    )
  }

  return (
    <figure className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${className}`}>
      <div className="relative bg-slate-100 leading-[0]">
        <img src={url} alt={nombre} className="block h-auto w-full" onError={() => setFotoRota(true)} />
        {metricas && (
          <canvas ref={lienzo} aria-hidden="true" className={`absolute inset-0 h-full w-full ${zonas ? '' : 'hidden'}`} />
        )}
        {!metricas && !sinAnalisis && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 h-1/5 animate-escanear bg-linear-to-b from-transparent via-white/70 to-transparent"
          />
        )}
      </div>
      {(encontradas.length > 0 || metricas) && (
        <figcaption className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-slate-100 px-3 py-2 text-xs">
          {encontradas.length > 0 ? (
            encontradas.map((c) => (
              <span key={c} className="inline-flex items-center gap-1.5 font-medium text-navy">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR_CLASE[c].css }} />
                {ETIQUETA_CLASE[c]}
              </span>
            ))
          ) : (
            <span className="text-slate-400">No se marcó ninguna zona</span>
          )}
          {encontradas.length > 0 && (
            <button
              type="button"
              onClick={() => setZonas((v) => !v)}
              className="ml-auto inline-flex items-center gap-1 font-semibold text-primary hover:underline"
            >
              {zonas ? <EyeOff size={13} /> : <Eye size={13} />}
              {zonas ? 'Ocultar zonas' : 'Ver zonas'}
            </button>
          )}
        </figcaption>
      )}
    </figure>
  )
}
