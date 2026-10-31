import { useEffect, useRef, useState } from 'react'
import { BellRing, Smartphone } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { formatoCOP } from '@/shared/lib/formato'
import { formatearCelular } from '@/domain/pagos/pasarela'

/** Nequi: solo se pide el celular; el pago se aprueba desde la app. */
export function FormularioNequi({ celular, onCelular, error }: { celular: string; onCelular: (celular: string) => void; error?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormField label="Celular registrado en Nequi" error={error} help="Te enviaremos el cobro a tu app. Usa un número de práctica: no se guarda completo.">
        <input
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="300 123 4567"
          value={celular}
          onChange={(e) => onCelular(formatearCelular(e.target.value))}
          aria-invalid={!!error}
          className={controlClass(!!error)}
        />
      </FormField>
    </div>
  )
}

const reloj = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

/** La notificación de Nequi, simulada: la persona aprueba o rechaza el cobro, o lo deja vencer. */
export function EsperandoNequi({
  celular,
  monto,
  segundos = 60,
  onAprobar,
  onRechazar,
  onVencer,
}: {
  celular: string
  monto: number
  segundos?: number
  onAprobar: () => void
  onRechazar: () => void
  onVencer: () => void
}) {
  const [restante, setRestante] = useState(segundos)
  const vencio = useRef(false)

  useEffect(() => {
    const reloj = window.setInterval(() => setRestante((r) => Math.max(0, r - 1)), 1000)
    return () => window.clearInterval(reloj)
  }, [])

  useEffect(() => {
    if (restante === 0 && !vencio.current) {
      vencio.current = true
      onVencer()
    }
  }, [restante, onVencer])

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col items-center gap-3 bg-gradient-to-b from-fuchsia-50 to-white px-5 py-8 text-center">
        <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-fuchsia-700 shadow-soft">
          <Smartphone size={30} aria-hidden="true" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-600 text-white animate-pulse-soft">
            <BellRing size={11} aria-hidden="true" />
          </span>
        </span>
        <h2 className="text-lg font-extrabold text-navy">Aprueba el pago en tu app de Nequi</h2>
        <p className="max-w-sm text-sm text-body">
          Enviamos el cobro al celular <strong className="text-navy">{celular}</strong>. Tienes{' '}
          <strong className="text-navy tabular-nums" role="timer">
            {reloj(restante)}
          </strong>{' '}
          para aprobarlo.
        </p>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 p-4 text-sm">
          <p className="text-xs font-bold tracking-wide text-fuchsia-800 uppercase">Así se ve en tu celular (simulado)</p>
          <p className="mt-1.5 text-navy">
            <strong>COLORLINK</strong> te envió un cobro de <strong>{formatoCOP.format(monto)}</strong>. ¿Lo apruebas?
          </p>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button size="lg" onClick={onAprobar} className="sm:flex-1">
            Aprobar en Nequi
          </Button>
          <Button size="lg" variant="secondary" onClick={onRechazar} className="sm:flex-1">
            Rechazar
          </Button>
        </div>
      </div>
    </Card>
  )
}
