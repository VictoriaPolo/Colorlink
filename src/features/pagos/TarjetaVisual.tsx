import { CreditCard } from 'lucide-react'
import { marcaDeTarjeta, soloDigitos, NOMBRE_MARCA, type MarcaTarjeta } from '@/domain/pagos/tarjeta'

const FONDO: Record<MarcaTarjeta, string> = {
  visa: 'from-navy to-primary',
  mastercard: 'from-slate-800 to-slate-950',
  amex: 'from-cyan-800 to-cyan-950',
  diners: 'from-slate-700 to-slate-900',
  desconocida: 'from-slate-500 to-slate-700',
}

function Marca({ marca }: { marca: MarcaTarjeta }) {
  if (marca === 'visa') return <span className="text-2xl font-black tracking-tight italic">VISA</span>
  if (marca === 'mastercard') {
    return (
      <span className="flex" aria-hidden="true">
        <span className="h-7 w-7 rounded-full bg-red-500/90" />
        <span className="-ml-3 h-7 w-7 rounded-full bg-amber-400/90" />
      </span>
    )
  }
  if (marca === 'amex') return <span className="rounded border-2 border-white/80 px-1.5 text-[11px] font-black tracking-widest">AMEX</span>
  if (marca === 'diners') return <span className="text-sm font-black tracking-wide">DINERS</span>
  return <CreditCard size={26} className="opacity-70" aria-hidden="true" />
}

/** "•••• •••• •••• ••••" rellenado con los dígitos que ya se escribieron. */
function numeroVisible(numero: string, marca: MarcaTarjeta): string {
  const patron = marca === 'amex' ? '•••• •••••• •••••' : marca === 'diners' ? '•••• •••••• ••••' : '•••• •••• •••• ••••'
  const digitos = soloDigitos(numero)
  let i = 0
  return [...patron].map((c) => (c === '•' && i < digitos.length ? digitos[i++] : c)).join('')
}

const CARA = 'absolute inset-0 rounded-2xl p-5 text-white shadow-soft-lg [backface-visibility:hidden]'

/** La tarjeta que se va dibujando mientras se escribe; al llegar al código de seguridad se da vuelta. */
export default function TarjetaVisual({
  numero,
  titular,
  vencimiento,
  cvv,
  volteada = false,
}: {
  numero: string
  titular: string
  vencimiento: string
  cvv: string
  volteada?: boolean
}) {
  const marca = marcaDeTarjeta(numero)
  return (
    <div
      role="img"
      aria-label={`Vista previa de tu tarjeta ${NOMBRE_MARCA[marca]}`}
      className="mx-auto aspect-[1.586] w-full max-w-[21rem] [perspective:1000px]"
    >
      <div
        className="relative h-full w-full transition-transform duration-500 motion-reduce:transition-none [transform-style:preserve-3d]"
        style={{ transform: volteada ? 'rotateY(180deg)' : 'none' }}
      >
        <div className={`${CARA} flex flex-col justify-between bg-gradient-to-br ${FONDO[marca]}`}>
          <div className="flex items-start justify-between">
            <span className="h-8 w-11 rounded-md bg-gradient-to-br from-amber-200 to-amber-400" aria-hidden="true" />
            <Marca marca={marca} />
          </div>
          <p className="font-mono text-lg tracking-[0.14em] sm:text-xl">{numeroVisible(numero, marca)}</p>
          <div className="flex items-end justify-between gap-3 text-xs">
            <div className="min-w-0">
              <p className="text-[9px] tracking-widest text-white/60 uppercase">Titular</p>
              <p className="truncate font-semibold tracking-wide uppercase">{titular.trim() || 'Nombre del titular'}</p>
            </div>
            <div>
              <p className="text-[9px] tracking-widest text-white/60 uppercase">Vence</p>
              <p className="font-semibold">{vencimiento || 'MM/AA'}</p>
            </div>
          </div>
        </div>

        <div className={`${CARA} bg-gradient-to-br ${FONDO[marca]} [transform:rotateY(180deg)]`}>
          <span className="absolute inset-x-0 top-6 h-10 bg-black/70" aria-hidden="true" />
          <div className="absolute inset-x-5 top-20 flex items-center gap-2">
            <span className="h-8 flex-1 rounded bg-white/85" aria-hidden="true" />
            <span className="flex h-8 w-14 items-center justify-center rounded bg-white font-mono text-sm font-bold text-navy">{cvv || '•••'}</span>
          </div>
          <p className="absolute right-5 bottom-4 left-5 text-[10px] text-white/60">Código de seguridad: los 3 dígitos de atrás (4 en American Express).</p>
        </div>
      </div>
    </div>
  )
}
