# Arquitectura de Colorlink (frontend)

Este documento explica cómo está organizado el código y por qué, para poder presentarlo o retomarlo fácilmente.

## Alcance funcional

La aplicación implementa **solo la etapa "Necesidad del cliente"** del flujo completo de Colorlink:

```
Necesidad del cliente → Solución técnica → Abastecimiento → Servicio → Calidad
        ↑
   (esto es lo que existe en este frontend)
```

Las otras 4 etapas están modeladas en el diagrama relacional (`docs/DIAGRAMA.md` /
`colorlink-modelo-completo.drawio`) pero **no** tienen pantallas propias — es una decisión
de alcance, no una limitación técnica: el enunciado original pide que el cliente solo vea
su solicitud, no la operación interna.

## Capas

```
src/
  app/            Composición: providers globales, rutas, layout raíz (App.tsx)
  pages/          Componentes de ruta — delgados, solo orquestan features
  features/
    solicitudes/  Todo lo específico del dominio "solicitud": wizard, contexto de estado
    auth/         Login simulado, sesión, ruta protegida
  domain/
    solicitud/    Reglas de negocio puras: tipos, motor de recomendación,
                  máquina de estados, validaciones (zod) — sin dependencias de React
  data/
    mockData.ts          Datos semilla (respaldo local, ver supabaseClient.ts)
    supabaseClient.ts     Cliente de Supabase, o null si no hay credenciales (.env.local)
    repositories/        Acceso a datos detrás de una interfaz estable (SolicitudesRepository)
  shared/
    ui/           Componentes de interfaz reutilizables (Button, Card, Badge, Toaster...)
    layout/       Header
    illustrations/ SVGs decorativos
    lib/          Utilidades transversales (sistema de toasts)
```

**Regla de dependencia:** `domain/` no importa de `features/` ni de `pages/` — es lógica
de negocio aislada y testeable sin React. `data/repositories/` depende de `domain/` (para
tipos y reglas), no al revés. `features/` orquesta `domain/` + `data/` + `shared/ui/` para
construir pantallas. `pages/` solo renderiza una `feature`.

Todos los imports usan el alias `@/` (configurado en `vite.config.ts` y `tsconfig.app.json`)
en vez de rutas relativas largas (`../../../`).

## Piezas nuevas y qué reemplazan

| Pieza | Reemplaza | Por qué |
|---|---|---|
| `data/repositories/solicitudesRepository.ts` (+ `.local.ts` / `.supabase.ts`) | Lógica de guardado inline en el Context | Persiste en Supabase si hay credenciales (`docs/SUPABASE.md`), o en `localStorage` si no — mismo contrato async (`SolicitudesRepository`) para el resto de la app |
| `domain/solicitud/estadoMachine.ts` | Mapeo fijo estado→etapa repetido en 2 pantallas | Única fuente de verdad para las transiciones válidas y el historial de fechas |
| `domain/solicitud/schemas.ts` (zod) | Funciones `validateStep` con `if` sueltos | Reglas de validación centralizadas y reusables |
| `features/auth/` | Nombre de cliente quemado (`CLIENTE_ACTUAL`) | Header y "Hola, {nombre}" ahora reflejan una sesión real (simulada) |
| `shared/ui/Toaster.tsx` + `shared/lib/toast.ts` | Sin feedback visual tras crear/avanzar una solicitud | Confirma acciones al usuario |
| `shared/ui/ErrorBoundary.tsx`, `pages/NotFound.tsx` | Nada — la app no manejaba errores ni rutas inválidas | Evita pantallas en blanco |

## Roles y panel de administrador

El login tiene dos roles (`src/features/auth/types.ts`): **cliente** (registra solicitudes,
ve solo `/mis-solicitudes`) y **admin** (ve `/admin`, el panel donde llegan todas las
solicitudes de todos los clientes para ejecutar la solución). `RequireAuth` acepta un prop
`rol` opcional para restringir una ruta a un rol específico y redirige al home del rol
correcto si no coincide. Ambos roles comparten `SolicitudesTable`
(`src/features/solicitudes/SolicitudesTable.tsx`) y la pantalla `SolicitudDetail`; el admin
ve una columna adicional de cliente y su propio breadcrumb de vuelta al panel.

## Base de datos real (Supabase)

Ver [`docs/SUPABASE.md`](./SUPABASE.md) para la guía completa (crear el proyecto, aplicar
`supabase/schema.sql`, configurar `.env.local`). En resumen: `solicitudesRepository` es
async y elige entre `solicitudesRepository.supabase.ts` y `solicitudesRepository.local.ts`
según si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` están configuradas — el login se
queda en las cuentas simuladas de `mockUsuarios.ts` por ahora, solo las solicitudes se
mueven a la base de datos real.

## Qué se dejó fuera a propósito

- **Recuperación de contraseña / registro de cuentas**: el login usa cuentas de demostración
  fijas (`src/features/auth/mockUsuarios.ts`) — suficiente para el alcance académico.
- **Solicitudes por cliente**: todas las solicitudes son visibles para cualquier cliente
  autenticado (no hay `clienteId` en `Solicitud`) — el alcance académico no pidió aislar
  datos entre cuentas de cliente, solo separar la vista de cliente de la de administrador.

## Pruebas

`npm run test` corre Vitest sobre:
- `domain/solicitud/recommendationEngine.test.ts` — reglas del motor de recomendación
- `domain/solicitud/estadoMachine.test.ts` — transiciones de estado e historial
- `domain/solicitud/schemas.test.ts` — validación de cada paso del wizard
- `data/repositories/solicitudesRepository.test.ts` — persistencia en localStorage
- `features/auth/mockUsuarios.test.ts` — validación de credenciales y asignación de rol
- `features/solicitudes/wizard/WizardPage.test.tsx` — recorrido completo del wizard (integración)
