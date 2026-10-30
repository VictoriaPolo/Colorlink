import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Loader2, Mic, MicOff, PhoneOff } from 'lucide-react'
import type { ContextoChat } from '@/domain/chat/asistenteVirtual'
import { iniciarLlamada, type ControlLlamada, type EstadoLlamada, type TurnoLlamada } from './llamada'
import { MENSAJE_MICROFONO_BLOQUEADO, MOTIVO_SIN_VOZ, microfonoBloqueado } from './voz'
import AvatarColi from './AvatarColi'

const ETIQUETA: Record<EstadoLlamada, string> = {
  conectando: 'Conectando…',
  escuchando: 'Te escucho',
  pensando: 'Un momento…',
  hablando: 'Coli está hablando',
  finalizada: 'Llamada terminada',
  error: 'Se cortó la llamada',
}

const formatoReloj = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

interface Props {
  /** Datos del cliente para que Coli responda con lo real (pedidos, solicitudes, catálogo). */
  contexto: ContextoChat
  /** Recibe la conversación para dejarla en el chat. */
  onCerrar: (turnos: TurnoLlamada[]) => void
}

/** Llamada de voz con Coli (como "Llamar a Pintu" en la tienda de referencia). */
export default function LlamadaColi({ contexto, onCerrar }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const finRef = useRef<HTMLDivElement>(null)
  const controlRef = useRef<ControlLlamada | null>(null)
  const turnosRef = useRef<TurnoLlamada[]>([])
  const [estado, setEstado] = useState<EstadoLlamada>('conectando')
  const [segundos, setSegundos] = useState(0)
  const [nivelMicro, setNivelMicro] = useState(0)
  const [nivelVoz, setNivelVoz] = useState(0)
  const [turnos, setTurnos] = useState<TurnoLlamada[]>([])
  const [escuchado, setEscuchado] = useState('')
  const [aviso, setAviso] = useState('')
  const [silenciado, setSilenciado] = useState(false)

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal()
    // Arranca en el siguiente ciclo: en StrictMode el efecto se monta, desmonta
    // y vuelve a montar, y así solo la segunda vez llega a iniciar la llamada.
    let desmontado = false
    const arranque = window.setTimeout(async () => {
      // Si en este navegador no se puede hablar (Opera, Brave, micrófono
      // bloqueado...), avisarlo antes de que Coli salude.
      const motivo = MOTIVO_SIN_VOZ ?? ((await microfonoBloqueado()) ? MENSAJE_MICROFONO_BLOQUEADO : null)
      if (motivo) {
        if (desmontado) return
        setAviso(motivo)
        setEstado('error')
        return
      }
      if (desmontado) return
      try {
        controlRef.current = iniciarLlamada({
          contexto,
          onEstado: setEstado,
          onTurno: (turno) => {
            turnosRef.current = [...turnosRef.current, turno]
            setTurnos(turnosRef.current)
          },
          onSegundos: setSegundos,
          onEscuchando: setEscuchado,
          onNivelMicro: setNivelMicro,
          onNivelVoz: setNivelVoz,
          onAviso: setAviso,
        })
      } catch (e) {
        setAviso((e as Error).message)
        setEstado('error')
      }
    }, 150)
    return () => {
      desmontado = true
      window.clearTimeout(arranque)
      controlRef.current?.colgar()
    }
    // La llamada arranca una sola vez por montaje: un cambio de props no la reinicia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'end' })
  }, [turnos])

  const colgar = () => {
    controlRef.current?.colgar()
    onCerrar(turnosRef.current)
  }

  const alternarSilencio = () => {
    setSilenciado(!silenciado)
    controlRef.current?.silenciar(!silenciado)
  }

  const enCurso = estado !== 'conectando' && estado !== 'finalizada' && estado !== 'error'

  return (
    <dialog
      ref={dialogRef}
      onClose={colgar}
      aria-label="Llamada con Coli"
      className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-3xl bg-white p-0 text-body shadow-soft-lg backdrop:bg-navy/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex flex-col items-center bg-gradient-to-b from-brand-50 to-white px-6 pt-8 pb-5">
        <AvatarColi estado={estado} nivel={estado === 'hablando' ? nivelVoz : nivelMicro} />
        <h2 className="mt-3 text-xl font-extrabold tracking-tight text-navy">Coli</h2>
        <p className="text-xs text-slate-500">Asistente de color y obra · COLORLINK</p>
        <div className="mt-3 flex items-center gap-2">
          {estado === 'conectando' && <Loader2 size={14} className="animate-spin text-primary" />}
          <span
            className={`text-xs font-bold ${
              estado === 'error' ? 'text-rose-600' : estado === 'hablando' ? 'text-primary' : 'text-slate-600'
            }`}
          >
            {silenciado && estado === 'escuchando'
              ? 'Micrófono en silencio'
              : estado === 'error' && turnos.length === 0
                ? 'No se pudo iniciar la llamada'
                : ETIQUETA[estado]}
          </span>
          {segundos > 0 && <span className="font-mono text-xs text-slate-400 tabular-nums">{formatoReloj(segundos)}</span>}
        </div>
        {estado === 'escuchando' && escuchado && (
          <p className="mt-2 max-w-full truncate text-xs text-slate-500 italic" aria-live="polite">
            “{escuchado}”
          </p>
        )}
      </div>

      {aviso && (
        <div className="mx-5 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800">
          <AlertTriangle size={16} className="mt-px shrink-0" />
          <span>{aviso}</span>
        </div>
      )}

      <div className="max-h-52 min-h-[132px] space-y-2 overflow-y-auto px-5 pb-4">
        {turnos.length === 0 && estado !== 'conectando' && estado !== 'error' && (
          <p className="pt-6 text-center text-xs text-slate-400">Habla con naturalidad. Coli te escucha.</p>
        )}
        {turnos.slice(-4).map((t, i) => (
          <div
            key={`${turnos.length}-${i}`}
            className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
              t.autor === 'coli' ? 'border border-brand-100 bg-brand-50/60 text-navy' : 'ml-6 bg-slate-100 text-slate-600'
            }`}
          >
            <span className="font-bold">{t.autor === 'coli' ? 'Coli' : 'Tú'}: </span>
            {t.texto}
          </div>
        ))}
        <div ref={finRef} />
      </div>

      <div className="flex items-center justify-center gap-4 border-t border-slate-100 px-6 py-5">
        <button
          type="button"
          onClick={alternarSilencio}
          disabled={!enCurso}
          aria-label={silenciado ? 'Activar micrófono' : 'Silenciar micrófono'}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
            silenciado ? 'bg-navy text-white' : 'bg-slate-100 text-navy hover:bg-slate-200'
          }`}
        >
          {silenciado ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <div className="flex h-8 w-14 items-end gap-[3px]" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`w-1.5 rounded-full transition-all duration-75 ${
                !silenciado && nivelMicro >= ((i + 1) / 7) * 0.55 ? 'bg-success' : 'bg-slate-200'
              }`}
              style={{ height: 8 + i * 3.5 }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={colgar}
          aria-label="Colgar"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-soft-lg transition-colors hover:bg-rose-700"
        >
          <PhoneOff size={24} />
        </button>
      </div>
      <p className="-mt-2 px-6 pb-4 text-center text-[11px] text-slate-400">
        La llamada se cierra sola a los 5 minutos · solo temas de COLORLINK
      </p>
    </dialog>
  )
}
