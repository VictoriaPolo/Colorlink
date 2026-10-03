-- Esquema de la tienda COLORLINK (distribuidor Pintuco). Aplicar DESPUÉS de
-- supabase/schema.sql. Columnas alineadas a src/domain/tienda/types.ts para
-- que el mapeo en tiendaRepository.supabase.ts sea directo.

create table productos (
  id bigint generated always as identity primary key,
  nombre text not null,
  categoria text not null
    check (categoria in ('Impermeabilizantes', 'Fachadas y exteriores', 'Esmaltes y metales', 'Interiores')),
  descripcion text not null,
  precio numeric not null,
  unidad_medida text not null default 'Galón',
  destacado boolean not null default false,
  badge text,
  rendimiento_m2_por_galon numeric not null default 30,
  created_at timestamptz not null default now()
);

create table kits (
  id bigint generated always as identity primary key,
  patologia text not null
    check (patologia in ('Fachada exterior', 'Humedad y moho', 'Goteras y terrazas', 'Metales oxidados')),
  nombre text not null,
  descripcion text not null,
  componentes text[] not null,
  precio_estimado numeric not null,
  descuento_pct int not null default 0
);

-- Captura de pedido del carrito -- NO es un cobro real, es un prototipo
-- académico (mismo espíritu que "solicitudes"): no hay campos de tarjeta.
create table pedidos (
  numero bigint generated always as identity,
  id text generated always as ('PED-' || (1000 + numero)) stored primary key,
  cliente_nombre text not null,
  cliente_email text,
  items jsonb not null,
  total numeric not null,
  estado text not null default 'Recibido',
  created_at timestamptz not null default now()
);

-- ponytail: RLS abierta a "anon" por la misma razón que en schema.sql (no hay
-- Supabase Auth todavía) -- subir el nivel si esto deja de ser un prototipo.
alter table productos enable row level security;
alter table kits enable row level security;
alter table pedidos enable row level security;

create policy "anon_all_productos" on productos for all to anon using (true) with check (true);
create policy "anon_all_kits" on kits for all to anon using (true) with check (true);
create policy "anon_all_pedidos" on pedidos for all to anon using (true) with check (true);
