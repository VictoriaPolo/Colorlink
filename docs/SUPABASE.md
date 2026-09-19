# Conectar Colorlink a Supabase

Este documento es para la jornada de integración: pasar de "solicitudes en
localStorage" a "solicitudes en una base de datos Postgres real". El código ya
está listo del lado del frontend (ver "Cómo funciona" abajo) — lo que falta es
crear el proyecto de Supabase y darle sus credenciales a la app.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) e inicia sesión (con GitHub o correo).
2. **New project** → nombre `colorlink` → elige una contraseña para la base de
   datos (guárdala, no se puede ver después) → región cercana → plan **Free**.
3. Espera 1-2 minutos mientras se aprovisiona.

## 2. Crear las tablas

1. En el panel del proyecto, ve a **SQL Editor → New query**.
2. Abre [`supabase/schema.sql`](../supabase/schema.sql) de este repo, copia
   todo su contenido y pégalo en el editor.
3. **Run**. Esto crea las 8 tablas (7 del modelo "Necesidad del cliente" +
   `historial_estados`), sus relaciones, las políticas de acceso, y siembra
   `CL-1001` (la misma solicitud de ejemplo que ya existe en
   `src/data/mockData.ts`) para poder probar una lectura de inmediato.
4. Verifica en **Table Editor** que las 8 tablas aparecen y que `solicitudes`
   tiene una fila.

## 3. Obtener la URL y la API key

En **Project Settings → API**:
- **Project URL** (algo como `https://xxxxxxxxxxxx.supabase.co`)
- **anon public** key (una cadena larga que empieza con `eyJ...`)

Nunca uses la **service_role** key en el frontend — esa sí puede saltarse
todas las reglas de seguridad y no debe salir del backend.

## 4. Configurar el proyecto

Crea `.env.local` en la raíz (mismo nivel que `package.json`), copiando
[`.env.example`](../.env.example):

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

`.env.local` ya está en `.gitignore` (vía el patrón `*.local`) — no se sube al
repo. Reinicia `npm run dev` después de crear el archivo (Vite solo lee
variables de entorno al arrancar).

Si todo quedó bien configurado, la consola del navegador **no** debe mostrar
el mensaje `[colorlink] VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY no
configuradas...` al cargar la app.

## Cómo funciona (para quien siga el código)

- `src/data/supabaseClient.ts` crea el cliente si las dos variables de entorno
  existen; si no, exporta `null`.
- `src/data/repositories/solicitudesRepository.ts` elige entre
  `solicitudesRepository.supabase.ts` (real) y `solicitudesRepository.local.ts`
  (localStorage) según eso — el resto de la app (`SolicitudesContext`,
  `WizardPage`, `MisSolicitudes`, `Admin`, `SolicitudDetail`) llama siempre al
  mismo `solicitudesRepository` sin saber cuál de los dos está activo.
- El login **no** se movió a Supabase Auth — sigue usando las cuentas de
  `src/features/auth/mockUsuarios.ts`. Solo los datos de solicitudes viven en
  la base de datos real.

## Checklist de pruebas funcionales (lo que pide la guía de la jornada)

Con `.env.local` configurado y `npm run dev` corriendo:

1. **Lectura**: entra como cliente o administrador — la lista de solicitudes
   debe mostrar `CL-1001` (la fila sembrada por `schema.sql`), viniendo de
   Supabase y no de localStorage.
2. **Escritura/INSERT desde el formulario**: como cliente, completa
   "Solicitar solución" (los 4 pasos + confirmar). Al terminar, revisa en
   Supabase → Table Editor → `solicitudes` que apareció una fila nueva, y que
   `especificaciones_tecnicas`, `evidencias` y `recomendaciones` tienen su fila
   correspondiente con el mismo `solicitud_id`.
3. **Validación de campos**: compara una fila de `solicitudes` en Supabase
   contra lo que se ve en pantalla en "Mis solicitudes" / el panel de
   administrador — mismo cliente, ciudad, tipo de obra, estado.
4. **Avanzar/Resolver**: desde el panel de administrador, usa "Avanzar" (o
   "Resolver" en el último paso) sobre la solicitud nueva y confirma en
   Supabase que `solicitudes.estado` cambió y que se insertó una fila nueva en
   `historial_estados`.

Anota en tu bitácora de la jornada cualquier error que aparezca en cada paso
(por ejemplo, un `403` suele ser una política RLS mal aplicada; un `23503` es
una foreign key sin la fila padre) — es justo el proceso de iteración que pide
la guía.

## Límites conocidos de esta integración inicial

- **Imágenes de evidencia**: hoy se generan como `blob:` URLs locales del
  navegador (`FileDropzone.tsx`), no se suben a ningún storage. Se guardan tal
  cual en `imagenes_evidencia.url`, pero esa URL deja de servir en cuanto
  cierras la pestaña o la abres desde otro navegador. Subirlas de verdad
  requeriría Supabase Storage — está fuera del alcance de esta integración
  inicial (que se enfoca en las tablas de Postgres).
- **Sin autenticación real todavía**: las políticas RLS del esquema son
  abiertas para la key `anon` (ver el comentario `ponytail:` en
  `supabase/schema.sql`) porque el login sigue siendo simulado. Si más
  adelante se migra el login a Supabase Auth, hay que reemplazar esas
  políticas por unas basadas en el usuario autenticado.
