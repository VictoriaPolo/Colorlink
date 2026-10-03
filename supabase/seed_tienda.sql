-- Datos semilla de la tienda. Aplicar después de schema_tienda.sql.
-- Mismos productos/kits que src/data/repositories/tiendaRepository.local.ts
-- (mantener sincronizados a mano si se agregan más).

insert into productos (nombre, categoria, descripcion, precio, unidad_medida, destacado, badge, rendimiento_m2_por_galon) values
  ('Viniltex', 'Interiores', 'Pintura vinílica de interior, bajo olor y alta cubrición.', 145900, 'Galón', false, 'Más vendida en interiores', 30),
  ('Koraza 5 Años Protección Total', 'Fachadas y exteriores', 'Pintura elastomérica exterior antihongos con máxima resistencia a la intemperie y rayos UV.', 142900, 'Galón', true, 'Más vendido en fachadas', 22),
  ('Aquablock Fibratado', 'Impermeabilizantes', 'Impermeabilizante elastomérico reforzado con fibras para losas, cubiertas y terrazas transitables.', 139900, 'Galón', true, 'Máxima impermeabilidad', 12),
  ('Pintulux 3 en 1 Anticorrosivo + Esmalte', 'Esmaltes y metales', 'Transforma el óxido, protege el metal y entrega acabado brillante duradero en 1 solo paso.', 124900, 'Galón', true, 'Directo al óxido', 28),
  ('Masilla Elastomérica + Koraza', 'Fachadas y exteriores', 'Masilla acrílica flexible para sello de fisuras y juntas con movimiento en exteriores.', 68900, 'Galón', true, null, 15),
  ('Madetec Protector para Madera', 'Fachadas y exteriores', 'Protector y sellador para madera interior y exterior, resistente a la intemperie.', 98900, 'Galón', false, null, 20),
  ('Vinilico Concreto', 'Interiores', 'Recubrimiento vinílico sellador para superficies de concreto y mampostería.', 89900, 'Galón', false, null, 25),
  ('Viniltex Multiuso', 'Interiores', 'Pintura multipropósito para interiores, ideal para primeros proyectos.', 79900, 'Galón', false, null, 30);

insert into kits (patologia, nombre, descripcion, componentes, precio_estimado, descuento_pct) values
  ('Fachada exterior', 'Fachada Exterior con Fisuras y Lluvia', 'Tratamiento integral de sellado elástico y acabado hidrófugo con Koraza 5 Años. Resistente a rayos UV, hongos y polvo.', array['Masilla Elastomérica', 'Sellador Antialcalino', 'Koraza 5 Años'], 1087700, 12),
  ('Humedad y moho', 'Control de Humedad y Moho en Muros', 'Impermeabilización y tratamiento antihongos para muros con manchas de humedad recurrente, con Aquablock Fibratado.', array['Estuco impermeabilizante', 'Aquablock Fibratado', 'Sellador antihongos'], 620000, 10),
  ('Goteras y terrazas', 'Impermeabilización de Terrazas Transitables', 'Sistema completo para techos y terrazas con tránsito, resistente a encharcamiento y rayos UV.', array['Imprimante asfáltico', 'Aquablock Fibratado', 'Manto reforzado'], 950000, 8),
  ('Metales oxidados', 'Recuperación de Rejas y Metales Oxidados', 'Convierte el óxido, protege y da acabado brillante duradero en un solo sistema.', array['Convertidor de óxido', 'Pintulux 3 en 1'], 340000, 15);
