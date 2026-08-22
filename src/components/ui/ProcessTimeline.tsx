const ETAPAS = ['Necesidad', 'Solución técnica', 'Abastecimiento', 'Servicio', 'Calidad']

export default function ProcessTimeline({ etapaActual }: { etapaActual: number }) {
  return (
    <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
      {ETAPAS.map((etapa, index) => {
        const numero = index + 1
        const isDone = numero < etapaActual
        const isCurrent = numero === etapaActual
        return (
          <div key={etapa} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
            <div className="flex items-center sm:w-full">
              {index !== 0 && (
                <div className={`hidden h-0.5 flex-1 sm:block ${isDone || isCurrent ? 'bg-primary' : 'bg-slate-200'}`} />
              )}
            </div>
            <div className="flex flex-col items-center gap-1 sm:flex-1">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  isDone
                    ? 'bg-primary text-white'
                    : isCurrent
                      ? 'bg-teal text-white ring-4 ring-teal-100 animate-pulse-soft'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {numero}
              </div>
              <span
                className={`text-xs font-medium sm:text-center ${
                  isCurrent ? 'text-teal font-semibold' : isDone ? 'text-primary' : 'text-slate-400'
                }`}
              >
                {etapa}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
