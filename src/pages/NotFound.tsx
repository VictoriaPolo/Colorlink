import { useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Button from '@/shared/ui/Button'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-50 text-primary">
        <Compass size={30} />
      </span>
      <h1 className="text-3xl font-extrabold text-navy">404</h1>
      <p className="mt-2 text-body">No encontramos la página que buscas.</p>
      <Button className="mt-6" onClick={() => navigate('/')}>
        Volver al inicio
      </Button>
    </div>
  )
}
