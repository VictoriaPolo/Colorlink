import { User, Hash, UserCheck, Radio } from 'lucide-react'
import FormField, { controlClass } from '@/shared/ui/FormField'
import type { IdentificacionData } from '@/domain/solicitud/types'

const CANALES = ['Página web', 'WhatsApp', 'Llamada', 'Punto físico', 'Otro']

export default function Step1Identificacion({
  data,
  errors,
  onChange,
}: {
  data: IdentificacionData
  errors: Partial<Record<keyof IdentificacionData, string>>
  onChange: (data: IdentificacionData) => void
}) {
  const set = <K extends keyof IdentificacionData>(key: K, value: IdentificacionData[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Cuéntanos quién eres</h2>
        <p className="mt-1 text-sm text-body">
          Necesitamos algunos datos básicos para identificar tu solicitud.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Cliente" required icon={<User size={15} />} error={errors.cliente}>
          <input
            className={controlClass(!!errors.cliente)}
            placeholder="Nombre o razón social"
            value={data.cliente}
            onChange={(e) => set('cliente', e.target.value)}
          />
        </FormField>

        <FormField label="NIT / Documento" required icon={<Hash size={15} />} error={errors.nit}>
          <input
            className={controlClass(!!errors.nit)}
            placeholder="Ej. 900123456-7"
            value={data.nit}
            onChange={(e) => set('nit', e.target.value)}
          />
        </FormField>

        <FormField label="Responsable" required icon={<UserCheck size={15} />} error={errors.responsable}>
          <input
            className={controlClass(!!errors.responsable)}
            placeholder="Persona de contacto"
            value={data.responsable}
            onChange={(e) => set('responsable', e.target.value)}
          />
        </FormField>

        <FormField label="Canal de entrada" required icon={<Radio size={15} />} error={errors.canal}>
          <select
            className={controlClass(!!errors.canal)}
            value={data.canal}
            onChange={(e) => set('canal', e.target.value as IdentificacionData['canal'])}
          >
            <option value="">Selecciona una opción</option>
            {CANALES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>
      </div>
    </div>
  )
}
