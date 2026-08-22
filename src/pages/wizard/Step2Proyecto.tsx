import { MapPin, Building2, Ruler, CalendarDays } from 'lucide-react'
import FormField, { controlClass } from '../../components/ui/FormField'
import type { ProyectoData } from '../../types'

const TIPOS_OBRA = [
  'Vivienda',
  'Edificio',
  'Local comercial',
  'Oficina',
  'Bodega',
  'Proyecto industrial',
  'Otro',
]

const CIUDADES = [
  'Bogotá',
  'Medellín',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Otra',
]

export default function Step2Proyecto({
  data,
  errors,
  onChange,
}: {
  data: ProyectoData
  errors: Partial<Record<keyof ProyectoData, string>>
  onChange: (data: ProyectoData) => void
}) {
  const set = <K extends keyof ProyectoData>(key: K, value: ProyectoData[K]) =>
    onChange({ ...data, [key]: value })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Cuéntanos sobre tu proyecto</h2>
        <p className="mt-1 text-sm text-body">Datos generales del espacio a intervenir.</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Ciudad" required icon={<MapPin size={15} />} error={errors.ciudad}>
          <select
            className={controlClass(!!errors.ciudad)}
            value={data.ciudad}
            onChange={(e) => set('ciudad', e.target.value)}
          >
            <option value="">Selecciona una ciudad</option>
            {CIUDADES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Tipo de obra" required icon={<Building2 size={15} />} error={errors.tipoObra}>
          <select
            className={controlClass(!!errors.tipoObra)}
            value={data.tipoObra}
            onChange={(e) => set('tipoObra', e.target.value as ProyectoData['tipoObra'])}
          >
            <option value="">Selecciona una opción</option>
            {TIPOS_OBRA.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Área aproximada" required icon={<Ruler size={15} />} error={errors.areaAprox}>
          <div className="relative">
            <input
              type="number"
              min={0}
              className={`${controlClass(!!errors.areaAprox)} pr-12`}
              placeholder="0"
              value={data.areaAprox}
              onChange={(e) => set('areaAprox', e.target.value)}
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              m²
            </span>
          </div>
        </FormField>

        <FormField label="Fecha requerida" required icon={<CalendarDays size={15} />} error={errors.fechaRequerida}>
          <input
            type="date"
            className={controlClass(!!errors.fechaRequerida)}
            value={data.fechaRequerida}
            onChange={(e) => set('fechaRequerida', e.target.value)}
          />
        </FormField>
      </div>
    </div>
  )
}
