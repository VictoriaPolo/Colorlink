import { MapPin, Clock, CheckCircle2 } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import { useCart } from '@/features/tienda/CartContext'
import { useToast } from '@/shared/lib/toast'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'

export default function PuntosDeRetiro() {
  const { puntoRetiro, elegirPuntoRetiro } = useCart()
  const { mostrarToast } = useToast()

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-primary">
          <MapPin size={24} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Puntos de Retiro</h1>
        <p className="mt-2 text-body">Elige dónde retirar tus pedidos: quedan listos en 2 horas con el color ya mezclado.</p>
      </div>

      <div className="flex flex-col gap-4">
        {puntosDeRetiro.map((punto) => {
          const elegido = punto.nombre === puntoRetiro.nombre
          return (
            <Card
              key={punto.nombre}
              className={`flex flex-wrap items-center justify-between gap-4 p-5 ${elegido ? 'outline-2 outline-primary' : ''}`}
            >
              <div className="flex flex-col gap-2">
                <h3 className="text-base font-bold text-navy">{punto.nombre}</h3>
                <p className="text-sm text-body">
                  {punto.direccion} · {punto.ciudad}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={13} /> {punto.horario}
                </p>
              </div>
              {elegido ? (
                <span className="flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1.5 text-xs font-bold text-primary">
                  <CheckCircle2 size={15} /> Tu tienda de retiro
                </span>
              ) : (
                <Button
                  variant="secondary"
                  onClick={() => {
                    elegirPuntoRetiro(punto)
                    mostrarToast(`Retirarás tus pedidos en ${punto.nombre}.`)
                  }}
                >
                  Elegir esta tienda
                </Button>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
