import { describe, it, expect, beforeEach } from 'vitest'
import { authRepositoryLocal as auth } from './authRepository.local'

beforeEach(() => window.localStorage.clear())

const ana = { nombre: 'Ana Gómez', email: 'Ana@Correo.com', password: 'pintura2026' }

describe('authRepositoryLocal — registro y acceso con correo', () => {
  it('registra un cliente nuevo y abre su sesión', async () => {
    const r = await auth.registrar(ana)
    expect(r).toMatchObject({ ok: true, usuario: { nombre: 'Ana Gómez', email: 'ana@correo.com', rol: 'cliente', proveedor: 'correo' } })
    expect((await auth.restaurarSesion())?.email).toBe('ana@correo.com')
  })

  it('no permite registrar un correo repetido ni el de una cuenta de demostración', async () => {
    await auth.registrar(ana)
    expect(await auth.registrar({ ...ana, email: 'ANA@correo.com' })).toMatchObject({ ok: false })
    expect(await auth.registrar({ ...ana, email: 'admin@colorlink.com' })).toMatchObject({ ok: false })
  })

  it('inicia sesión con la contraseña correcta y rechaza la incorrecta', async () => {
    await auth.registrar(ana)
    await auth.cerrarSesion()
    expect(await auth.iniciarSesion('ana@correo.com', 'otra-clave1')).toMatchObject({ ok: false, error: 'Correo o contraseña incorrectos.' })
    expect(await auth.iniciarSesion(' ANA@correo.com ', ana.password)).toMatchObject({ ok: true })
  })

  it('no guarda la contraseña en texto plano', async () => {
    await auth.registrar(ana)
    const guardado = window.localStorage.getItem('colorlink:usuarios')!
    expect(guardado).not.toContain(ana.password)
    expect(guardado).toContain('huella')
  })

  it('las cuentas de demostración entran sin registrarse', async () => {
    const cliente = await auth.iniciarSesion('laura@colorlink.com', 'colorlink123')
    expect(cliente).toMatchObject({ ok: true, usuario: { rol: 'cliente', demo: true } })
    const admin = await auth.iniciarSesion('admin@colorlink.com', 'admin123')
    expect(admin).toMatchObject({ ok: true, usuario: { rol: 'admin' } })
  })

  it('cierra la sesión', async () => {
    await auth.registrar(ana)
    await auth.cerrarSesion()
    expect(await auth.restaurarSesion()).toBeNull()
  })
})

describe('authRepositoryLocal — Google y Facebook en modo demostración', () => {
  const identidad = { nombre: 'Luis Mora', email: 'luis@gmail.com' }

  it('crea la cuenta con el proveedor y, la segunda vez, entra a la misma', async () => {
    const primera = await auth.iniciarConProveedor('google', identidad)
    expect(primera).toMatchObject({ ok: true, usuario: { proveedor: 'google', rol: 'cliente' } })
    await auth.cerrarSesion()
    const segunda = await auth.iniciarConProveedor('facebook', identidad)
    expect(segunda).toMatchObject({ ok: true, usuario: { email: 'luis@gmail.com', proveedor: 'google' } })
    expect(JSON.parse(window.localStorage.getItem('colorlink:usuarios')!).data).toHaveLength(1)
  })

  it('pide la identidad y no deja usar el correo de una cuenta de demostración', async () => {
    expect(await auth.iniciarConProveedor('google')).toMatchObject({ ok: false })
    expect(await auth.iniciarConProveedor('google', { nombre: 'X Y', email: 'admin@colorlink.com' })).toMatchObject({ ok: false })
  })

  it('una cuenta creada con Google no entra con contraseña y el mensaje lo explica', async () => {
    await auth.iniciarConProveedor('google', identidad)
    await auth.cerrarSesion()
    const r = await auth.iniciarSesion(identidad.email, 'lo-que-sea1')
    expect(r).toMatchObject({ ok: false })
    expect(r.ok === false && r.error).toContain('Google')
  })
})
