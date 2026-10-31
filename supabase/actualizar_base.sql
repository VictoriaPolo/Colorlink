-- COLORLINK — Completa una base de datos creada con las primeras versiones.
--
-- Pégalo completo en Supabase (SQL Editor) y pulsa Run. Se puede correr más de una vez: no duplica ni borra nada.
--
-- Reúne, en el orden correcto, lo que le faltaba a una base que solo corrió schema.sql, schema_tienda.sql y seed_tienda.sql:
--   1) Las columnas que el equipo agregó a `pedidos` (punto de retiro y notas internas).
--   2) schema_cuentas_y_panel.sql: perfiles y roles, extras de cada solicitud y políticas para cuentas con sesión.
--   3) schema_pagos.sql: el pago, el cupón y el código de retiro de cada pedido.

-- 1) Columnas del equipo en pedidos ------------------------------------------------------------
alter table pedidos add column if not exists punto_retiro text;
alter table pedidos add column if not exists notas jsonb not null default '[]'::jsonb;

-- 2) Cuentas, roles y panel ---------------------------------------------------------------------
-- COLORLINK — Cuentas, roles y panel del equipo.
--
-- Ejecútalo en Supabase (SQL Editor) DESPUÉS de schema.sql y schema_tienda.sql.
-- Se puede correr más de una vez: no duplica nada.
--
-- Qué agrega:
--   1) `perfiles`: el rol de cada cuenta (cliente o admin), creado solo al registrarse
--      con correo, Google o Facebook.
--   2) `extras_solicitud`: quién creó cada solicitud, su diagnóstico por imagen, quién la
--      atiende y las notas internas del equipo (así no se toca el esquema original).
--   3) Políticas para el rol `authenticated`: con Supabase Auth las consultas ya no llegan
--      como `anon`, y las políticas originales solo cubren a `anon`.

-- 1) Perfiles ----------------------------------------------------------------------------
create table if not exists perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  rol text not null default 'cliente' check (rol in ('cliente', 'admin')),
  created_at timestamptz not null default now()
);

-- Cada cuenta nueva recibe su perfil de cliente. Google y Facebook entregan el nombre en
-- `full_name` o `name`; el registro con correo lo manda como `nombre`.
create or replace function crear_perfil() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into perfiles (id, nombre)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'nombre',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_cuenta on auth.users;
create trigger al_crear_cuenta
  after insert on auth.users
  for each row execute function crear_perfil();

-- Las cuentas que ya existían antes de este archivo también tienen perfil.
insert into perfiles (id, nombre)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;

alter table perfiles enable row level security;
drop policy if exists "perfil_propio" on perfiles;
create policy "perfil_propio" on perfiles for select to authenticated using (id = auth.uid());
-- Nadie puede cambiar su propio rol desde la app: se hace con SQL (ver el final del archivo).

-- 2) Extras de cada solicitud --------------------------------------------------------------
create table if not exists extras_solicitud (
  solicitud_id text primary key references solicitudes (id) on delete cascade,
  usuario_email text,
  diagnostico jsonb,
  asignado_a text,
  notas jsonb not null default '[]'::jsonb,
  cancelacion jsonb,
  updated_at timestamptz not null default now()
);

-- Por si la tabla ya existía de una corrida anterior del script.
alter table extras_solicitud add column if not exists cancelacion jsonb;

create or replace function tocar_extras() returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists al_cambiar_extras on extras_solicitud;
create trigger al_cambiar_extras
  before update on extras_solicitud
  for each row execute function tocar_extras();

alter table extras_solicitud enable row level security;

-- 3) Políticas para cuentas con sesión ------------------------------------------------------
-- ponytail: igual de abiertas que las de `anon` (prototipo académico). Quién ve qué se filtra
-- en la aplicación; para producción hay que pasar a políticas por dueño (ver docs/SUPABASE.md).
do $$
declare
  tabla text;
begin
  foreach tabla in array array[
    'clientes', 'solicitudes', 'especificaciones_tecnicas', 'evidencias', 'imagenes_evidencia',
    'recomendaciones', 'advertencias', 'historial_estados',
    'productos', 'kits', 'pedidos', 'extras_solicitud'
  ]
  loop
    execute format('drop policy if exists %I on %I', 'auth_all_' || tabla, tabla);
    execute format(
      'create policy %I on %I for all to authenticated using (true) with check (true)',
      'auth_all_' || tabla, tabla
    );
  end loop;
end;
$$;

-- Cómo hacer administrador (equipo) a una cuenta ya registrada:
--   update perfiles set rol = 'admin'
--   where id = (select id from auth.users where email = 'equipo@tu-correo.com');

-- 3) Pagos --------------------------------------------------------------------------------------
-- COLORLINK — Pagos de la tienda (pasarela de práctica).
--
-- Ejecútalo en Supabase (SQL Editor) DESPUÉS de schema_tienda.sql. Se puede correr más de una vez.
--
-- Agrega a `pedidos` lo que la app guarda de cada pago: el resultado (medio, estado, referencia y
-- los últimos cuatro dígitos), el cupón y el código con el que el cliente retira, y el historial de
-- etapas (cuándo pasó el pedido por cada una) con el que el cliente lo rastrea. Nunca se guarda
-- el número completo de una tarjeta ni su código de seguridad, y la pasarela no cobra nada real.
-- Sin este archivo, los pedidos se siguen guardando, pero sin los datos del pago.

alter table pedidos add column if not exists pago jsonb;
alter table pedidos add column if not exists cupon text;
alter table pedidos add column if not exists descuento numeric not null default 0;
alter table pedidos add column if not exists codigo_retiro text;
alter table pedidos add column if not exists historial jsonb;
