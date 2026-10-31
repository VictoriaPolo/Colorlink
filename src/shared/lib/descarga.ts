/** Baja un archivo generado en el navegador (un PDF, por ejemplo) con el nombre dado. */
export function descargarArchivo(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // Algunos navegadores necesitan la dirección viva un instante más para empezar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
