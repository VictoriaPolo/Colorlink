-- Datos de demostración adicionales para Colorlink.
-- Aplicar DESPUÉS de supabase/schema.sql (que ya siembra CL-1001).
-- Agrega 5 solicitudes más cubriendo distintas ciudades, tipos de obra y
-- CADA estado del ciclo de vida (En análisis, Solución propuesta, En
-- abastecimiento, Servicio programado, Finalizada) para que el panel de
-- administrador y las consultas de ejemplo (docs/SUPABASE.md) se vean con
-- datos variados en vez de una sola fila.

-- Solicitud: Medellín, Edificio, en "Solución propuesta"
with nc as (
  insert into clientes (nombre, nit) values ('Constructora Vallejo S.A.S.', '900234567-8')
  returning id
), ns as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Andrés Vallejo', 'Página web', date '2026-08-20', 'Solución propuesta', 'Medellín', 'Edificio', 250, date '2026-10-05'
  from nc
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, e, f from ns, (values
  ('Recibida', date '2026-08-20'), ('En análisis', date '2026-08-21'), ('Solución propuesta', date '2026-08-24')
) as h(e, f);

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Fachada', 'Alta exposición', 'Desgastada', 'No estoy seguro' from solicitudes where fecha_solicitud = '2026-08-20';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Fachada de edificio de 12 pisos con pintura desgastada por sol y lluvia.', 'Requiere andamios.', true
from solicitudes where fecha_solicitud = '2026-08-20';

insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
select id, 'Sistema de recubrimiento de alta exposición', 'Recubrimiento elastomérico protector UV', 'Satinado (sugerido para exteriores)', '17 unidades (aprox. 250 m²)', '2 capas', '5 a 7 días', 'Recomendación preliminar'
from solicitudes where fecha_solicitud = '2026-08-20';

-- Solicitud: Cali, Local comercial, en "En abastecimiento"
with nc as (
  insert into clientes (nombre, nit) values ('Comercializadora Rivas Ltda.', '900345678-1')
  returning id
), ns as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Marta Rivas', 'WhatsApp', date '2026-08-28', 'En abastecimiento', 'Cali', 'Local comercial', 90, date '2026-09-25'
  from nc
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, e, f from ns, (values
  ('Recibida', date '2026-08-28'), ('En análisis', date '2026-08-29'), ('Solución propuesta', date '2026-08-30'), ('En abastecimiento', date '2026-09-02')
) as h(e, f);

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Interior', 'Interior seco', 'Buen estado', 'Mate' from solicitudes where fecha_solicitud = '2026-08-28';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Local comercial en remodelación, cambio de imagen de marca.', '', true
from solicitudes where fecha_solicitud = '2026-08-28';

insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
select id, 'Sistema de recubrimiento para interior', 'Pintura interior de bajo olor y alta cubrición', 'Mate', '6 unidades (aprox. 90 m²)', '2 capas', '2 a 3 días', 'Recomendación preliminar'
from solicitudes where fecha_solicitud = '2026-08-28';

-- Solicitud: Barranquilla, Bodega, en "Servicio programado" (con advertencia)
with nc as (
  insert into clientes (nombre, nit) values ('Bodegas del Norte S.A.', '900456789-4')
  returning id
), ns as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Jorge Padilla', 'Punto físico', date '2026-08-10', 'Servicio programado', 'Barranquilla', 'Bodega', 500, date '2026-09-20'
  from nc
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, e, f from ns, (values
  ('Recibida', date '2026-08-10'), ('En análisis', date '2026-08-11'), ('Solución propuesta', date '2026-08-13'),
  ('En abastecimiento', date '2026-08-18'), ('Servicio programado', date '2026-08-25')
) as h(e, f);

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Metal', 'Industrial', 'Con pintura deteriorada', 'Brillante' from solicitudes where fecha_solicitud = '2026-08-10';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Estructura metálica de bodega industrial con corrosión visible.', 'Zona de alto tráfico de montacargas.', true
from solicitudes where fecha_solicitud = '2026-08-10';

