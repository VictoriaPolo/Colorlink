import { useEffect, useState } from 'react'
import { Building2, Droplet, ShieldAlert, Wrench, ShoppingCart } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import { SkeletonCardList } from '@/shared/ui/Skeleton'
import type { Kit, PatologiaKit } from '@/domain/tienda/types'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { FOTO_PRODUCTO } from './ProductoCard'
import { useCart } from './CartContext'
import { useToast } from '@/shared/lib/toast'

const formatoCOP = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })

const PATOLOGIAS: { valor: PatologiaKit; label: string; icon: typeof Building2 }[] = [
  { valor: 'Fachada exterior', label: 'Fachada Exterior', icon: Building2 },
  { valor: 'Humedad y moho', label: 'Humedad & Moho', icon: Droplet },
  { valor: 'Goteras y terrazas', label: 'Goteras & Terrazas', icon: ShieldAlert },
  { valor: 'Metales oxidados', label: 'Rejas & Metales', icon: Wrench },
]

/** Mismo truco que ProductoCard: tiñe la foto genérica del kit con un tono
 * distinto por patología, para que cambiar de pestaña también se sienta
 * visualmente distinto y no siempre la misma imagen. */
const COLOR_POR_PATOLOGIA: Record<PatologiaKit, string> = {
  'Fachada exterior': '#C2703D',
  'Humedad y moho': '#94A3B8',
  'Goteras y terrazas': '#7DA6A6',
  'Metales oxidados': '#A34328',
}

export default function KitSelector() {
  const [kits, setKits] = useState<Kit[]>([])
  const [cargando, setCargando] = useState(true)
  const [patologia, setPatologia] = useState<PatologiaKit>('Fachada exterior')
  const { agregarKit } = useCart()
  const { mostrarToast } = useToast()

  useEffect(() => {
    tiendaRepository.listarKits().then((data) => {
      setKits(data)
      setCargando(false)
    })
  }, [])

  const kitActivo = kits.find((k) => k.patologia === patologia)

  const handleAgregar = () => {
    if (!kitActivo) return
    agregarKit(kitActivo)
    mostrarToast(`${kitActivo.nombre} se agregó al carrito.`)
  }

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PATOLOGIAS.map(({ valor, label, icon: Icon }) => (
          <button
            key={valor}
            onClick={() => setPatologia(valor)}
            className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-colors ${
              patologia === valor
                ? 'border-primary bg-pink-50 text-primary'
                : 'border-slate-100 bg-white text-body hover:border-pink-200'
            }`}
          >
            <Icon size={22} />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {cargando ? (
        <SkeletonCardList count={1} />
      ) : kitActivo ? (
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-r from-primary to-teal px-6 py-3 text-xs font-bold uppercase tracking-wide text-white">
            Sistema multicapa certificado
          </div>
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:gap-6">
            <div className="relative mx-auto h-32 w-32 shrink-0 overflow-hidden rounded-xl sm:mx-0">
              <img src={FOTO_PRODUCTO} alt="" className="h-full w-full object-cover" />
              <div
                className="absolute inset-0"
                style={{ backgroundColor: COLOR_POR_PATOLOGIA[patologia], mixBlendMode: 'color' }}
              />
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <h3 className="text-lg font-extrabold text-navy">{kitActivo.nombre}</h3>
              <p className="text-sm text-body">{kitActivo.descripcion}</p>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Componentes del kit
                </p>
                <ul className="flex flex-wrap gap-2">
                  {kitActivo.componentes.map((c) => (
                    <li key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-navy">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 p-6 pt-4">
            <div>
              <p className="text-xs text-slate-400">Inversión estimada del kit</p>
              <p className="text-2xl font-extrabold text-primary">
                {formatoCOP.format(Math.round(kitActivo.precioEstimado * (1 - kitActivo.descuentoPct / 100)))}
              </p>
            </div>
            <Button icon={<ShoppingCart size={16} />} onClick={handleAgregar}>
              Ver kit y comprar (-{kitActivo.descuentoPct}%)
            </Button>
          </div>
        </Card>
      ) : null}
    </div>
  )
}
