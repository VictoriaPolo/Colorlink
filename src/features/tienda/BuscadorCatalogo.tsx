import { useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import type { Kit, PatologiaKit, Producto } from '@/domain/tienda/types'
import { coincideConBusqueda } from '@/domain/tienda/busqueda'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { fotoProducto } from './fotosProducto'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const ACCESOS = [
  { titulo: '🏢 Pintura de fachadas (Koraza)', texto: 'Exterior con 5 años de garantía', to: '/catalogo?q=fachadas' },
  { titulo: '🏠 Vinilos de interior (Viniltex)', texto: 'Lavables y de bajo olor', to: '/catalogo?q=interior' },
  { titulo: '🎨 Simulador de ambientes 2026', texto: 'Prueba tonos en salas y fachadas', to: '/simulador' },
  { titulo: '📐 ¿Cuánta pintura necesito?', texto: 'Calcula galones exactos por m²', to: '/calculadora' },
]

/** Palabras que delatan cada patología, para sugerir su kit mientras se escribe. */
const CLAVES_PATOLOGIA: Record<PatologiaKit, RegExp> = {
  'Fachada exterior': /fachad|koraza|exterior|griet|fisur/,
  'Humedad y moho': /humed|moho|hongo|salitre/,
  'Goteras y terrazas': /goter|terraz|techo|cubierta|filtra/,
  'Metales oxidados': /metal|oxid|óxid|reja|corros/,
}

/** Busca en el catálogo (/catalogo?q=) con sugerencias mientras se escribe:
 * productos que coinciden y el kit de la patología que se menciona. */
export default function BuscadorCatalogo({ onNavegar, className = '' }: { onNavegar?: () => void; className?: string }) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [productos, setProductos] = useState<Producto[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [pedido, setPedido] = useState(false)

  // Catálogo y kits se piden al primer foco, no en cada carga de página.
  const abrir = () => {
    setAbierto(true)
    if (pedido) return
    setPedido(true)
    tiendaRepository.listarProductos().then(setProductos).catch(() => {})
    tiendaRepository.listarKits().then(setKits).catch(() => {})
  }

  const ir = (to: string) => {
    navigate(to)
    setTexto('')
    setAbierto(false)
    inputRef.current?.blur()
    onNavegar?.()
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    ir(texto.trim() ? `/catalogo?q=${encodeURIComponent(texto.trim())}` : '/catalogo')
  }

  const q = texto.trim().toLowerCase()
  const kitSugerido = q ? kits.find((k) => CLAVES_PATOLOGIA[k.patologia].test(q)) : undefined
  // También los productos del kit sugerido: "humedad" no aparece en el texto
  // de Aquablock, pero es justo el producto que se busca.
  const coincidencias = q
    ? productos
        .filter((p) => coincideConBusqueda(p, q) || kitSugerido?.componentes.some((c) => p.nombre.includes(c)))
        .slice(0, 3)
    : []

  return (
    <form onSubmit={handleSubmit} role="search" className={`relative ${className}`}>
      <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={16} />
      <input
        ref={inputRef}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onFocus={abrir}
        onBlur={() => setAbierto(false)}
        onKeyDown={(e) => e.key === 'Escape' && inputRef.current?.blur()}
        placeholder="Busca pinturas (Koraza, Viniltex), fachadas, humedad..."
        aria-label="Buscar en el catálogo"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-20 pl-10 text-xs font-medium text-navy outline-none transition-colors placeholder:text-slate-400 hover:bg-slate-100 focus:border-primary focus:bg-white focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-primary-dark"
      >
        Buscar
      </button>

      {abierto && (
        // preventDefault en mousedown: el clic en una sugerencia no le quita el foco al input.
        <div
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full right-0 left-0 z-50 mt-2 rounded-xl border border-slate-100 bg-white p-4 shadow-soft-lg"
        >
          {!q ? (
            <>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Búsquedas frecuentes y accesos rápidos
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ACCESOS.map((a) => (
                  <button
                    key={a.titulo}
                    type="button"
                    onClick={() => ir(a.to)}
                    className="rounded-xl border border-slate-100 bg-surface-muted p-2.5 text-left transition-colors hover:border-brand-200 hover:bg-brand-50"
                  >
                    <span className="block text-xs font-bold text-navy">{a.titulo}</span>
                    <span className="block text-[10px] text-slate-400">{a.texto}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <span className="truncate text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Sugerencias para “{texto.trim()}”
                </span>
                <span className="shrink-0 rounded bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-primary">
                  Asistente COLORLINK
                </span>
              </div>

              {kitSugerido && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50/60 p-2.5">
                  <div>
                    <p className="text-xs font-bold text-navy">{kitSugerido.nombre}</p>
                    <p className="text-[11px] text-body">{kitSugerido.componentes.join(' + ')}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => ir(`/?kit=${encodeURIComponent(kitSugerido.patologia)}`)}
                    className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
                  >
                    Ver kit (-{kitSugerido.descuentoPct}%)
                  </button>
                </div>
              )}

              <div>
                <p className="mb-1 text-[11px] font-bold uppercase text-slate-400">Productos que coinciden</p>
                {coincidencias.length === 0 ? (
                  <p className="py-2 text-xs text-slate-400">No hay productos para esa búsqueda.</p>
                ) : (
                  coincidencias.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => ir(`/catalogo?q=${encodeURIComponent(p.nombre)}`)}
                      className="group flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
                    >
                      <span className="flex items-center gap-2.5">
                        <img
                          src={fotoProducto(p.id, 80, 80)}
                          alt=""
                          className="h-8 w-8 shrink-0 rounded border border-slate-100 object-cover"
                        />
                        <span>
                          <span className="block text-xs font-bold text-navy group-hover:text-primary">{p.nombre}</span>
                          <span className="block text-[10px] text-slate-400">
                            {p.categoria} • Desde {formatoCOP.format(p.precio)}
                          </span>
                        </span>
                      </span>
                      <ChevronRight size={14} className="shrink-0 text-slate-300 group-hover:text-primary" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  )
}
