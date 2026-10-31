import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

const PASOS = ['Validando tus datos', 'Conectando con el banco', 'Confirmando el pago']

/** La pantalla de espera mientras la pasarela "responde": va marcando cada paso para que se sienta real. */
export default function ProcesandoPago({ titulo }: { titulo: string }) {
  const [paso, setPaso] = useState(0)

  useEffect(() => {
    const avance = window.setInterval(() => setPaso((p) => Math.min(p + 1, PASOS.length - 1)), 650)
    return () => window.clearInterval(avance)
  }, [])

  return (
    <div role="alertdialog" aria-modal="true" aria-label={titulo} className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 text-center shadow-soft-lg">
        <Loader2 className="mx-auto animate-spin text-primary" size={34} aria-hidden="true" />
        <h2 className="mt-4 text-lg font-extrabold text-navy">{titulo}</h2>
        <p className="mt-1 text-xs text-slate-500">No cierres esta ventana.</p>
        <ul className="mt-5 flex flex-col gap-2.5 text-left text-sm" aria-live="polite">
          {PASOS.map((texto, i) => (
            <li key={texto} className={`flex items-center gap-2.5 ${i <= paso ? 'text-navy' : 'text-slate-300'}`}>
              {i < paso ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-white">
                  <Check size={12} aria-hidden="true" />
                </span>
              ) : i === paso ? (
                <Loader2 size={20} className="animate-spin text-primary" aria-hidden="true" />
              ) : (
                <span className="h-5 w-5 rounded-full border-2 border-slate-200" aria-hidden="true" />
              )}
              {texto}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
