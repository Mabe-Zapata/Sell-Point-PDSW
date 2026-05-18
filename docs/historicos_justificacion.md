# Justificación de Tablas de Históricos

## 1. sales_history - Histórico de Ventas

### Propósito
Almacenar todas las ventas confirmadas o canceladas de forma permanente. **No se eliminan registros** — solo se migran a esta tabla cuando una venta deja de estar activa en la tabla principal `sales`.

### Justificación Técnica

| Aspecto | Justificación |
|---------|----------------|
| **Retención permanente** | Las ventas son evidencia contable y legal. La normativa fiscal exige conservación de transacciones comerciales por períodos que pueden superar los 5-10 años. |
| **No eliminación** | Eliminar ventas implica pérdida de trazabilidad financiera. Una venta cancelada sigue siendo relevante para auditoría. |
| **Indices en original_sale_id** | Permite buscar rápidamente una venta histórica a partir de su ID original en el sistema activo. |
| **Indices en original_created_at** | Facilita reportes y consultas por rango de fechas para análisis de ventas históricas. |
| **Campos original_sale_id y original_created_at** | Preservan la identidad y временнуюstamp original de la venta, ya que en la tabla principal estos datos podrían cambiar o eliminarse. |

### Justificación de Negocio

- **Auditoría contable**: Permite reconstruir el estado financiero de cualquier período pasado.
- **Reporte de ventas**: Facilita análisis de tendencias históricos por sucursal, cliente o cajero.
- **Cumplimiento fiscal**: La retención de ventas confirmadas/canceladas es requisito para emittedores de facturación electrónica (SRI en Ecuador).
- **Resolución de disputas**: Un cliente puede reclamar una compra meses después; el histórico permite verificar la transacción.

### Campos Clave

| Campo | Rol |
|-------|-----|
| `original_sale_id` | Referencia a la venta original en tabla `sales` |
| `status` | Estado final (CONFIRMED, CANCELLED) |
| `original_created_at` | Fecha original de la venta — no modificable |
| `moved_at` | Fecha de migración al histórico — para auditoría del proceso |

---

## 2. error_logs - Registro de Errores

### Propósito
Registrar todos los errores del sistema para auditoría, debugging y monitoreo de salud del sistema.

### Justificación Técnica

| Aspecto | Justificación |
|---------|----------------|
| **Traza completa (stack_trace)** | Permite reproducir y diagnosticar errores en producción sin acceso directo al servidor. |
| **Tipos de exception predefinidos** | Clasifica errores: VALIDATION_ERROR, DATABASE_ERROR, AUTHENTICATION_ERROR, AUTHORIZATION_ERROR, BUSINESS_RULE_ERROR, EXTERNAL_SERVICE_ERROR, UNEXPECTED_ERROR. Facilita filtrado y alertas. |
| **Origen (source)** | Identifica el componente donde ocurrió: servicio, controlador, middleware, etc. |
| **Usuario relacionado (user_id)** | Vincula el error a un usuario específico cuando aplica, útil para errores de permisos o validación. |
| **Índices en exception_type y created_at** | Permite generar reportes de errores por tipo y período. |

### Justificación de Negocio

- **Monitoreo de errores**: Detectar patrones de fallos recurrentes antes de que afecten a múltiples usuarios.
- **SLA y uptime**: Métricas de errores por período ayudan a cumplir objetivos de disponibilidad.
- **Auditoría de seguridad**: Errores de AUTHENTICATION_ERROR o AUTHORIZATION_ERROR pueden indicar intentos de acceso no autorizado.
- **Debugging en producción**: El stack_trace permite resolver incidentes sin reproducir el entorno.
- **Cumplimiento**: Algunos sectores requieren registro de incidentes de seguridad.

### Campos Clave

| Campo | Rol |
|-------|-----|
| `message` | Descripción legible del error (500 caracteres máx). |
| `exception_type` | Clasificación del error — habilita alertas automáticas por tipo. |
| `stack_trace` | Traza completa para diagnóstico profundo. |
| `source` | Componente donde ocurrió el error. |
| `user_id` | Usuario asociado (cuando el error ocurrió en contexto de usuario). |
| `created_at` | Timestamp del error — para correlación temporal y analytics. |

---

## Resumen

| Tabla | Razón Principal |
|-------|------------------|
| **sales_history** | Cumplimiento contable/fiscal y auditoría de transacciones |
| **error_logs** | Monitoreo de salud del sistema, debugging y auditoría de seguridad |

Ambas tablas comparten el patrón de **almacenamiento inmutable**: no se actualizan ni eliminan registros. Esto garantiza la integridad del historial para propósitos de auditoría y análisis retrospectivo.