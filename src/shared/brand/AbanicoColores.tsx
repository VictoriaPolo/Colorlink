import type { ColorPaleta } from '@/data/paletaColores'

interface Props {
  colores: ColorPaleta[]
  /** Si se pasa, cada muestra es un botón (ej. abrir el simulador con ese color). */
  onElegir?: (color: ColorPaleta) => void
  className?: string
}

/** Abanico de muestras de pintura, como la carta de colores de una tienda:
 * cada tarjeta lleva el tono arriba y su código y nombre abajo. */
export default function AbanicoColores({ colores, onElegir, className = '' }: Props) {
  const n = colores.length
  return (
    <div className={`relative mx-auto h-72 w-[22rem] ${className}`} role="list" aria-label="Muestras de color">
      {colores.map((c, i) => {
        const angulo = n > 1 ? -50 + (i * 100) / (n - 1) : 0
        const Etiqueta = onElegir ? 'button' : 'div'
        return (
          <Etiqueta
            key={c.codigo}
            role="listitem"
            {...(onElegir ? { type: 'button' as const, onClick: () => onElegir(c), 'aria-label': `${c.nombre} (${c.codigo})` } : {})}
            style={{ '--angulo': `${angulo}deg` } as React.CSSProperties}
            className="absolute bottom-0 left-1/2 -ml-8 flex h-64 w-16 origin-bottom rotate-(--angulo) flex-col overflow-hidden rounded-t-md border border-white bg-white text-left shadow-soft-lg transition-all duration-300 hover:-translate-y-3"
          >
            <span className="block flex-1" style={{ backgroundColor: c.hex }} />
            <span className="block px-1.5 pt-1.5 pb-6">
              <span className="block text-[8px] font-bold tracking-wide text-slate-400">{c.codigo}</span>
              <span className="block text-[9px] leading-tight font-bold text-navy">{c.nombre}</span>
            </span>
          </Etiqueta>
        )
      })}
      <span className="absolute bottom-2.5 left-1/2 -ml-2.5 h-5 w-5 rounded-full bg-navy ring-4 ring-white/90" aria-hidden />
    </div>
  )
}
