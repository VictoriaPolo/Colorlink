import { useState, type FormEvent } from 'react'
import { Lock, Trash2, UserPlus } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import Avatar from '@/shared/ui/Avatar'
import { controlClass } from '@/shared/ui/FormField'
import { useToast } from '@/shared/lib/toast'
import { esMiembroFijo, useEquipo } from '@/data/repositories/equipoRepository'

export default function AdminEquipo() {
  const { equipo, agregar, quitar } = useEquipo()
  const { mostrarToast } = useToast()
  const [nombre, setNombre] = useState('')
  const [cargo, setCargo] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!nombre.trim()) return
    if (equipo.some((m) => m.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
      mostrarToast('Ya hay alguien del equipo con ese nombre.', 'error')
      return
    }
    agregar(nombre, cargo)
    mostrarToast(`${nombre.trim()} se agregó al equipo.`)
    setNombre('')
    setCargo('')
  }

  const eliminar = (nombreMiembro: string) => {
    quitar(nombreMiembro)
    mostrarToast(`${nombreMiembro} se quitó del equipo.`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Equipo</h1>
        <p className="mt-1 text-sm text-body">
          Quién puede atender solicitudes — este roster llena el selector "Atiende" y los filtros por responsable.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-navy">Personas del equipo</h2>
          <ul className="flex flex-col divide-y divide-slate-100">
            {equipo.map((m) => (
              <li key={m.nombre} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar nombre={m.nombre} className="h-9 w-9 text-sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-navy">{m.nombre}</p>
                    <p className="truncate text-xs text-slate-400">{m.cargo}</p>
                  </div>
                </div>
                {esMiembroFijo(m.nombre) ? (
                  <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-400" title="Persona de ejemplo del prototipo, no se puede quitar">
                    <Lock size={12} /> Fija
                  </span>
                ) : (
                  <button
                    onClick={() => eliminar(m.nombre)}
                    className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Quitar a ${m.nombre} del equipo`}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
            <UserPlus size={17} /> Agregar persona
          </h2>
          <form onSubmit={enviar} className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Nombre</span>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Mariana Pérez" className={controlClass(false)} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Cargo</span>
              <input value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ej. Asesora técnica" className={controlClass(false)} />
            </label>
            <Button type="submit" size="sm" disabled={!nombre.trim()}>
              Agregar al equipo
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
