import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Camera, Eye, EyeOff, Loader2, Lock, Mail, MailCheck, Palette, Store, User } from 'lucide-react'
import Button from '@/shared/ui/Button'
import Logo from '@/shared/brand/Logo'
import FranjaColores from '@/shared/brand/FranjaColores'
import AbanicoColores from '@/shared/brand/AbanicoColores'
import { paletaColores } from '@/data/paletaColores'
import type { ResultadoAuth } from '@/data/repositories/authRepository.types'
import { useAuth } from './AuthContext'
import BotonesSociales from './BotonesSociales'
import { cuentasDemo } from './mockUsuarios'
import { erroresPorCampo, fuerzaPassword, loginSchema, registroSchema } from './schemas'
import type { RolUsuario } from './types'

const HOME_POR_ROL: Record<RolUsuario, string> = { admin: '/admin', cliente: '/' }

const COLORES_ABANICO = ['PNT-304', 'PNT-303', 'PNT-302', 'PNT-401', 'PNT-506', 'PNT-504', 'PNT-208'].map(
  (codigo) => paletaColores.find((c) => c.codigo === codigo)!,
)

const BENEFICIOS = [
  { icono: Camera, titulo: 'Diagnóstico con una foto', texto: 'Sube una imagen de la pared, el techo o el piso y recibe una recomendación técnica.' },
  { icono: Palette, titulo: 'Simulador de color en vivo', texto: 'Prueba la carta de colores sobre fachadas y ambientes reales.' },
  { icono: Store, titulo: 'Retiro en tienda en 2 horas', texto: 'Compra con descuento por cuñete y retira con el color ya mezclado.' },
]

const NIVELES_FUERZA = [
  { texto: '', color: 'bg-slate-200' },
  { texto: 'Débil', color: 'bg-red-500' },
  { texto: 'Aceptable', color: 'bg-amber-500' },
  { texto: 'Buena', color: 'bg-lime-500' },
  { texto: 'Fuerte', color: 'bg-green-600' },
]

