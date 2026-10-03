import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calculator, PaintBucket, ShoppingCart } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { calcularGalones, calcularEmpaqueOptimo, MULTIPLICADOR_CONDICION, type CondicionSuperficie } from '@/domain/tienda/calculadora'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { useCart } from '@/features/tienda/CartContext'
import { useToast } from '@/shared/lib/toast'
import type { Producto } from '@/domain/tienda/types'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const CONDICIONES: CondicionSuperficie[] = ['Sellada', 'Revoque nuevo', 'Concreto poroso']

export default function Calculadora() {
  const navigate = useNavigate()
  const { agregarProducto } = useCart()
  const { mostrarToast } = useToast()
  const [productos, setProductos] = useState<Producto[]>([])
  const [productoId, setProductoId] = useState<number | null>(null)
  const [area, setArea] = useState(85)
  const [condicion, setCondicion] = useState<CondicionSuperficie>('Sellada')
  const [manos, setManos] = useState(2)

  useEffect(() => {
    tiendaRepository.listarProductos().then((data) => {
      setProductos(data)
      setProductoId((actual) => actual ?? data[0]?.id ?? null)
    })
  }, [])

  const producto = productos.find((p) => p.id === productoId) ?? null
  const galones = producto ? calcularGalones(area, producto.rendimientoM2PorGalon, condicion, manos) : 0
  const empaque = producto && galones > 0 ? calcularEmpaqueOptimo(galones, producto.precio) : null

  const handleAgregarCarrito = () => {
    if (!producto || !empaque) return
    const cantidad = empaque.cunetes * 5 + empaque.galonesSueltos
    agregarProducto(producto, cantidad)
    mostrarToast(`${producto.nombre} (${cantidad} gal) se agregó al carrito.`)
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-primary">
          <Calculator size={24} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Calculadora Técnica de Rendimiento</h1>
        <p className="mt-2 text-body">Calcula los galones y cuñetes exactos según el producto y la superficie.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="space-y-6">
          <FormField label="Área total a pintar">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={300}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  min="0"
                  className={controlClass()}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value) || 0)}
                />
                <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
                  m²
                </span>
              </div>
            </div>
          </FormField>

          <FormField label="Selecciona la pintura Pintuco">
            <div className="grid gap-2 sm:grid-cols-2">
              {productos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProductoId(p.id)}
                  className={`flex flex-col items-start gap-0.5 rounded-xl border-2 p-3 text-left transition-colors ${
                    productoId === p.id ? 'border-primary bg-pink-50' : 'border-slate-100 hover:border-pink-200'
                  }`}
                >
                  <span className="text-sm font-bold text-navy">{p.nombre}</span>
                  <span className="text-xs text-slate-400">{p.categoria}</span>
                  <span className="text-xs font-semibold text-primary">{p.rendimientoM2PorGalon} m²/gal</span>
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Estado de la superficie / sustrato">
            <div className="flex flex-wrap gap-2">
              {CONDICIONES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCondicion(c)}
                  className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                    condicion === c ? 'bg-primary text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
                  }`}
                >
                  {c}
                  {c !== 'Sellada' && ` (+${Math.round((MULTIPLICADOR_CONDICION[c] - 1) * 100)}%)`}
                </button>
              ))}
            </div>
          </FormField>

          <FormField label="Número de manos recomendadas">
            <div className="flex gap-2">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setManos(n)}
                  className={`h-10 w-10 rounded-xl text-sm font-bold transition-colors ${
                    manos === n ? 'bg-primary text-white' : 'bg-slate-100 text-body hover:bg-slate-200'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </FormField>
        </div>

        {producto && galones > 0 && empaque && (
          <div className="mt-8 rounded-2xl bg-fuchsia-50 p-5">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <PaintBucket size={22} />
              </span>
              <div>
                <p className="text-sm text-body">
                  Para cubrir {area} m² con {producto.nombre} a {manos} {manos === 1 ? 'mano' : 'manos'}
                </p>
                <p className="text-2xl font-extrabold text-navy">{galones} galones requeridos</p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 border-t border-pink-100 pt-4 text-sm">
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-400">
                Combinación óptima de empaque
              </p>
              {empaque.cunetes > 0 && (
                <div className="flex justify-between">
                  <span className="text-body">{empaque.cunetes} × Cuñete (5 galones)</span>
                  <span className="font-semibold text-navy">{formatoCOP.format(empaque.precioCunete)}</span>
                </div>
              )}
              {empaque.galonesSueltos > 0 && (
                <div className="flex justify-between">
                  <span className="text-body">{empaque.galonesSueltos} × Galón</span>
                  <span className="font-semibold text-navy">{formatoCOP.format(producto.precio)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-pink-100 pt-2 text-base font-extrabold text-primary">
                <span>Inversión estimada</span>
                <span>{formatoCOP.format(empaque.costoTotal)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button icon={<ShoppingCart size={16} />} onClick={handleAgregarCarrito}>
                Agregar materiales al carrito
              </Button>
              <Button variant="secondary" onClick={() => navigate('/solicitar')}>
                Crear proyecto B2B con estos m²
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
