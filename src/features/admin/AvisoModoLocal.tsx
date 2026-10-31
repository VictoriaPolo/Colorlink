import { Info } from 'lucide-react'
import { supabase } from '@/data/supabaseClient'

/** Sin base de datos, cada navegador guarda lo suyo: la consola no puede ver lo que otras personas hacen en sus equipos. */
export default function AvisoModoLocal() {
  if (supabase) return null
  return (
    <div role="status" className="flex items-start gap-2.5 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 sm:px-6 sm:text-sm">
      <Info size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
      <p>
        <strong>Modo demostración:</strong> esta consola solo muestra lo que se guardó en <strong>este navegador</strong>. Las solicitudes y los pedidos que
        otras personas hacen desde sus equipos no llegan aquí hasta que se conecte la base de datos (guía en <code>docs/SUPABASE.md</code>).
      </p>
    </div>
  )
}
