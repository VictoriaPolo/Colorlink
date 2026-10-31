/** Convierte un valor a una celda CSV segura: comillas dobles si trae comas,
 * comillas o saltos de línea, y se escapan las comillas internas. */
function celda(valor: unknown): string {
  const texto = valor == null ? '' : String(valor)
  return /[",\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/**
 * Arma un CSV (con BOM para que Excel reconozca los acentos) y dispara la
 * descarga en el navegador — mismo patrón que "Descargar resumen" del
 * asistente de solicitud, sin ninguna librería nueva.
 */
export function descargarCSV(nombreArchivo: string, encabezados: string[], filas: unknown[][]): void {
  const lineas = [encabezados, ...filas].map((fila) => fila.map(celda).join(','))
  const contenido = '﻿' + lineas.join('\r\n')
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
