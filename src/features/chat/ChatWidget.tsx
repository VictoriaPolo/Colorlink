import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Send, X, Droplets } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { generarRespuestaChat, PREGUNTAS_SUGERIDAS } from '@/domain/chat/asistenteVirtual'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import type { Pedido } from '@/domain/tienda/types'

interface Mensaje {
  id: number
  autor: 'bot' | 'usuario'
  texto: string
  ruta?: string
  etiquetaRuta?: string
}

export default function ChatWidget() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [input, setInput] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const idRef = useRef(0)

  useEffect(() => {
    if (!usuario || usuario.rol !== 'cliente') return
    tiendaRepository.listarPedidosPorEmail(usuario.email).then(setPedidos)
    setMensajes([{ id: idRef.current++, autor: 'bot', ...generarRespuestaChat('hola', [], usuario.nombre) }])
  }, [usuario?.email])

  if (usuario?.rol !== 'cliente') return null

  const enviarTexto = (texto: string) => {
    if (!texto.trim()) return
    setMensajes((prev) => [...prev, { id: idRef.current++, autor: 'usuario', texto }])
    setInput('')
    setEscribiendo(true)

    setTimeout(() => {
      const respuesta = generarRespuestaChat(texto, pedidos, usuario!.nombre)
      setMensajes((prev) => [...prev, { id: idRef.current++, autor: 'bot', ...respuesta }])
      setEscribiendo(false)
    }, 500)
  }

  const handleEnviar = (e: FormEvent) => {
    e.preventDefault()
    enviarTexto(input.trim())
  }

  const irA = (ruta: string) => {
    navigate(ruta)
    setAbierto(false)
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-teal text-white shadow-soft-lg transition-transform hover:scale-105"
        aria-label="Abrir a Coli, el asistente"
        title="Coli · Asistente COLORLINK"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft-lg">
      <div className="flex items-center justify-between gap-2 bg-gradient-to-r from-primary to-teal px-4 py-3 text-white">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Droplets size={16} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">Coli · Asistente COLORLINK</span>
            <span className="text-[11px] text-white/80">Con IA · consulta tu catálogo</span>
          </span>
        </span>
        <button onClick={() => setAbierto(false)} aria-label="Cerrar asistente" className="rounded p-0.5 hover:bg-white/20">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {mensajes.map((m) => (
          <div key={m.id} className={`flex ${m.autor === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                m.autor === 'usuario' ? 'bg-primary text-white' : 'bg-slate-100 text-navy'
              }`}
            >
              <p>{m.texto}</p>
              {m.ruta && m.etiquetaRuta && (
                <button
                  onClick={() => irA(m.ruta!)}
                  className="mt-2 block w-full rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-pink-50"
                >
                  {m.etiquetaRuta} →
                </button>
              )}
            </div>
          </div>
        ))}

        {mensajes.length === 1 && !escribiendo && (
          <div className="flex flex-wrap gap-2 pt-1">
            {PREGUNTAS_SUGERIDAS.map((pregunta) => (
              <button
                key={pregunta}
                onClick={() => enviarTexto(pregunta)}
                className="rounded-full border border-pink-200 bg-pink-50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-pink-100"
              >
                {pregunta}
              </button>
            ))}
          </div>
        )}

        {escribiendo && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm text-slate-400">Escribiendo…</div>
          </div>
        )}
      </div>

      <form onSubmit={handleEnviar} className="flex items-center gap-2 border-t border-slate-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escríbele a Coli..."
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-pink-100"
        />
        <button
          type="submit"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark"
          aria-label="Enviar mensaje"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
