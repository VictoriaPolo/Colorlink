import type { ReactNode } from 'react'
import { BrickWall, Building2, Camera, Fence, Grid2x2, PanelTop, ScanSearch, Shapes, type LucideIcon } from 'lucide-react'
import { controlClass } from '@/shared/ui/FormField'
import FileDropzone from '@/shared/ui/FileDropzone'
import { zonaSugerida } from '@/domain/diagnostico/zona'
import { ZONAS_AFECTADAS, type EvidenciaData, type EvidenciaImagen, type TecnicaData, type ZonaAfectada } from '@/domain/solicitud/types'
import DiagnosticoCard from '@/features/diagnostico/DiagnosticoCard'
import FotoAnalizada from '@/features/diagnostico/FotoAnalizada'
import { clasesDeDiagnostico, comprimirFoto } from '@/features/diagnostico/imagen'
import { useDiagnostico } from '@/features/diagnostico/useDiagnostico'

const ICONO_ZONA: Record<ZonaAfectada, { icono: LucideIcon; pista: string }> = {
  Pared: { icono: BrickWall, pista: 'Muros interiores' },
  Techo: { icono: PanelTop, pista: 'Cielo raso o cubierta' },
  Piso: { icono: Grid2x2, pista: 'Suelo o placa' },
  Fachada: { icono: Building2, pista: 'Exterior de la obra' },
  'Metal o reja': { icono: Fence, pista: 'Rejas, puertas, barandas' },
  Otra: { icono: Shapes, pista: 'Otra superficie' },
}

/** Frases de partida: ayudan a describir el problema con las palabras que el análisis entiende. */
const FRASES = ['Manchas de humedad', 'Moho negro', 'Grietas', 'La pintura se cae', 'Óxido', 'Gotera cuando llueve']

function Seccion({ numero, titulo, children }: { numero: number; titulo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{numero}</span>
        <span className="text-sm font-semibold text-navy">{titulo}</span>
      </div>
      {children}
    </div>
  )
}

export default function Step4Evidencia({
  data,
  tecnica,
  errors,
  onChange,
}: {
  data: EvidenciaData
  tecnica: TecnicaData
  errors: Partial<Record<keyof EvidenciaData, string>>
  onChange: (data: EvidenciaData) => void
}) {
  const set = <K extends keyof EvidenciaData>(key: K, value: EvidenciaData[K]) => onChange({ ...data, [key]: value })
  const setImagenes = (imagenes: EvidenciaImagen[]) => set('imagenes', imagenes)

  const zona = data.zona ?? zonaSugerida(tecnica)
  const { diagnostico, analizando } = useDiagnostico({ tecnica, evidencia: data })
  const hayDatos = data.imagenes.length > 0 || data.descripcion.trim().length >= 8

  const agregarFrase = (frase: string) => {
    const actual = data.descripcion.trim()
    if (actual.toLowerCase().includes(frase.toLowerCase())) return
    set('descripcion', actual ? `${actual.replace(/[.\s]+$/, '')}. ${frase}.` : `${frase}.`)
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-xl font-bold text-navy sm:text-2xl">Muéstranos el proyecto</h2>
        <p className="mt-1 text-sm text-body">
          Cuéntanos qué pasa y sube una foto: la analizamos al instante y te adelantamos un diagnóstico.
        </p>
      </div>

      <Seccion numero={1} titulo="¿Dónde está el problema?">
        <div role="radiogroup" aria-label="Zona afectada" className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {ZONAS_AFECTADAS.map((z) => {
            const { icono: Icono, pista } = ICONO_ZONA[z]
            const activa = z === zona
            return (
              <button
                key={z}
                type="button"
                role="radio"
                aria-checked={activa}
                onClick={() => set('zona', z)}
                className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors ${
                  activa ? 'border-primary bg-brand-50 ring-2 ring-primary/15' : 'border-slate-200 bg-white hover:border-primary/50'
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${activa ? 'bg-primary text-white' : 'bg-slate-100 text-body'}`}>
                  <Icono size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-navy">{z}</span>
                  <span className="block truncate text-xs text-slate-400">{pista}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Seccion>

      <Seccion numero={2} titulo="Cuéntanos qué ves">
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Descripción del problema</span>
          <textarea
            className={`${controlClass(!!errors.descripcion)} min-h-24 resize-y`}
            placeholder="Ej.: Hay una mancha oscura en la esquina del techo que crece cuando llueve…"
            value={data.descripcion}
            onChange={(e) => set('descripcion', e.target.value)}
          />
          {errors.descripcion && <span className="text-xs font-medium text-red-500">{errors.descripcion}</span>}
        </label>
        <div className="flex flex-wrap gap-2">
          {FRASES.map((frase) => (
            <button
              key={frase}
              type="button"
              onClick={() => agregarFrase(frase)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-body transition-colors hover:border-primary hover:text-primary"
            >
              + {frase}
            </button>
          ))}
        </div>
      </Seccion>

      <Seccion numero={3} titulo="Agrega fotos (recomendado)">
        <FileDropzone imagenes={data.imagenes} onChange={setImagenes} procesar={comprimirFoto} />
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <Camera size={14} className="mt-0.5 shrink-0 text-primary" />
          Con buena luz, de frente y a 1 o 2 metros del daño. Una segunda foto más de cerca ayuda mucho.
        </p>
      </Seccion>

      <div aria-live="polite" className="flex flex-col gap-4">
        {hayDatos ? (
          <>
            <DiagnosticoCard diagnostico={diagnostico} compacto analizando={analizando} />
            {data.imagenes.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.imagenes.map((img) => (
                  <FotoAnalizada
                    key={img.id}
                    url={img.url}
                    nombre={img.nombre}
                    clases={clasesDeDiagnostico(diagnostico)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-surface-muted p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-soft">
              <ScanSearch size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold text-navy">Aquí aparecerá tu diagnóstico</p>
              <p className="text-xs text-slate-500">Describe el problema o sube una foto y lo analizamos al instante.</p>
            </div>
          </div>
        )}
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
          className="mt-0.5 h-4 w-4 accent-brand-700"
          checked={data.consentimiento}
          onChange={(e) => set('consentimiento', e.target.checked)}
        />
        <span className="text-sm text-body">
          He leído y acepto el tratamiento de mis datos y el uso de las imágenes proporcionadas para
          analizar mi solicitud.
        </span>
      </label>
      {errors.consentimiento && <span className="-mt-3 text-xs font-medium text-red-500">{errors.consentimiento}</span>}
    </div>
  )
}