export default function AuthPage({ modo }: { modo: 'login' | 'registro' }) {
  const { usuario, cargando, login, registrar } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { from?: string } | null)?.from
  const esRegistro = modo === 'registro'

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [acepta, setAcepta] = useState(false)
  const [verPassword, setVerPassword] = useState(false)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [correoPendiente, setCorreoPendiente] = useState('')

  if (!cargando && usuario) return <Navigate to={destino ?? HOME_POR_ROL[usuario.rol]} replace />

  /** Después de un intento de acceso: entrar, mostrar el error o el aviso de confirmación. */
  const resolver = (resultado: ResultadoAuth) => {
    if (!resultado.ok) return setErrorGeneral(resultado.error)
    if ('usuario' in resultado) navigate(destino ?? HOME_POR_ROL[resultado.usuario.rol], { replace: true })
    else if (resultado.pendiente === 'confirmar-correo') setCorreoPendiente(email.trim())
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    setErrorGeneral('')
    const validado = esRegistro
      ? registroSchema.safeParse({ nombre, email, password, confirmar, acepta })
      : loginSchema.safeParse({ email, password })
    if (!validado.success) return setErrores(erroresPorCampo(validado.error.issues))
    setErrores({})
    setEnviando(true)
    resolver(esRegistro ? await registrar({ nombre, email, password }) : await login(email, password))
    setEnviando(false)
  }

  const entrarDemo = async (rol: RolUsuario) => {
    const cuenta = cuentasDemo.find((c) => c.rol === rol)!
    setErrorGeneral('')
    setEnviando(true)
    resolver(await login(cuenta.email, cuenta.password))
    setEnviando(false)
  }

  const fuerza = fuerzaPassword(password)

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca */}
      <aside className="relative hidden overflow-hidden bg-navy text-white lg:flex lg:flex-col">
        <FranjaColores className="h-1.5" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative flex flex-1 flex-col justify-between gap-10 p-12 xl:p-16">
          <Logo claro />
          <div className="max-w-lg">
            <span className="inline-flex rounded bg-accent px-2.5 py-1 text-[11px] font-extrabold tracking-wider text-navy uppercase">
              Ecosistema digital Pintuco
            </span>
            <h1 className="mt-5 text-4xl leading-[1.1] font-black tracking-tight xl:text-5xl">
              Del diagnóstico a la obra terminada, con la calidad Pintuco.
            </h1>
            <ul className="mt-8 flex flex-col gap-5">
              {BENEFICIOS.map(({ icono: Icono, titulo, texto }) => (
                <li key={titulo} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-accent">
                    <Icono size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{titulo}</span>
                    <span className="block text-sm leading-relaxed text-white/70">{texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="-mb-6 flex justify-end">
            <AbanicoColores colores={COLORES_ABANICO} className="origin-bottom-right scale-90" />
          </div>
        </div>
      </aside>

      {/* Formulario */}
      <main className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          {correoPendiente ? (
            <div className="text-center" role="status">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-primary">
                <MailCheck size={28} />
              </span>
              <h2 className="text-2xl font-extrabold text-navy">Revisa tu correo</h2>
              <p className="mt-2 text-sm leading-relaxed">
                Te enviamos un enlace de confirmación a <strong className="text-navy">{correoPendiente}</strong>. Ábrelo
                para activar tu cuenta y luego inicia sesión.
              </p>
              <Link to="/login" className="mt-6 inline-block text-sm font-semibold text-primary hover:underline">
                Ir a iniciar sesión
              </Link>
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Acceso" className="mb-7 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
                {(['login', 'registro'] as const).map((m) => (
                  <Link
                    key={m}
                    to={m === 'login' ? '/login' : '/registro'}
                    state={location.state}
                    role="tab"
                    aria-selected={modo === m}
                    className={`rounded-md py-2.5 text-center text-sm font-bold transition-colors ${
                      modo === m ? 'bg-white text-primary shadow-soft' : 'text-slate-500 hover:text-navy'
                    }`}
                  >
                    {m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                  </Link>
                ))}
              </div>

              <h2 className="text-2xl font-extrabold text-navy">
                {esRegistro ? 'Crea tu cuenta de cliente' : 'Bienvenido de nuevo'}
              </h2>
              <p className="mt-1 mb-6 text-sm">
                {esRegistro
                  ? 'Guarda tus solicitudes, pedidos y diagnósticos en un solo lugar.'
                  : 'Entra para ver tus solicitudes, pedidos y diagnósticos.'}
              </p>

              <BotonesSociales onResultado={resolver} deshabilitado={enviando} />

              <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                <span className="h-px flex-1 bg-slate-200" /> o con tu correo <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
                {esRegistro && (
                  <Campo etiqueta="Nombre completo" icono={<User size={15} />} error={errores.nombre}>
                    <input
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      autoComplete="name"
                      placeholder="Ana Gómez"
                      aria-invalid={!!errores.nombre}
                      className={clase(!!errores.nombre)}
                    />
                  </Campo>
                )}

                <Campo etiqueta="Correo electrónico" icono={<Mail size={15} />} error={errores.email}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete={esRegistro ? 'email' : 'username'}
                    placeholder="tucorreo@ejemplo.com"
                    aria-invalid={!!errores.email}
                    className={clase(!!errores.email)}
                  />
                </Campo>

                <Campo etiqueta="Contraseña" icono={<Lock size={15} />} error={errores.password}>
                  <div className="relative">
                    <input
                      type={verPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={esRegistro ? 'new-password' : 'current-password'}
                      placeholder={esRegistro ? 'Mínimo 8 caracteres, con letras y números' : '••••••••'}
                      aria-invalid={!!errores.password}
                      className={`${clase(!!errores.password)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setVerPassword((v) => !v)}
                      aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1.5 text-slate-500 hover:text-navy"
                    >
                      {verPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  {esRegistro && password && (
                    <div className="mt-1 flex items-center gap-2" aria-live="polite">
                      <div className="flex flex-1 gap-1">
                        {[1, 2, 3, 4].map((n) => (
                          <span key={n} className={`h-1.5 flex-1 rounded-full ${fuerza >= n ? NIVELES_FUERZA[fuerza].color : 'bg-slate-200'}`} />
                        ))}
                      </div>
                      <span className="w-16 text-right text-xs font-semibold text-slate-500">{NIVELES_FUERZA[fuerza].texto}</span>
                    </div>
                  )}
                </Campo>

                {esRegistro && (
                  <Campo etiqueta="Confirmar contraseña" icono={<Lock size={15} />} error={errores.confirmar}>
                    <input
                      type={verPassword ? 'text' : 'password'}
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      autoComplete="new-password"
                      aria-invalid={!!errores.confirmar}
                      className={clase(!!errores.confirmar)}
                    />
                  </Campo>
                )}

                {esRegistro && (
                  <div>
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={acepta}
                        onChange={(e) => setAcepta(e.target.checked)}
                        className="mt-0.5 h-4 w-4 accent-brand-700"
                      />
                      <span>Acepto los términos de uso y el tratamiento de mis datos personales.</span>
                    </label>
                    {errores.acepta && <p className="mt-1 text-xs font-medium text-red-600">{errores.acepta}</p>}
                  </div>
                )}

                {errorGeneral && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                    {errorGeneral}
                  </p>
                )}

                <Button type="submit" size="lg" fullWidth disabled={enviando}>
                  {enviando ? <Loader2 size={18} className="animate-spin" /> : esRegistro ? 'Crear mi cuenta' : 'Iniciar sesión'}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm">
                {esRegistro ? '¿Ya tienes cuenta? ' : '¿Aún no tienes cuenta? '}
                <Link to={esRegistro ? '/login' : '/registro'} state={location.state} className="font-bold text-primary hover:underline">
                  {esRegistro ? 'Inicia sesión' : 'Crear cuenta'}
                </Link>
              </p>

              {!esRegistro && (
                <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Prototipo académico · probar sin crear cuenta</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button type="button" variant="secondary" size="sm" disabled={enviando} onClick={() => entrarDemo('cliente')}>
                      Entrar como cliente
                    </Button>
                    <Button type="button" variant="secondary" size="sm" disabled={enviando} onClick={() => entrarDemo('admin')}>
                      Entrar como equipo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

const clase = (conError: boolean) =>
  `w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-navy placeholder:text-slate-400 outline-none transition-colors focus:border-primary focus:ring-4 focus:ring-brand-100 ${
    conError ? 'border-red-300' : 'border-slate-300'
  }`

function Campo({ etiqueta, icono, error, children }: { etiqueta: string; icono: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
        {icono}
        {etiqueta}
      </span>
      {children}
      {error && <span className="text-xs font-medium text-red-600">{error}</span>}
    </label>
  )
}
