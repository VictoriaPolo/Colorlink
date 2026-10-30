/** Gota de pintura amarilla sobre fondo azul: la marca de COLORLINK. */
export function MarcaColorlink({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="9" fill="#004f9f" />
      <path
        d="M20 7C20 7 10.5 18 10.5 25a9.5 9.5 0 0 0 19 0C29.5 18 20 7 20 7Z"
        fill="#ffd100"
      />
      <path d="M15.2 25.2c0 2.9 1.9 4.9 4.5 5.4" fill="none" stroke="#fff" strokeOpacity=".75" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

interface LogoProps {
  /** Sobre fondos oscuros las letras pasan a blanco. */
  claro?: boolean
  subtitulo?: boolean
}

export default function Logo({ claro = false, subtitulo = true }: LogoProps) {
  return (
    <span className="flex items-center gap-2.5">
      <MarcaColorlink />
      <span className="flex flex-col leading-none">
        <span className={`text-xl font-black tracking-tight ${claro ? 'text-white' : 'text-navy'}`}>
          COLOR<span className={claro ? 'text-accent' : 'text-primary'}>LINK</span>
        </span>
        {subtitulo && (
          <span
            className={`mt-1 hidden text-[10px] font-semibold tracking-[0.14em] uppercase sm:block ${
              claro ? 'text-white/70' : 'text-slate-500'
            }`}
          >
            Distribuidor oficial Pintuco
          </span>
        )}
      </span>
    </span>
  )
}
