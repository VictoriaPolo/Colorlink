import { describe, expect, it, vi, afterEach } from 'vitest'
import { descargarCSV } from './csv'

describe('descargarCSV', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('arma un CSV con BOM, encabezados y filas, escapando comas y comillas', async () => {
    let blobCapturado: Blob | undefined
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      blobCapturado = blob as Blob
      return 'blob:fake'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const clic = vi.fn()
    vi.spyOn(document, 'createElement').mockReturnValue({ click: clic, href: '', download: '' } as unknown as HTMLAnchorElement)

    descargarCSV('reporte', ['Nombre', 'Ciudad'], [['Ana, Pérez', 'Bogotá'], ['Dijo "hola"', 'Cali']])
    const contenido = await blobCapturado!.text()

    expect(contenido).toContain('Nombre,Ciudad')
    expect(contenido).toContain('"Ana, Pérez",Bogotá')
    expect(contenido).toContain('"Dijo ""hola""",Cali')
    expect(blobCapturado!.type).toBe('text/csv;charset=utf-8')
    expect(clic).toHaveBeenCalledTimes(1)
  })

  it('agrega la extensión .csv si no viene en el nombre', () => {
    let nombreDescargado = ''
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue({
      click: () => {},
      href: '',
      set download(valor: string) {
        nombreDescargado = valor
      },
      get download() {
        return nombreDescargado
      },
    } as unknown as HTMLAnchorElement)

    descargarCSV('clientes', ['A'], [['1']])
    expect(nombreDescargado).toBe('clientes.csv')
  })
})
