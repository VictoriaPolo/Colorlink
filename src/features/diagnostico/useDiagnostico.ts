import { useEffect, useMemo, useState } from 'react'
import type { MetricasImagen } from '@/domain/diagnostico/analizarPixeles'
import { diagnosticar } from '@/domain/diagnostico/diagnosticar'
import { zonaSugerida } from '@/domain/diagnostico/zona'
import type { DiagnosticoImagen, SolicitudFormData } from '@/domain/solicitud/types'
import { analizarImagenUrl } from './imagen'

type Formulario = Pick<SolicitudFormData, 'tecnica' | 'evidencia'>

function entradaDe(f: Formulario, metricas: MetricasImagen[], descripcion: string) {
  return {
    zona: f.evidencia.zona ?? zonaSugerida(f.tecnica),
    descripcion,
    superficie: f.tecnica.superficie,
    condicion: f.tecnica.condicion,
    metricas,
  }
}

/** Mide las fotos; las que no se pueden leer se ignoran en vez de tumbar el diagnóstico. */
async function medirFotos(urls: string[]): Promise<MetricasImagen[]> {
  const medidas = await Promise.all(urls.map((url) => analizarImagenUrl(url).catch(() => null)))
  return medidas.filter((m): m is MetricasImagen => m !== null)
}

/** Diagnóstico definitivo del formulario: el que se guarda con la solicitud. */
export async function diagnosticoDeFormulario(f: Formulario): Promise<DiagnosticoImagen> {
  const metricas = await medirFotos(f.evidencia.imagenes.map((img) => img.url))
  return diagnosticar(entradaDe(f, metricas, f.evidencia.descripcion))
}

function useRetraso<T>(valor: T, ms: number): T {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms)
    return () => clearTimeout(t)
  }, [valor, ms])
  return retrasado
}

/**
 * Diagnóstico en vivo mientras el cliente completa el paso de evidencia: se
 * recalcula al cambiar fotos, zona o texto (el texto con un pequeño retraso
 * para no analizar cada tecla).
 */
export function useDiagnostico(f: Formulario): { diagnostico: DiagnosticoImagen; analizando: boolean } {
  // Se identifica el conjunto de fotos por sus id: las URL de una foto comprimida son enormes.
  const clave = f.evidencia.imagenes.map((img) => img.id).join('|')
  const [medidas, setMedidas] = useState<{ clave: string; metricas: MetricasImagen[] }>({ clave: '', metricas: [] })

  useEffect(() => {
    if (!clave) return
    let vivo = true
    medirFotos(f.evidencia.imagenes.map((img) => img.url)).then((metricas) => {
      if (vivo) setMedidas({ clave, metricas })
    })
    return () => {
      vivo = false
    }
    // Las fotos solo cambian cuando cambia su conjunto de id (la clave).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])

  const descripcion = useRetraso(f.evidencia.descripcion, 350)
  const metricas = useMemo(() => (clave && medidas.clave === clave ? medidas.metricas : []), [clave, medidas])
  const diagnostico = useMemo(
    () => diagnosticar(entradaDe(f, metricas, descripcion)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [f.tecnica, f.evidencia.zona, descripcion, metricas],
  )

  return { diagnostico, analizando: clave !== '' && medidas.clave !== clave }
}
