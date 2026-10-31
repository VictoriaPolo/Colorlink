import { useState, type FormEvent } from 'react'
import { Tag } from 'lucide-react'
import Button from '@/shared/ui/Button'
import { controlClass } from '@/shared/ui/FormField'
import { formatoCOP } from '@/shared/lib/formato'
import { CUPONES } from '@/domain/pagos/cupones'
import { useCart } from '@/features/tienda/CartContext'

/** Para escribir un cupón (o tocar uno de los de práctica) y ver cuánto descuenta. */
export default function CuponCaja() {
  const { cupon, totales, aplicarCupon, quitarCupon } = useCart()
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')

  const aplicar = (texto: string) => {
    const resultado = aplicarCupon(texto)
    if (resultado.ok) {
      setCodigo('')
      setError('')
    } else {
      setError(resultado.motivo)
    }
  }

  if (cupon) {
    return (
      <div role="status" className="flex items-start justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm">
        <div className="flex min-w-0 items-start gap-2 text-green-800">
          <Tag size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-bold">Cupón {cupon.codigo}</p>
            <p className="text-xs">Ahorras {formatoCOP.format(totales.descuento)}</p>
          </div>
        </div>
        <button type="button" onClick={quitarCupon} className="shrink-0 text-xs font-bold text-green-800 underline underline-offset-2">
          Quitar
        </button>
      </div>
    )
  }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    aplicar(codigo)
  }

  return (
    <div>
      <form onSubmit={enviar} className="flex gap-2">
        <input
          aria-label="Código de cupón"
          placeholder="¿Tienes un cupón?"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          aria-invalid={!!error}
          className={`${controlClass(!!error)} uppercase`}
        />
        <Button type="submit" variant="secondary" size="sm">
          Aplicar
        </Button>
      </form>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-slate-400">Cupones de práctica:</span>
        {CUPONES.map((c) => (
          <button
            key={c.codigo}
            type="button"
            onClick={() => aplicar(c.codigo)}
            title={c.descripcion}
            className="rounded-full border border-dashed border-primary/40 bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-primary transition-colors hover:bg-brand-100"
          >
            {c.codigo}
          </button>
        ))}
      </div>
    </div>
  )
}
