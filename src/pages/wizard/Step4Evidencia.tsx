import { controlClass } from '../../components/ui/FormField'
import FileDropzone from '../../components/ui/FileDropzone'
import type { EvidenciaData, EvidenciaImagen } from '../../types'

export default function Step4Evidencia({
  data,
  errors,
  onChange,
}: {
  data: EvidenciaData
  errors: Partial<Record<keyof EvidenciaData, string>>
  onChange: (data: EvidenciaData) => void
}) {
  const set = <K extends keyof EvidenciaData>(key: K, value: EvidenciaData[K]) =>
    onChange({ ...data, [key]: value })

  const setImagenes = (imagenes: EvidenciaImagen[]) => set('imagenes', imagenes)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Muéstranos el proyecto</h2>
        <p className="mt-1 text-sm text-body">Las imágenes nos ayudan a comprender mejor la necesidad.</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-navy">Descripción</span>
        <textarea
          className={`${controlClass(!!errors.descripcion)} min-h-24 resize-y`}
          placeholder="Describe brevemente qué necesitas…"
          value={data.descripcion}
          onChange={(e) => set('descripcion', e.target.value)}
        />
        {errors.descripcion && <span className="text-xs font-medium text-red-500">{errors.descripcion}</span>}
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-navy">Cargar fotografías</span>
        <FileDropzone imagenes={data.imagenes} onChange={setImagenes} />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-navy">Observaciones (opcional)</span>
        <textarea
          className={`${controlClass(false)} min-h-20 resize-y`}
          placeholder="Algo más que debamos saber…"
          value={data.observaciones}
          onChange={(e) => set('observaciones', e.target.value)}
        />
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-blue-600"
          checked={data.consentimiento}
          onChange={(e) => set('consentimiento', e.target.checked)}
        />
        <span className="text-sm text-body">
          He leído y acepto el tratamiento de mis datos y el uso de las imágenes proporcionadas para
          analizar mi solicitud.
        </span>
      </label>
      {errors.consentimiento && (
        <span className="-mt-3 text-xs font-medium text-red-500">{errors.consentimiento}</span>
      )}
    </div>
  )
}
