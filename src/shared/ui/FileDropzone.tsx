import { useRef, useState, type DragEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import type { EvidenciaImagen } from '@/domain/solicitud/types'

export default function FileDropzone({
  imagenes,
  onChange,
}: {
  imagenes: EvidenciaImagen[]
  onChange: (imagenes: EvidenciaImagen[]) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const nuevas: EvidenciaImagen[] = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        nombre: file.name,
        url: URL.createObjectURL(file),
      }))
    if (nuevas.length) onChange([...imagenes, ...nuevas])
  }

  const removeImage = (id: string) => onChange(imagenes.filter((img) => img.id !== id))

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e: DragEvent) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e: DragEvent) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
          isDragging ? 'border-primary bg-pink-50' : 'border-slate-200 bg-slate-50 hover:border-primary/60'
        }`}
      >
        <ImagePlus className="text-primary" size={28} />
        <p className="text-sm font-medium text-navy">Arrastra tus fotos aquí</p>
        <p className="text-xs text-slate-400">o haz clic para seleccionar imágenes</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {imagenes.length > 0 && (
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
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-navy/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`Eliminar ${img.nombre}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