with r as (
  insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
  select id, 'Sistema de recubrimiento industrial anticorrosivo', 'Esmalte industrial de alto desempeño', 'Brillante', '34 unidades (aprox. 500 m²)', '1 capa base + 2 capas de acabado', '5 a 7 días', 'Recomendación preliminar'
  from solicitudes where fecha_solicitud = '2026-08-10'
  returning id
)
insert into advertencias (recomendacion_id, mensaje)
select id, 'La superficie requiere preparación o reparación previa para asegurar una correcta adherencia del producto.' from r;

-- Solicitud: Bucaramanga, Oficina, "Finalizada" (ciclo completo)
with nc as (
  insert into clientes (nombre, nit) values ('Torre Empresarial Cacique S.A.S.', '900567890-7')
  returning id
), ns as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Diana Cárdenas', 'Otro', date '2026-07-15', 'Finalizada', 'Bucaramanga', 'Oficina', 150, date '2026-08-10'
  from nc
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, e, f from ns, (values
  ('Recibida', date '2026-07-15'), ('En análisis', date '2026-07-16'), ('Solución propuesta', date '2026-07-18'),
  ('En abastecimiento', date '2026-07-22'), ('Servicio programado', date '2026-07-29'), ('Finalizada', date '2026-08-05')
) as h(e, f);

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Interior', 'Interior seco', 'Nueva', 'Satinado' from solicitudes where fecha_solicitud = '2026-07-15';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Oficinas nuevas, primera mano de pintura antes de mudanza.', '', true
from solicitudes where fecha_solicitud = '2026-07-15';

insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
select id, 'Sistema de recubrimiento para interior', 'Pintura interior de bajo olor y alta cubrición', 'Satinado', '10 unidades (aprox. 150 m²)', '2 capas', '3 a 4 días', 'Recomendación preliminar'
from solicitudes where fecha_solicitud = '2026-07-15';

-- Solicitud: Pereira, Vivienda, recién "En análisis" (con advertencia de humedad)
with nc as (
  insert into clientes (nombre, nit) values ('Residencial Los Álamos P.H.', '900678901-0')
  returning id
), ns as (
  insert into solicitudes (cliente_id, responsable, canal_entrada, fecha_solicitud, estado, ciudad, tipo_obra, area_aprox_m2, fecha_requerida)
  select id, 'Camilo Ospina', 'Llamada', date '2026-09-15', 'En análisis', 'Pereira', 'Vivienda', 60, date '2026-10-15'
  from nc
  returning id
)
insert into historial_estados (solicitud_id, estado, fecha)
select id, e, f from ns, (values
  ('Recibida', date '2026-09-15'), ('En análisis', date '2026-09-15')
) as h(e, f);

insert into especificaciones_tecnicas (solicitud_id, superficie, ambiente, condicion, color_acabado)
select id, 'Concreto', 'Exterior', 'Con humedad', 'No estoy seguro' from solicitudes where fecha_solicitud = '2026-09-15';

insert into evidencias (solicitud_id, descripcion, observaciones, consentimiento)
select id, 'Muro exterior de casa con manchas de humedad recurrentes.', '', true
from solicitudes where fecha_solicitud = '2026-09-15';

with r as (
  insert into recomendaciones (solicitud_id, tipo_solucion, producto, acabado, cantidad_estimada, aplicacion, tiempo_estimado, estado_texto)
  select id, 'Sistema de recubrimiento para concreto', 'Recubrimiento sellador para concreto', 'Satinado (sugerido para exteriores)', '4 unidades (aprox. 60 m²)', '2 capas', '2 a 3 días', 'Recomendación preliminar'
  from solicitudes where fecha_solicitud = '2026-09-15'
  returning id
)
insert into advertencias (recomendacion_id, mensaje)
select id, 'Se detectó humedad en la superficie. Se recomienda un tratamiento previo antihumedad antes de aplicar el recubrimiento.' from r;
