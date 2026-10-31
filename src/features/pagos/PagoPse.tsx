import { Landmark, ShieldAlert } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { formatoCOP } from '@/shared/lib/formato'
import { BANCOS_PSE } from '@/domain/pagos/pasarela'

export type TipoPersona = 'natural' | 'juridica'

/** PSE: se elige el tipo de persona y el banco; el pago se termina en la página del banco. */
export function FormularioPse({
  banco,
  onBanco,
  persona,
  onPersona,
  error,
}: {
  banco: string
  onBanco: (banco: string) => void
  persona: TipoPersona
  onPersona: (persona: TipoPersona) => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-navy">Tipo de persona</legend>
        <div className="grid grid-cols-2 gap-3">
          {(['natural', 'juridica'] as const).map((tipo) => (
            <label
              key={tipo}
              className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                persona === tipo ? 'border-primary bg-brand-50 text-primary' : 'border-slate-200 bg-white text-body hover:border-primary/50'
              }`}
            >
              <input type="radio" name="persona-pse" checked={persona === tipo} onChange={() => onPersona(tipo)} className="accent-primary" />
              {tipo === 'natural' ? 'Persona natural' : 'Persona jurídica'}
            </label>
          ))}
        </div>
      </fieldset>

      <FormField label="Tu banco" error={error}>
        <select value={banco} onChange={(e) => onBanco(e.target.value)} aria-invalid={!!error} className={controlClass(!!error)}>
          <option value="">Elige tu banco…</option>
          {BANCOS_PSE.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </FormField>

      <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-500">
        Te llevaremos a la página de tu banco para autorizar el pago desde tu cuenta. Aquí esa página es una pantalla de práctica.
      </p>
    </div>
  )
}

/** La página del banco, simulada: solo se autoriza o se cancela, nunca se piden claves. */
export function PantallaBanco({
  banco,
  monto,
  referencia,
  onAutorizar,
  onCancelar,
}: {
  banco: string
  monto: number
  referencia: string
  onAutorizar: () => void
  onCancelar: () => void
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 bg-navy px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-accent">
          <Landmark size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs text-white/60">Banco simulado</p>
          <h2 className="text-base font-extrabold">{banco}</h2>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <p className="text-sm text-body">Revisa el pago y autorízalo para volver a COLORLINK.</p>
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 text-sm">
          {[
            ['Comercio', 'COLORLINK · Distribuidor Pintuco'],
            ['Valor a pagar', formatoCOP.format(monto)],
            ['Referencia', referencia],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-slate-500">{etiqueta}</dt>
              <dd className="text-right font-bold text-navy">{valor}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-xs leading-relaxed text-amber-900">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          Simulación: esta no es la página de ningún banco. No escribas usuarios ni claves reales.
        </p>
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button size="lg" onClick={onAutorizar} className="sm:flex-1">
            Autorizar pago
          </Button>
          <Button size="lg" variant="secondary" onClick={onCancelar} className="sm:flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  )
}
