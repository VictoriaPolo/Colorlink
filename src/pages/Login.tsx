import AuthPage from '@/features/auth/AuthPage'

export default function Login({ modo = 'login' }: { modo?: 'login' | 'registro' }) {
  return <AuthPage modo={modo} />
}
