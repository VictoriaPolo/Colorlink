import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Loader2, X } from 'lucide-react'
import { IconoFacebook, IconoGoogle } from '@/shared/brand/IconosProveedor'
import Button from '@/shared/ui/Button'
import type { ProveedorSocial, ResultadoAuth } from '@/data/repositories/authRepository.types'
import { useAuth } from './AuthContext'
import { erroresPorCampo, identidadDemoSchema } from './schemas'

const PROVEEDORES: { id: ProveedorSocial; nombre: string; Icono: typeof IconoGoogle }[] = [
  { id: 'google', nombre: 'Google', Icono: IconoGoogle },
  { id: 'facebook', nombre: 'Facebook', Icono: IconoFacebook },
]

interface Props {
  /** El acceso terminó (con sesión, con error, o yéndose a Google/Facebook). */
  onResultado: (resultado: ResultadoAuth) => void
  deshabilitado?: boolean
}

/** Botones "Continuar con Google/Facebook". Con Supabase Auth configurado abren
 * la ventana real del proveedor; sin él, piden un nombre y correo de prueba. */
export default function BotonesSociales({ onResultado, deshabilitado }: Props) {
  const { loginConProveedor, proveedoresReales } = useAuth()
  const [enCurso, setEnCurso] = useState<ProveedorSocial | null>(null)
  const [demo, setDemo] = useState<ProveedorSocial | null>(null)

  const elegir = async (proveedor: ProveedorSocial) => {
    if (!proveedoresReales) return setDemo(proveedor)
    setEnCurso(proveedor)
    const resultado = await loginConProveedor(proveedor)
    // Si salió bien, el navegador ya se está yendo a Google/Facebook: se deja el aviso de carga.
    if (!resultado.ok) setEnCurso(null)
    onResultado(resultado)
  }

  return (
    <>
      <div className="grid gap-3">
        {PROVEEDORES.map(({ id, nombre, Icono }) => (
          <button
            key={id}
            type="button"
            onClick={() => elegir(id)}
            disabled={deshabilitado || enCurso !== null}
            className="flex items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-primary hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enCurso === id ? <Loader2 size={18} className="animate-spin text-primary" /> : <Icono />}
            Continuar con {nombre}
          </button>
        ))}
      </div>

      {demo && (
        <DialogoDemo
          proveedor={PROVEEDORES.find((p) => p.id === demo)!}
          onCerrar={() => setDemo(null)}
          onConfirmar={async (identidad) => {
            const resultado = await loginConProveedor(demo, identidad)
            if (resultado.ok) setDemo(null)
            onResultado(resultado)
            return resultado.ok ? null : resultado.error
          }}
        />
      )}
    </>
  )
}

/** Modo demostración: este prototipo no tiene Supabase Auth, así que en lugar de
 * abrir la ventana de Google/Facebook se escribe con qué identidad entrar. */
function DialogoDemo({
  proveedor,
  onCerrar,
  onConfirmar,
}: {
  proveedor: (typeof PROVEEDORES)[number]
  onCerrar: () => void
  onConfirmar: (identidad: { nombre: string; email: string }) => Promise<string | null>
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    if (ref.current && !ref.current.open) ref.current.showModal()
  }, [])

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    const validado = identidadDemoSchema.safeParse({ nombre, email })
    if (!validado.success) return setErrores(erroresPorCampo(validado.error.issues))
    setErrores({})
    setEnviando(true)
    const error = await onConfirmar(validado.data)
    setEnviando(false)
    if (error) setErrores({ email: error })
  }

  const campo = 'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy outline-none focus:border-primary focus:ring-4 focus:ring-brand-100'

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === ref.current && onCerrar()}
      aria-label={`Continuar con ${proveedor.nombre}`}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-white p-0 text-body shadow-soft-lg backdrop:bg-navy/60"
    >
      <form onSubmit={enviar} noValidate>
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <proveedor.Icono className="h-7 w-7" />
            <div>
              <h2 className="text-base font-extrabold text-navy">Continuar con {proveedor.nombre}</h2>
              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide text-navy uppercase">
                Modo demostración
              </span>
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-navy" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5">
          <p className="text-sm leading-relaxed">
            Este prototipo no está conectado a Supabase Auth, así que no abre la ventana real de {proveedor.nombre}.
            Escribe con qué datos quieres entrar y crearemos tu cuenta asociada a {proveedor.nombre}.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-navy">Nombre</span>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={`${campo} ${errores.nombre ? 'border-red-300' : 'border-slate-300'}`} autoComplete="name" />
            {errores.nombre && <span className="text-xs font-medium text-red-600">{errores.nombre}</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-navy">Correo de {proveedor.nombre}</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${campo} ${errores.email ? 'border-red-300' : 'border-slate-300'}`} autoComplete="email" />
            {errores.email && <span className="text-xs font-medium text-red-600">{errores.email}</span>}
          </label>
          <Button type="submit" size="lg" fullWidth disabled={enviando}>
            {enviando ? <Loader2 size={17} className="animate-spin" /> : `Continuar con ${proveedor.nombre}`}
          </Button>
        </div>
      </form>
    </dialog>
  )
}
