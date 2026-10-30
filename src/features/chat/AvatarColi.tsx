import { useEffect, useState } from 'react'
import { Droplets } from 'lucide-react'
import type { EstadoLlamada } from './llamada'

/** Coli en la llamada: una gota de pintura que respira, parpadea, levanta las
 * cejas al escuchar, mira de lado al pensar y mueve la boca al hablar. */
export default function AvatarColi({ estado, nivel }: { estado: EstadoLlamada; nivel: number }) {
  const [parpadeo, setParpadeo] = useState(false)

  useEffect(() => {
    let vivo = true
    let espera = window.setTimeout(function parpadear() {
      if (!vivo) return
      setParpadeo(true)
      window.setTimeout(() => setParpadeo(false), 120)
      espera = window.setTimeout(parpadear, 2400 + Math.random() * 3600)
    }, 1200)
    return () => {
      vivo = false
      window.clearTimeout(espera)
    }
  }, [])

  const hablando = estado === 'hablando'
  const escuchando = estado === 'escuchando'
  const pensando = estado === 'pensando'
  const activo = hablando || escuchando
  const cejas = escuchando ? -3 : 0
  const mirada = pensando ? 2.5 : 0
  const bocaAlto = 3 + nivel * 12
  const bocaAncho = 14 + nivel * 5

  return (
    <div className="relative flex h-44 w-44 items-center justify-center">
      {activo &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute h-32 w-32 animate-coli-halo rounded-full border-2 border-primary/25"
            style={{ animationDelay: `${i * 0.85}s` }}
          />
        ))}
      {activo && (
        <span
          className="absolute rounded-full border-2 border-accent/60"
          style={{
            width: 132 + nivel * 46,
            height: 132 + nivel * 46,
            transition: 'width .09s ease-out, height .09s ease-out',
          }}
        />
      )}

      <div className="relative h-32 w-32 overflow-hidden rounded-full bg-gradient-to-b from-brand-100 via-brand-50 to-white shadow-soft-lg ring-4 ring-white">
        <svg viewBox="0 0 120 120" className="h-full w-full animate-coli-respira" aria-hidden>
          <defs>
            <linearGradient id="coli-gota" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5da0e6" />
              <stop offset="100%" stopColor="#004f9f" />
            </linearGradient>
          </defs>
          <path d="M60 14 C60 14 28 52 28 76 C28 94 42 106 60 106 C78 106 92 94 92 76 C92 52 60 14 60 14 Z" fill="url(#coli-gota)" />
          <ellipse cx="45" cy="56" rx="5" ry="9" fill="#fff" opacity=".35" transform="rotate(20 45 56)" />
          <ellipse cx="41" cy="86" rx="6" ry="3.5" fill="#fff" opacity=".25" />
          <ellipse cx="79" cy="86" rx="6" ry="3.5" fill="#fff" opacity=".25" />

          <g transform={`translate(0 ${cejas})`} style={{ transition: 'transform .25s ease-out' }}>
            <path d="M43 64 q6 -3 12 0" fill="none" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M65 64 q6 -3 12 0" fill="none" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
          </g>

          <ellipse cx="49" cy="74" rx="5.5" ry={parpadeo ? 0.7 : 5} fill="#fff" style={{ transition: 'ry .07s ease-out' }} />
          <ellipse cx="71" cy="74" rx="5.5" ry={parpadeo ? 0.7 : 5} fill="#fff" style={{ transition: 'ry .07s ease-out' }} />
          {!parpadeo && (
            <>
              <circle cx={49 + mirada} cy="74.5" r="2.6" fill="#0a2540" style={{ transition: 'cx .4s ease-out' }} />
              <circle cx={71 + mirada} cy="74.5" r="2.6" fill="#0a2540" style={{ transition: 'cx .4s ease-out' }} />
              <circle cx={50 + mirada} cy="73.3" r="1" fill="#fff" />
              <circle cx={72 + mirada} cy="73.3" r="1" fill="#fff" />
            </>
          )}

          {hablando && nivel > 0.08 ? (
            <ellipse
              cx="60"
              cy={91 + bocaAlto / 4}
              rx={bocaAncho / 2}
              ry={bocaAlto / 2}
              fill="#0a2540"
              style={{ transition: 'ry .07s ease-out, rx .12s ease-out' }}
            />
          ) : (
            <path d="M52 90 q8 6 16 0" fill="none" stroke="#0a2540" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </svg>
      </div>

      <span className="absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-navy text-white shadow-soft ring-2 ring-white">
        <Droplets size={18} />
      </span>

      {pensando && (
        <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 shadow-soft">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary"
              style={{ animationDelay: `${i * 130}ms` }}
            />
          ))}
        </div>
      )}

      {hablando && (
        <div className="absolute -bottom-2 flex h-5 items-end gap-1" aria-hidden>
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 origin-bottom animate-coli-barra rounded-full bg-primary/70"
              style={{ height: 8 + nivel * 12, animationDuration: `${0.5 + i * 0.09}s` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
