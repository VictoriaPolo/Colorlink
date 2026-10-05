-- Esquema Supabase (Postgres) para Colorlink — etapa "Necesidad del cliente".
-- Corresponde a las 7 tablas de esa etapa en docs/DIAGRAMA.md, con nombres de
-- columna alineados a src/domain/solicitud/types.ts para que el mapeo en el
-- repositorio (src/data/repositories/solicitudesRepository.ts) sea directo.
--
-- Cómo aplicarlo: pega este archivo completo en Supabase → SQL Editor → Run.

create extension if not exists pgcrypto;

create table clientes (
  id bigint generated always as identity primary key,
  nombre text not null,
  nit text not null unique,
  created_at timestamptz not null default now()
);

-- Los códigos 'CL-1001', 'CL-1002'... se generan en la base de datos (no en el
-- cliente) para no repetir el bug de condición de carrera que tenía calcular
-- "max(id) + 1" en el navegador con varios usuarios creando solicitudes a la vez.
create table solicitudes (
  numero bigint generated always as identity,
  id text generated always as ('CL-' || (1000 + numero)) stored primary key,
  cliente_id bigint not null references clientes (id),
  responsable text not null,
  canal_entrada text not null,
  fecha_solicitud date not null default current_date,
  estado text not null default 'Recibida'
    check (estado in ('Recibida', 'En análisis', 'Solución propuesta', 'En abastecimiento', 'Servicio programado', 'Finalizada')),
  ciudad text not null,
  tipo_obra text not null,
  area_aprox_m2 numeric,
  fecha_requerida date,
  created_at timestamptz not null default now()
);

create table especificaciones_tecnicas (
  id bigint generated always as identity primary key,
  solicitud_id text not null unique references solicitudes (id) on delete cascade,
  superficie text not null,
  ambiente text not null,
  condicion text not null,
  color_acabado text not null
);

create table evidencias (
  id bigint generated always as identity primary key,
  solicitud_id text not null unique references solicitudes (id) on delete cascade,
  descripcion text,
  observaciones text,
  consentimiento boolean not null default false
);

create table imagenes_evidencia (
  id bigint generated always as identity primary key,
  evidencia_id bigint not null references evidencias (id) on delete cascade,
  nombre text not null,
  url text not null
);

create table recomendaciones (
  id bigint generated always as identity primary key,
  solicitud_id text not null unique references solicitudes (id) on delete cascade,
  tipo_solucion text not null,
  producto text not null,
  acabado text not null,
  cantidad_estimada text not null,
  aplicacion text not null,
  tiempo_estimado text not null,
  estado_texto text not null
);

create table advertencias (
  id bigint generated always as identity primary key,
  recomendacion_id bigint not null references recomendaciones (id) on delete cascade,
  mensaje text not null
);

-- No está en el ER original: el frontend necesita la línea de tiempo de
-- estados por los que pasó la solicitud (ver historialEstados en types.ts).
create table historial_estados (
  id bigint generated always as identity primary key,
  solicitud_id text not null references solicitudes (id) on delete cascade,
  estado text not null,
  fecha date not null default current_date
);

-- ponytail: RLS abierta a la key "anon" porque el login de la app sigue siendo
-- simulado (no hay Supabase Auth todavía) — sube el nivel a políticas por
-- usuario autenticado si este proyecto deja de ser un prototipo académico.
alter table clientes enable row level security;
alter table solicitudes enable row level security;
alter table especificaciones_tecnicas enable row level security;
alter table evidencias enable row level security;
alter table imagenes_evidencia enable row level security;
alter table recomendaciones enable row level security;
alter table advertencias enable row level security;
alter table historial_estados enable row level security;

create policy "anon_all_clientes" on clientes for all to anon using (true) with check (true);
create policy "anon_all_solicitudes" on solicitudes for all to anon using (true) with check (true);
create policy "anon_all_especificaciones_tecnicas" on especificaciones_tecnicas for all to anon using (true) with check (true);
create policy "anon_all_evidencias" on evidencias for all to anon using (true) with check (true);
create policy "anon_all_imagenes_evidencia" on imagenes_evidencia for all to anon using (true) with check (true);
create policy "anon_all_recomendaciones" on recomendaciones for all to anon using (true) with check (true);
create policy "anon_all_advertencias" on advertencias for all to anon using (true) with check (true);
create policy "anon_all_historial_estados" on historial_estados for all to anon using (true) with check (true);

-- Datos semilla equivalentes a src/data/mockData.ts, para probar lectura de
-- inmediato sin haber creado ninguna solicitud todavía.
with nuevo_cliente as (
  insert into clientes (nombre, nit) values ('Constructora Andina S.A.S.', '900123456-7')
  returning id
),
nueva_solicitud as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Laura Polo', 'Página web', date '2026-08-15', 'En análisis', 'Bogotá', 'Edificio', 120, date '2026-09-10'
  from nuevo_cliente
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, 'Recibida', date '2026-08-15' from nueva_solicitud
union all
select id, 'En análisis', date '2026-08-16' from nueva_solicitud;

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Exterior', 'Exterior', 'Buen estado', 'Satinado' from solicitudes where id = 'CL-1001';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Fachada de edificio residencial de 6 pisos, requiere renovación de pintura exterior.', '', true
from solicitudes where id = 'CL-1001';

insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
select id, 'Sistema de recubrimiento para exterior', 'Koraza 5 Años Protección Total', 'Satinado', '8 unidades (aprox. 120 m²)', '2 capas', '3 a 4 días', 'Recomendación preliminar'
from solicitudes where id = 'CL-1001';
