import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Send, X, Droplets, Mic, MicOff, Square, Volume2, VolumeX, Phone } from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'
import { useSolicitudes } from '@/features/solicitudes/context/SolicitudesContext'
import {
  generarRespuestaChat,
  PREGUNTAS_SUGERIDAS,
  type ContextoChat,
  type RespuestaChat,
} from '@/domain/chat/asistenteVirtual'
import { tiendaRepository } from '@/data/repositories/tiendaRepository'
import { tiendaRepositoryLocal } from '@/data/repositories/tiendaRepository.local'
import type { Pedido, Producto } from '@/domain/tienda/types'
import { useDictado, hablar, callar } from './voz'
import type { TurnoLlamada } from './llamada'
import LlamadaColi from './LlamadaColi'

interface Mensaje extends RespuestaChat {
  id: number
  autor: 'bot' | 'usuario'
}

export default function ChatWidget() {
  const { usuario } = useAuth()
  const { solicitudes } = useSolicitudes()
  const navigate = useNavigate()
  const [abierto, setAbierto] = useState(false)
  const [input, setInput] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  // Leer las respuestas en voz alta: se enciende sola al usar el micrófono.
  const [vozActiva, setVozActiva] = useState(false)
  const [enLlamada, setEnLlamada] = useState(false)
  const idRef = useRef(0)
  const finRef = useRef<HTMLDivElement>(null)

  /** Lo que Coli sabe del cliente para responder con datos reales. */
  const contexto: ContextoChat = { nombreUsuario: usuario?.nombre, pedidos, solicitudes, productos }

  const enviarTexto = (texto: string) => {
    if (!texto.trim()) return
    setMensajes((prev) => [...prev, { id: idRef.current++, autor: 'usuario', texto }])
    setInput('')
    setEscribiendo(true)

    setTimeout(() => {
      const respuesta = generarRespuestaChat(texto, contexto)
      setMensajes((prev) => [...prev, { id: idRef.current++, autor: 'bot', ...respuesta }])
      setEscribiendo(false)
      if (vozActiva) hablar(respuesta.texto)
    }, 500)
  }

  const dictado = useDictado(enviarTexto)

  useEffect(() => {
    if (!usuario || usuario.rol !== 'cliente') return
    tiendaRepository.listarPedidosPorEmail(usuario.email).then(setPedidos).catch(() => {})
    // Si la base de datos no responde, Coli usa la copia local del catálogo
    // (los mismos productos del seed) para no quedarse sin saber de productos.
    tiendaRepository
      .listarProductos()
      .catch(() => tiendaRepositoryLocal.listarProductos())
      .then(setProductos)
    setMensajes([{ id: idRef.current++, autor: 'bot', ...generarRespuestaChat('hola', { nombreUsuario: usuario.nombre }) }])
  }, [usuario?.email])

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [mensajes, escribiendo])

  if (usuario?.rol !== 'cliente') return null

  const handleEnviar = (e: FormEvent) => {
    e.preventDefault()
    enviarTexto(input.trim())
  }

  const handleMicrofono = () => {
    if (dictado.escuchando) return dictado.detener()
    if (!dictado.motivo) setVozActiva(true)
    dictado.escuchar() // si la voz no está disponible aquí, solo muestra el porqué
  }

  const alternarVoz = () => {
    if (vozActiva) callar()
    setVozActiva(!vozActiva)
  }

  const cerrar = () => {
    callar()
    dictado.detener()
    setAbierto(false)
  }

  const llamar = () => {
    callar()
    dictado.detener()
    setEnLlamada(true)
  }

  /** Lo hablado en la llamada queda en el chat (con los enlaces de cada respuesta). */
  const terminarLlamada = (turnos: TurnoLlamada[]) => {
    setEnLlamada(false)
    const conversacion = turnos.slice(1) // sin el saludo inicial
    if (!conversacion.some((t) => t.autor === 'usuario')) return
    setMensajes((prev) => [
      ...prev,
      { id: idRef.current++, autor: 'bot', texto: 'Así quedó nuestra llamada:' },
      ...conversacion.map((t): Mensaje =>
        t.autor === 'usuario'
          ? { id: idRef.current++, autor: 'usuario', texto: t.texto }
          : { id: idRef.current++, autor: 'bot', ...(t.respuesta ?? { texto: t.texto }) },
      ),
    ])
  }

  const irA = (ruta: string) => {
    navigate(ruta)
    cerrar()
  }

  const ultimo = mensajes[mensajes.length - 1]
  const mostrarSugerencias = !escribiendo && ultimo?.autor === 'bot' && (mensajes.length === 1 || ultimo.fueraDeAlcance)

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary ring-4 ring-accent/40 text-white shadow-soft-lg transition-transform hover:scale-105"
        aria-label="Abrir a Coli, el asistente"
        title="Coli · Asistente COLORLINK"
      >
        <MessageCircle size={24} />
      </button>
    )
  }

  return (
    <div className="fixed right-5 bottom-5 z-50 flex h-[30rem] w-[22rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft-lg">
      <div className="flex items-center justify-between gap-2 bg-navy px-4 py-3 text-white">
        <span className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
            <Droplets size={16} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-bold">Coli · Asistente COLORLINK</span>
            <span className="text-[11px] text-white/80">Solo temas de la tienda</span>
          </span>
        </span>
        <span className="flex items-center gap-1">
          <button
            onClick={llamar}
            aria-label="Llamar a Coli"
            title="Hablar con Coli por voz"
            className="rounded p-1 hover:bg-white/20"
          >
            <Phone size={17} />
          </button>
          <button
            onClick={alternarVoz}
            aria-label={vozActiva ? 'Dejar de leer las respuestas en voz alta' : 'Leer las respuestas en voz alta'}
            title={vozActiva ? 'Respuestas en voz alta: activadas' : 'Respuestas en voz alta: desactivadas'}
            className="rounded p-1 hover:bg-white/20"
          >
            {vozActiva ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>
          <button onClick={cerrar} aria-label="Cerrar asistente" className="rounded p-1 hover:bg-white/20">
            <X size={18} />
          </button>
        </span>
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
                  className="mt-2 block w-full rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-brand-50"
                >
                  {m.etiquetaRuta} →
                </button>
              )}
            </div>
          </div>
        ))}

        {mostrarSugerencias && (
          <div className="flex flex-wrap gap-2 pt-1">
            {PREGUNTAS_SUGERIDAS.map((pregunta) => (
              <button
                key={pregunta}
                onClick={() => enviarTexto(pregunta)}
                className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-brand-100"
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
        <div ref={finRef} />
      </div>

      <form onSubmit={handleEnviar} className="border-t border-slate-100 p-3">
        <div className="flex items-center gap-2">
          <input
            value={dictado.escuchando ? dictado.parcial : input}
            onChange={(e) => setInput(e.target.value)}
            readOnly={dictado.escuchando}
            placeholder={dictado.escuchando ? 'Te escucho…' : 'Escríbele o háblale a Coli...'}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-brand-100"
          />
          <button
            type="button"
            onClick={handleMicrofono}
            aria-label={dictado.escuchando ? 'Dejar de escuchar' : dictado.motivo ? 'Voz no disponible' : 'Hablar con Coli'}
            title={dictado.motivo ?? (dictado.escuchando ? 'Dejar de escuchar' : 'Hablar con Coli')}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
              dictado.escuchando
                ? 'animate-pulse bg-red-500 text-white'
                : dictado.motivo
                  ? 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  : 'bg-brand-50 text-primary hover:bg-brand-100'
            }`}
          >
            {dictado.escuchando ? <Square size={14} /> : dictado.motivo ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          <button
            type="submit"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary-dark"
            aria-label="Enviar mensaje"
          >
            <Send size={16} />
          </button>
        </div>
        {dictado.error && <p className="mt-1.5 text-xs text-red-500">{dictado.error}</p>}
      </form>

      {enLlamada && <LlamadaColi contexto={contexto} onCerrar={terminarLlamada} />}
    </div>
  )
}
