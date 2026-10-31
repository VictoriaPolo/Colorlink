import { useState } from 'react'
import { ChevronDown, FlaskConical, ShieldAlert } from 'lucide-react'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { TARJETAS_DE_PRUEBA, type TarjetaDePrueba } from '@/domain/pagos/pasarela'
import {
  NOMBRE_MARCA,
  formatearNumero,
  formatearVencimiento,
  longitudCvv,
  marcaDeTarjeta,
  soloDigitos,
  type DatosTarjeta,
  type ErroresTarjeta,
} from '@/domain/pagos/tarjeta'

interface Props {
  datos: DatosTarjeta
  errores: ErroresTarjeta
  onChange: (cambio: Partial<DatosTarjeta>) => void
  /** Avisa cuando se entra o se sale del código de seguridad (la tarjeta se da vuelta). */
  onCvv: (enfocado: boolean) => void
  /** El nombre de la persona, para llenar el titular al usar una tarjeta de prueba. */
  titularSugerido: string
}

export default function FormularioTarjeta({ datos, errores, onChange, onCvv, titularSugerido }: Props) {
  const [verPruebas, setVerPruebas] = useState(true)
  const marca = marcaDeTarjeta(datos.numero)
  const largoCvv = longitudCvv(marca)

  const usar = (t: TarjetaDePrueba) =>
    onChange({
      numero: formatearNumero(t.numero),
      titular: datos.titular.trim() ? datos.titular : titularSugerido,
      vencimiento: '12/30',
      cvv: t.marca === 'amex' ? '1234' : '123',
    })

  return (
    <div className="flex flex-col gap-4">
      <FormField label="Número de la tarjeta" error={errores.numero}>
        <input
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={datos.numero}
          onChange={(e) => onChange({ numero: formatearNumero(e.target.value) })}
          aria-invalid={!!errores.numero}
          className={controlClass(!!errores.numero)}
        />
      </FormField>

      <FormField label="Nombre del titular" error={errores.titular}>
        <input
          autoComplete="cc-name"
          placeholder="Como aparece en la tarjeta"
          value={datos.titular}
          onChange={(e) => onChange({ titular: e.target.value })}
          aria-invalid={!!errores.titular}
          className={controlClass(!!errores.titular)}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Vencimiento" error={errores.vencimiento}>
          <input
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/AA"
            maxLength={5}
            value={datos.vencimiento}
            onChange={(e) => onChange({ vencimiento: formatearVencimiento(e.target.value) })}
            aria-invalid={!!errores.vencimiento}
            className={controlClass(!!errores.vencimiento)}
          />
        </FormField>
        <FormField label={marca === 'amex' ? 'Código (4 dígitos)' : 'Código de seguridad'} error={errores.cvv}>
          <input
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={marca === 'amex' ? '1234' : '123'}
            maxLength={largoCvv}
            value={datos.cvv}
            onChange={(e) => onChange({ cvv: soloDigitos(e.target.value).slice(0, largoCvv) })}
            onFocus={() => onCvv(true)}
            onBlur={() => onCvv(false)}
            aria-invalid={!!errores.cvv}
            className={controlClass(!!errores.cvv)}
          />
        </FormField>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50/70">
        <button
          type="button"
          onClick={() => setVerPruebas((v) => !v)}
          aria-expanded={verPruebas}
          className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm font-bold text-amber-900"
        >
          <span className="flex items-center gap-2">
            <FlaskConical size={16} aria-hidden="true" /> Tarjetas de prueba
          </span>
          <ChevronDown size={16} aria-hidden="true" className={`transition-transform ${verPruebas ? 'rotate-180' : ''}`} />
        </button>
        {verPruebas && (
          <div className="border-t border-amber-200 px-3.5 py-3">
            <p className="mb-2.5 flex items-start gap-2 text-xs leading-relaxed text-amber-900">
              <ShieldAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              Es una pasarela de práctica: solo acepta estas tarjetas y no cobra nada. No escribas los datos de una tarjeta real.
            </p>
            <ul className="flex flex-col divide-y divide-amber-200/70">
              {TARJETAS_DE_PRUEBA.map((t) => (
                <li key={t.numero} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-semibold text-navy">{formatearNumero(t.numero)}</p>
                    <p className="text-[11px] text-amber-900/80">
                      {NOMBRE_MARCA[t.marca]} · {t.descripcion}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => usar(t)}
                    aria-label={`Usar la tarjeta de prueba ${formatearNumero(t.numero)}`}
                    className="shrink-0 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primary ring-1 ring-primary/30 transition-colors hover:bg-brand-50"
                  >
                    Usar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
