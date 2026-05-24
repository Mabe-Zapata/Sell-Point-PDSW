# Justificaciones de decisiones SDD recientes

## Resumen
Este documento deja solo la justificación de las decisiones tomadas en los últimos SDD para mantener el contexto corto y auditable.

## Decisiones y justificación

| Decisión | Justificación |
|---|---|
| Reducir el alcance al POS de facturación | El PDF evalúa venta, clientes, productos, usuarios, roles, stock, errores y factura; sucursales, bodegas y transferencias no forman parte del alcance obligatorio. |
| Mantener soft delete / desactivación lógica en clientes y productos | El proyecto necesita preservar historial, auditoría y coherencia con ventas ya registradas. |
| Conservar snapshots históricos en SaleDetail | La factura antigua debe reconstruirse totalmente con nombre, código, precio y cantidad originales. |
| Confirmar la venta como único punto de descuento de stock | El stock no debe afectarse en borrador; la regla del PDF exige descuento solo al confirmar. |
| Alinear el pago a efectivo | El requerimiento del PDF establece método de pago solo en efectivo. |
| Incluir bloqueo de usuario tras 3 intentos | El PDF lo pide como control de seguridad y agrega valor para defensa. |
| Mantener refresh tokens, recuperación de contraseña y login externo como bonus | Son requisitos opcionales que suman puntos sin reemplazar los obligatorios. |
| Preparar despliegue con Dockerfile y docker-compose local antes de cloud | Evita fallos al publicar y permite probar el stack completo antes de subirlo. |
| Usar Redis cloud y Neon para Postgres, dejando Oracle solo local | Reduce complejidad de despliegue y separa el entorno local del target cloud. |
| Priorizar búsquedas inteligentes con paginación 10/15/20/30 | Es un requisito explícito del PDF y mejora usabilidad en clientes, productos y usuarios. |
| Registrar errores en ErrorLog con reporte solo para admin | Cumple auditoría, soporte técnico y restricción de acceso por rol. |

## Nota
Los detalles de implementación se dejan en el código y en el README; este archivo conserva solo las decisiones con su motivo.
