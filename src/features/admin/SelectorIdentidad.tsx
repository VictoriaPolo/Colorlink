import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

interface Opcion {
  valor: string
  etiqueta: string
}

/** Reemplaza un <select> nativo: el popup del navegador no respeta de forma
 * confiable los colores del sitio (texto blanco sobre fondo blanco en varios
 * navegadores), así que este menú se dibuja por completo con nuestros estilos. */
export default function SelectorIdentidad({ valor, opciones, onCambiar }: { valor: string; opciones: Opcion[]; onCambiar: (valor: string) => void }) {
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alClicAfuera = (e: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) setAbierto(false)
    }
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('mousedown', alClicAfuera)
    document.addEventListener('keydown', alEscape)
    return () => {
      document.removeEventListener('mousedown', alClicAfuera)
      document.removeEventListener('keydown', alEscape)
    }
  }, [abierto])

  const actual = opciones.find((o) => o.valor === valor)

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-2 rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-left text-xs font-semibold text-white hover:bg-white/10"
      >
        <span className="truncate">{actual?.etiqueta ?? valor}</span>
        <ChevronDown size={13} className="shrink-0 text-white/60" />
      </button>

      {abierto && (
        <ul role="listbox" className="absolute bottom-full z-50 mb-1 w-full overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-left shadow-soft-lg">
          {opciones.map((o) => (
            <li key={o.valor}>
              <button
                type="button"
                role="option"
                aria-selected={o.valor === valor}
                onClick={() => {
                  onCambiar(o.valor)
                  setAbierto(false)
                }}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold ${
                  o.valor === valor ? 'bg-brand-50 text-primary' : 'text-navy hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{o.etiqueta}</span>
                {o.valor === valor && <Check size={13} className="shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
