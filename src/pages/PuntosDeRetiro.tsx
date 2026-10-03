import { MapPin, Clock } from 'lucide-react'
import Card from '@/shared/ui/Card'
import { puntosDeRetiro } from '@/data/puntosDeRetiro'

export default function PuntosDeRetiro() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-pink-50 text-primary">
          <MapPin size={24} />
        </span>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Puntos de Retiro</h1>
        <p className="mt-2 text-body">Retira tu compra en cualquiera de nuestros centros de pinturas.</p>
      </div>

      <div className="flex flex-col gap-4">
        {puntosDeRetiro.map((punto) => (
          <Card key={punto.nombre} className="flex flex-col gap-2 p-5">
            <h3 className="text-base font-bold text-navy">{punto.nombre}</h3>
            <p className="text-sm text-body">
              {punto.direccion} · {punto.ciudad}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock size={13} /> {punto.horario}
            </p>
          </Card>
        ))}
      </div>
    </div>
  )
}
