import { Layers, Wind, Activity, Palette } from 'lucide-react'
import FormField, { controlClass } from '@/shared/ui/FormField'
import HelpHint from '@/shared/ui/HelpHint'
import type { TecnicaData } from '@/domain/solicitud/types'

const SUPERFICIES = ['Interior', 'Exterior', 'Fachada', 'Metal', 'Madera', 'Concreto', 'Otro']
const AMBIENTES = ['Interior seco', 'Interior húmedo', 'Exterior', 'Industrial', 'Alta exposición']
const CONDICIONES = [
  'Nueva',
  'Buen estado',
  'Desgastada',
  'Con humedad',
  'Con grietas',
  'Con pintura deteriorada',
  'Requiere reparación',
]
const ACABADOS = ['Mate', 'Satinado', 'Brillante', 'Antideslizante', 'No estoy seguro']

export default function Step3Tecnica({
  data,
  errors,
  onChange,
}: {
  data: TecnicaData
  errors: Partial<Record<keyof TecnicaData, string>>
  onChange: (data: TecnicaData) => void
}) {
  const set = <K extends keyof TecnicaData>(key: K, value: TecnicaData[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Conozcamos el espacio</h2>
        <p className="mt-1 text-sm text-body">
          Esta información nos ayudará a identificar la solución más adecuada.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Superficie" required icon={<Layers size={15} />} error={errors.superficie}>
          <select
            className={controlClass(!!errors.superficie)}
            value={data.superficie}
            onChange={(e) => set('superficie', e.target.value as TecnicaData['superficie'])}
          >
            <option value="">Selecciona una opción</option>
            {SUPERFICIES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Ambiente" required icon={<Wind size={15} />} error={errors.ambiente}>
          <select
            className={controlClass(!!errors.ambiente)}
            value={data.ambiente}
            onChange={(e) => set('ambiente', e.target.value as TecnicaData['ambiente'])}
          >
            <option value="">Selecciona una opción</option>
            {AMBIENTES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Condición actual" required icon={<Activity size={15} />} error={errors.condicion}>
          <select
            className={controlClass(!!errors.condicion)}
            value={data.condicion}
            onChange={(e) => set('condicion', e.target.value as TecnicaData['condicion'])}
          >
            <option value="">Selecciona una opción</option>
            {CONDICIONES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Color / acabado" required icon={<Palette size={15} />} error={errors.colorAcabado}>
          <select
            className={controlClass(!!errors.colorAcabado)}
            value={data.colorAcabado}
            onChange={(e) => set('colorAcabado', e.target.value as TecnicaData['colorAcabado'])}
          >
            <option value="">Selecciona una opción</option>
            {ACABADOS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      {data.colorAcabado === 'No estoy seguro' && (
        <HelpHint>¿No sabes qué seleccionar? No te preocupes, COLORLINK puede ayudarte.</HelpHint>
      )}
    </div>
  )
}
