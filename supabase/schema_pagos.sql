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
