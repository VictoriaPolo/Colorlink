import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const PASOS = [
  'Información del proyecto recibida',
  'Características técnicas identificadas',
  'Revisando la foto y la descripción',
  'Calculando solución recomendada',
  'Preparando propuesta',
]

export default function Processing({ onDone, foto }: { onDone: () => void; foto?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= PASOS.length - 1) {
      const finish = setTimeout(onDone, 550)
      return () => clearTimeout(finish)
    }
    const timer = setTimeout(() => setActiveIndex((i) => i + 1), 480)
    return () => clearTimeout(timer)
  }, [activeIndex, onDone])

  return (
    <div className="flex flex-col items-center gap-8 py-10 text-center">
      {foto ? (
        <div className="relative h-28 w-44 overflow-hidden rounded-xl border border-slate-200 shadow-soft">
          <img src={foto} alt="" className="h-full w-full object-cover" />
          <span
            aria-hidden="true"
            className="absolute inset-x-0 h-1/3 animate-escanear bg-linear-to-b from-transparent via-white/70 to-transparent"
          />
        </div>
      ) : (
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute h-20 w-20 animate-pulse-soft rounded-full bg-brand-100" />
          <Loader2 className="relative animate-spin text-primary" size={34} />
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">
          COLORLINK está analizando tu solicitud…
        </h2>
        <p className="mt-1 text-sm text-body">Esto tomará solo unos segundos.</p>
      </div>

      <ul className="mx-auto flex w-full max-w-sm flex-col gap-3 text-left">
        {PASOS.map((paso, index) => {
          const isDone = index < activeIndex
          const isCurrent = index === activeIndex
          return (
            <li key={paso} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  isDone
                    ? 'bg-success text-white'
                    : isCurrent
                      ? 'bg-primary text-white animate-pulse-soft'
                      : 'bg-slate-100 text-slate-300'
                }`}
              >
                {isDone ? <Check size={13} /> : isCurrent ? '●' : '○'}
              </span>
              <span
                className={`text-sm ${isDone || isCurrent ? 'font-medium text-navy' : 'text-slate-400'}`}
              >
                {paso}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
