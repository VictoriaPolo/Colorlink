import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Mail, Lock, Sparkles } from 'lucide-react'
import Card from '@/shared/ui/Card'
import Button from '@/shared/ui/Button'
import FormField, { controlClass } from '@/shared/ui/FormField'
import { useAuth } from './AuthContext'
import { cuentasDemo } from './mockUsuarios'

export default function LoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const destino = (location.state as { from?: string })?.from ?? '/'

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const resultado = login(email, password)
    if (!resultado.ok) {
      setError(resultado.error)
      return
    }
    navigate(destino, { replace: true })
  }

  const usarDemo = () => {
    setEmail(cuentasDemo[0].email)
    setPassword(cuentasDemo[0].password)
    setError('')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-6 text-center">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles size={13} /> Acceso de cliente
        </span>
        <h1 className="text-2xl font-extrabold text-navy">Bienvenido de nuevo</h1>
        <p className="mt-1 text-sm text-body">Inicia sesión para gestionar tus solicitudes.</p>
      </div>

      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <FormField label="Correo electrónico" required icon={<Mail size={15} />} error={error ? ' ' : undefined}>
            <input
              type="email"
              className={controlClass(!!error)}
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </FormField>

          <FormField label="Contraseña" required icon={<Lock size={15} />} error={error}>
            <input
              type="password"
              className={controlClass(!!error)}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </FormField>

          <Button type="submit" size="lg" fullWidth icon={<LogIn size={17} />}>
            Iniciar sesión
          </Button>
        </form>

        <div className="mt-5 border-t border-slate-100 pt-5 text-center">
          <p className="text-xs text-slate-400">
            Prototipo académico sin backend real — usa una cuenta de demostración:
          </p>
          <button
            type="button"
            onClick={usarDemo}
            className="mt-2 text-sm font-semibold text-primary hover:underline"
          >
            Usar cuenta de demostración
          </button>
        </div>
      </Card>
    </div>
  )
}
