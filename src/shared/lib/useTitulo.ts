import { useEffect } from 'react'

/** Le pone nombre a la pestaña mientras la página está abierta ("Pedido PED-1007 · COLORLINK") y la devuelve al salir. */
export function useTitulo(titulo: string) {
  useEffect(() => {
    const anterior = document.title
    document.title = `${titulo} · COLORLINK`
    return () => {
      document.title = anterior
    }
  }, [titulo])
}
