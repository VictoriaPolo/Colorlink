import { paletaColores } from '@/data/paletaColores'
import { CODIGOS_FRANJA } from './franja'

const COLORES = CODIGOS_FRANJA.map((c) => paletaColores.find((p) => p.codigo === c)!.hex)

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
