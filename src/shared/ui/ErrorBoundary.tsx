import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import Button from './Button'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary capturó un error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <AlertTriangle size={30} />
          </span>
          <h1 className="text-xl font-bold text-navy">Algo salió mal</h1>
          <p className="mt-2 text-sm text-body">
            Ocurrió un error inesperado en la aplicación. Intenta recargar la página.
          </p>
          <Button className="mt-6" onClick={() => window.location.assign('/')}>
            Volver al inicio
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
