/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  /** Identificador público (no es un secreto) del acceso con Google; ver docs/CUENTAS_SOCIALES.md. */
  /** Con Supabase, "true" deja las cuentas y botones de demostración (por defecto se apagan). */
  readonly VITE_MODO_DEMO?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  /** Identificador público (no es un secreto) del acceso con Facebook; ver docs/CUENTAS_SOCIALES.md. */
  readonly VITE_FACEBOOK_APP_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
