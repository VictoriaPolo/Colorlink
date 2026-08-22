# Modelo relacional completo — Colorlink

Modela las **5 etapas del negocio** (`Necesidad → Solución técnica → Abastecimiento → Servicio → Calidad`),
aunque el frontend de cliente solo implementa la primera (ver `ARQUITECTURA.md`). El objetivo es
documentar el sistema completo, no solo la pantalla construida.

Diagrama fuente: `colorlink-modelo-completo.drawio` (18 tablas, ábrelo en [app.diagrams.net](https://app.diagrams.net)).

## Tablas por etapa

**Necesidad del cliente** (7): CLIENTE, SOLICITUD, ESPECIFICACION_TECNICA, EVIDENCIA, IMAGEN_EVIDENCIA, RECOMENDACION, ADVERTENCIA
**Solución técnica** (2): PRODUCTO, SOLUCION_TECNICA
**Abastecimiento** (4): PROVEEDOR, ORDEN_COMPRA, ORDEN_COMPRA_DETALLE, INVENTARIO
**Servicio** (2): TECNICO, SERVICIO
**Calidad** (2): CONTROL_CALIDAD, CALIFICACION_CLIENTE
**Transversal** (1): USUARIO_INTERNO

## Cambios de normalización sobre el modelo original (7 tablas)

`RECOMENDACION.producto` pasó de texto libre (`VARCHAR`) a `FK → PRODUCTO`, apoyándose en el nuevo
catálogo de productos — evita repetir el nombre de un mismo recubrimiento en cada solicitud.

## Relaciones nuevas (además de las 6 ya documentadas del modelo de Necesidad)

- PRODUCTO **1:N** RECOMENDACION — un producto puede aparecer en muchas recomendaciones.
- SOLICITUD **1:1** SOLUCION_TECNICA — cada solicitud, una vez aprobada, tiene una solución técnica oficial.
- PRODUCTO **1:N** SOLUCION_TECNICA
- USUARIO_INTERNO **1:N** SOLUCION_TECNICA — quién aprobó la solución (`aprobado_por`).
- SOLUCION_TECNICA **1:N** ORDEN_COMPRA — una solución puede requerir varias órdenes de compra.
- PROVEEDOR **1:N** ORDEN_COMPRA
- ORDEN_COMPRA **1:N** ORDEN_COMPRA_DETALLE — una orden trae varios productos (tabla puente).
- PRODUCTO **1:N** ORDEN_COMPRA_DETALLE
- PRODUCTO **1:1** INVENTARIO — cada producto tiene un único registro de stock.
- SOLICITUD **1:N** SERVICIO — una solicitud puede requerir más de una visita técnica.
- TECNICO **1:N** SERVICIO
- SERVICIO **1:1** CONTROL_CALIDAD — cada visita se inspecciona una vez.
- USUARIO_INTERNO **1:N** CONTROL_CALIDAD — quién inspeccionó (`inspector`).
- SOLICITUD **1:1** CALIFICACION_CLIENTE — el cliente califica una vez, al cierre del ciclo.

## Mermaid ER (modelo completo)

```mermaid
erDiagram
    CLIENTE ||--o{ SOLICITUD : "realiza"
    SOLICITUD ||--|| ESPECIFICACION_TECNICA : "tiene"
    SOLICITUD ||--|| EVIDENCIA : "tiene"
    EVIDENCIA ||--o{ IMAGEN_EVIDENCIA : "contiene"
    SOLICITUD ||--|| RECOMENDACION : "genera"
    RECOMENDACION ||--o{ ADVERTENCIA : "puede tener"
    PRODUCTO ||--o{ RECOMENDACION : "sugiere"
    SOLICITUD ||--|| SOLUCION_TECNICA : "se aprueba como"
    PRODUCTO ||--o{ SOLUCION_TECNICA : "define"
    USUARIO_INTERNO ||--o{ SOLUCION_TECNICA : "aprueba"
    SOLUCION_TECNICA ||--o{ ORDEN_COMPRA : "genera"
    PROVEEDOR ||--o{ ORDEN_COMPRA : "recibe"
    ORDEN_COMPRA ||--o{ ORDEN_COMPRA_DETALLE : "incluye"
    PRODUCTO ||--o{ ORDEN_COMPRA_DETALLE : "es parte de"
    PRODUCTO ||--|| INVENTARIO : "tiene stock en"
    SOLICITUD ||--o{ SERVICIO : "programa"
    TECNICO ||--o{ SERVICIO : "ejecuta"
    SERVICIO ||--|| CONTROL_CALIDAD : "se inspecciona en"
    USUARIO_INTERNO ||--o{ CONTROL_CALIDAD : "inspecciona"
    SOLICITUD ||--|| CALIFICACION_CLIENTE : "recibe"

    CLIENTE {
        int cliente_id PK
        string nombre
        string nit
    }
    SOLICITUD {
        string solicitud_id PK
        int cliente_id FK
        string responsable
        string canal_entrada
        date fecha_solicitud
        string estado
        string ciudad
        string tipo_obra
        decimal area_aprox_m2
        date fecha_requerida
    }
    ESPECIFICACION_TECNICA {
        int especificacion_id PK
        string solicitud_id FK
        string superficie
        string ambiente
        string condicion
        string color_acabado
    }
    EVIDENCIA {
        int evidencia_id PK
        string solicitud_id FK
        string descripcion
        string observaciones
        boolean consentimiento
    }
    IMAGEN_EVIDENCIA {
        int imagen_id PK
        int evidencia_id FK
        string url_archivo
        string nombre_archivo
    }
    RECOMENDACION {
        int recomendacion_id PK
        string solicitud_id FK
        int producto_id FK
        string tipo_solucion
        string acabado
        int cantidad_unidades
        string aplicacion_recomendada
        string tiempo_estimado
        string estado_texto
    }
    ADVERTENCIA {
        int advertencia_id PK
        int recomendacion_id FK
        string mensaje
    }
    PRODUCTO {
        int producto_id PK
        string nombre
        string categoria
        string unidad_medida
        decimal precio_unitario
    }
    SOLUCION_TECNICA {
        int solucion_id PK
        string solicitud_id FK
        int producto_id FK
        int aprobado_por FK
        int cantidad_definitiva
        string aplicacion
        date fecha_aprobacion
    }
    PROVEEDOR {
        int proveedor_id PK
        string nombre
        string contacto
        string telefono
        string ciudad
    }
    ORDEN_COMPRA {
        int orden_id PK
        int solucion_id FK
        int proveedor_id FK
        date fecha_orden
        date fecha_entrega_estimada
        string estado
    }
    ORDEN_COMPRA_DETALLE {
        int detalle_id PK
        int orden_id FK
        int producto_id FK
        int cantidad
        decimal precio_unitario
    }
    INVENTARIO {
        int inventario_id PK
        int producto_id FK
        string bodega
        int cantidad_disponible
        int cantidad_reservada
    }
    TECNICO {
        int tecnico_id PK
        string nombre
        string especialidad
        string telefono
    }
    SERVICIO {
        int servicio_id PK
        string solicitud_id FK
        int tecnico_id FK
        date fecha_programada
        date fecha_ejecucion
        string estado
        int duracion_estimada_horas
    }
    CONTROL_CALIDAD {
        int control_id PK
        int servicio_id FK
        int inspector FK
        date fecha_inspeccion
        string resultado
        string observaciones
    }
    CALIFICACION_CLIENTE {
        int calificacion_id PK
        string solicitud_id FK
        int puntuacion
        string comentario
        date fecha
    }
    USUARIO_INTERNO {
        int usuario_id PK
        string nombre
        string rol
        string email
    }
```

## Revisión

- 18 tablas, 20 relaciones, todas con cardinalidad justificada por el flujo real del negocio.
- Ninguna FK sin su PK correspondiente.
- Normalizado: sin campos multivaluados (fotos, advertencias, detalle de orden de compra son
  todas tablas propias en vez de columnas con listas).
- El frontend actual solo persiste las 7 tablas de "Necesidad del cliente" (ver `src/domain/solicitud/types.ts`);
  las 11 restantes documentan el resto del ecosistema para efectos de diseño y evaluación.
