import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, ShoppingBag } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import ProductoCard from '@/features/tienda/ProductoCard'
import type { CategoriaProducto, Producto } from '@/domain/tienda/types'
import { coincideConBusqueda } from '@/domain/tienda/busqueda'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'

const CATEGORIAS: CategoriaProducto[] = ['Impermeabilizantes', 'Fachadas y exteriores', 'Esmaltes y metales', 'Interiores']

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargando, setCargando] = useState(true)
  const [categoria, setCategoria] = useState<CategoriaProducto | 'Todas'>('Todas')
  // La búsqueda vive en la URL (?q=) para que el buscador del encabezado
  // también funcione estando ya en el catálogo.
  const busqueda = searchParams.get('q') ?? ''

  useEffect(() => {
    tiendaRepository.listarProductos().then((data) => {
      setProductos(data)
      setCargando(false)
    })
  }, [])

  const filtrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCategoria = categoria === 'Todas' || p.categoria === categoria
      return coincideCategoria && coincideConBusqueda(p, busqueda)
    })
  }, [productos, categoria, busqueda])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
          <ShoppingBag size={13} /> Catálogo Oficial
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Pinturas Pintuco distribuidas por COLORLINK</h1>
        <p className="mt-1 text-sm text-body">Calidad profesional con entrega express o retiro inmediato en tienda.</p>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute top-1/2 left-3.5 -translate-y-1/2 text-slate-400" size={16} />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-4 pl-10 text-sm text-navy outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-pink-100"
            placeholder="Buscar por nombre o uso, ej. Koraza, fachadas, metal..."
            value={busqueda}
            onChange={(e) => setSearchParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {(['Todas', ...CATEGORIAS] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                categoria === c ? 'bg-primary text-white' : 'bg-white text-body hover:bg-pink-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <SkeletonCardList count={4} />
      ) : filtrados.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 p-14 text-center">
          <p className="text-sm text-slate-400">No encontramos productos con esos filtros.</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtrados.map((producto) => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  )
}
