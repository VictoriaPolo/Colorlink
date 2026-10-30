import { paletaColores } from '@/data/paletaColores'

/** Códigos de la carta de color que forman la franja (una muestra variada). */
const CODIGOS = ['PNT-303', 'PNT-506', 'PNT-504', 'PNT-401', 'PNT-208', 'PNT-304', 'PNT-209', 'PNT-302', 'PNT-204', 'PNT-307']

const COLORES = CODIGOS.map((c) => paletaColores.find((p) => p.codigo === c)!.hex)

/** Franja de muestras de pintura: la firma visual de COLORLINK, tomada de las
 * cartas de color de una tienda de pinturas. */
export default function FranjaColores({ className = 'h-1' }: { className?: string }) {
  return (
    <div className={`flex w-full ${className}`} aria-hidden>
      {COLORES.map((hex, i) => (
        <span key={i} className="flex-1" style={{ backgroundColor: hex }} />
      ))}
    </div>
  )
}
