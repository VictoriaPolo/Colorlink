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
    mockData.ts          Datos semilla
    repositories/        Acceso a datos (hoy: localStorage) detrás de una interfaz estable
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
| `data/repositories/solicitudesRepository.ts` + `storage.ts` | Lógica de guardado inline en el Context | Persiste en `localStorage`; si mañana hay backend real, solo cambia este archivo |
| `domain/solicitud/estadoMachine.ts` | Mapeo fijo estado→etapa repetido en 2 pantallas | Única fuente de verdad para las transiciones válidas y el historial de fechas |
| `domain/solicitud/schemas.ts` (zod) | Funciones `validateStep` con `if` sueltos | Reglas de validación centralizadas y reusables |
| `features/auth/` | Nombre de cliente quemado (`CLIENTE_ACTUAL`) | Header y "Hola, {nombre}" ahora reflejan una sesión real (simulada) |
| `shared/ui/Toaster.tsx` + `shared/lib/toast.ts` | Sin feedback visual tras crear/avanzar una solicitud | Confirma acciones al usuario |
| `shared/ui/ErrorBoundary.tsx`, `pages/NotFound.tsx` | Nada — la app no manejaba errores ni rutas inválidas | Evita pantallas en blanco |

## Qué se dejó fuera a propósito

- **Panel interno/staff**: el flujo completo (Solución técnica → Calidad) existe solo en
  el modelo de datos, no en pantallas, porque el frontend de cliente no debe mostrarlo.
- **Backend real**: todo persiste en `localStorage` del navegador. El repositorio está
  diseñado para que cambiar a una API real sea un cambio localizado (un archivo).
- **Recuperación de contraseña / registro de cuentas**: el login usa cuentas de demostración
  fijas (`src/features/auth/mockUsuarios.ts`) — suficiente para el alcance académico.

## Pruebas

`npm run test` corre Vitest sobre:
- `domain/solicitud/recommendationEngine.test.ts` — reglas del motor de recomendación
- `domain/solicitud/estadoMachine.test.ts` — transiciones de estado e historial
- `domain/solicitud/schemas.test.ts` — validación de cada paso del wizard
- `data/repositories/solicitudesRepository.test.ts` — persistencia en localStorage
- `features/solicitudes/wizard/WizardPage.test.tsx` — recorrido completo del wizard (integración)
