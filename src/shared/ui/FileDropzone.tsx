import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import type { EvidenciaImagen } from '@/domain/solicitud/types'

export default function FileDropzone({
  imagenes,
  onChange,
  maximo = 4,
  procesar = async (archivo) => URL.createObjectURL(archivo),
}: {
  imagenes: EvidenciaImagen[]
  onChange: (imagenes: EvidenciaImagen[]) => void
  maximo?: number
  /** Convierte el archivo en la URL que se guarda (por ejemplo, reduciéndolo y comprimiéndolo). */
  procesar?: (archivo: File) => Promise<string>
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [procesando, setProcesando] = useState(0)
  const [aviso, setAviso] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const soloImagenes = Array.from(files).filter((file) => file.type.startsWith('image/'))
    const cupo = Math.max(0, maximo - imagenes.length)
    const aceptadas = soloImagenes.slice(0, cupo)

    if (cupo === 0) setAviso(`Ya subiste las ${maximo} fotos permitidas.`)
    else if (soloImagenes.length > cupo) setAviso(`Solo caben ${maximo} fotos: se agregaron las primeras ${cupo}.`)
    else if (soloImagenes.length < files.length) setAviso('Solo se pueden subir imágenes.')
    else setAviso('')
    if (aceptadas.length === 0) return

    setProcesando((n) => n + aceptadas.length)
    const listas: EvidenciaImagen[] = []
    for (const file of aceptadas) {
      try {
        listas.push({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          nombre: file.name,
          url: await procesar(file),
        })
      } catch {
        setAviso(`No se pudo leer "${file.name}". Prueba con otra foto.`)
      } finally {
        setProcesando((n) => n - 1)
      }
    }
    if (listas.length) onChange([...imagenes, ...listas])
  }

  const removeImage = (id: string) => onChange(imagenes.filter((img) => img.id !== id))

  const lleno = imagenes.length >= maximo

  return (
    <div className="flex flex-col gap-3">
      <div
        role="button"
        tabIndex={0}
        aria-label="Subir fotografías"
        onDragOver={(e: DragEvent) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          setIsDragging(false)
          void addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
          isDragging ? 'border-primary bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-primary/60'
        } ${lleno ? 'opacity-60' : ''}`}
      >
        <ImagePlus className="text-primary" size={28} />
        <p className="text-sm font-medium text-navy">Arrastra tus fotos aquí</p>
        <p className="text-xs text-slate-400">
          o haz clic para elegirlas o tomarlas con la cámara · {imagenes.length}/{maximo}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void addFiles(e.target.files)
            e.target.value = ''
          }}
        />
      </div>

      {aviso && (
        <p role="status" className="text-xs font-medium text-amber-700">
          {aviso}
        </p>
      )}

      {(imagenes.length > 0 || procesando > 0) && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {imagenes.map((img) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200">
              <img src={img.url} alt={img.nombre} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(img.id)
                }}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy/75 text-white transition-opacity focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label={`Eliminar ${img.nombre}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {Array.from({ length: procesando }).map((_, i) => (
            <div
              key={`procesando-${i}`}
              className="flex aspect-square items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-primary"
            >
              <Loader2 className="animate-spin" size={20} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
