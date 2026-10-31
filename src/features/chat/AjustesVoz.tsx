import { useEffect, useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import {
  TONOS,
  elegirVoz,
  etiquetaVoz,
  guardarPerfil,
  hablarTexto,
  leerPerfil,
  ordenarVoces,
  pistaDeCalidad,
  type PerfilVoz,
  type Tono,
} from './sintesis'

/** Las voces del navegador llegan en diferido y a veces se suman después. */
function useVoces() {
  const [voces, setVoces] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const sintesis = window.speechSynthesis
    const leer = () => setVoces(sintesis.getVoices())
    leer()
    sintesis.addEventListener('voiceschanged', leer)
    return () => sintesis.removeEventListener('voiceschanged', leer)
  }, [])
  return voces
}

const EN_EDGE = /\bEdg\//.test(navigator.userAgent)

/** Cómo suena Coli: el tono (Natural o JARVIS) y la voz. Se recuerda en este navegador. */
export default function AjustesVoz() {
  const voces = useVoces()
  const [perfil, setPerfil] = useState<PerfilVoz>(leerPerfil)
  const disponibles = useMemo(() => ordenarVoces(voces), [voces])
  const actual = elegirVoz(voces, perfil.voiceURI)
  const pista = pistaDeCalidad(actual, EN_EDGE)

  /** Aplica el cambio, lo guarda y deja oír cómo quedó. */
  const cambiar = (cambio: Partial<PerfilVoz>) => {
    const nuevo = { ...perfil, ...cambio }
    setPerfil(nuevo)
    guardarPerfil(nuevo)
    hablarTexto('Hola, soy Coli. Así suena mi voz.', { perfil: nuevo })
  }

  return (
    <section aria-label="Voz de Coli" className="mx-5 mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
      <div role="radiogroup" aria-label="Tono de voz" className="grid grid-cols-2 gap-2">
        {(Object.keys(TONOS) as Tono[]).map((tono) => {
          const elegido = perfil.tono === tono
          return (
            <button
              key={tono}
              type="button"
              role="radio"
              aria-checked={elegido}
              onClick={() => cambiar({ tono })}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                elegido ? 'border-primary bg-brand-50 text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-primary/60'
              }`}
            >
              <span className="block font-extrabold">{TONOS[tono].nombre}</span>
              <span className="block text-[11px] leading-snug opacity-80">{TONOS[tono].descripcion}</span>
            </button>
          )
        })}
      </div>

      {disponibles.length > 0 && (
        <div className="mt-3 flex items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="font-semibold text-navy">Voz</span>
            <select
              value={perfil.voiceURI ?? ''}
              onChange={(e) => cambiar({ voiceURI: e.target.value || null })}
              className="w-full min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs text-navy outline-none focus:border-primary focus:ring-4 focus:ring-brand-100"
            >
              <option value="">Automática: {actual ? etiquetaVoz(actual) : 'la mejor disponible'}</option>
              {disponibles.map((voz) => (
                <option key={voz.voiceURI} value={voz.voiceURI}>
                  {etiquetaVoz(voz)}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => hablarTexto('Hola, soy Coli. Así suena mi voz.', { perfil })}
            aria-label="Probar la voz"
            title="Probar la voz"
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark"
          >
            <Play size={14} />
          </button>
        </div>
      )}

      {pista && (
        <p role="note" className="mt-2.5 rounded-lg bg-amber-50 px-2.5 py-2 leading-relaxed font-medium text-amber-800">
          {pista}
        </p>
      )}
    </section>
  )
}
