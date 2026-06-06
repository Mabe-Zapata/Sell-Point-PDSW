# Reconstrucción de Ventas para Auditoría

## Problema

Al confirmar una venta, los datos del cliente y cajero se guardaban solo como IDs
(Foreign Keys). Si el cliente cambiaba su nombre o el cajero se actualizaba después,
la consulta histórica mostraba datos incorrectos.

## Solución

Agregar columnas **snapshot** en la tabla `INVOICES` para conservar los datos de
cliente y cajero al momento exacto de la venta.

Los endpoints existentes (`GET /sales/:saleId/invoice`, `GET /invoices/:id`,
`GET /invoices/:id/pdf`) ahora usan **automáticamente** los snapshots cuando
están disponibles, sin necesidad de endpoints nuevos.

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `src/domain/entities/invoice.entity.ts` | +6 propiedades snapshot |
| `src/infrastructure/database/entities/invoice.typeorm.entity.ts` | +6 columnas (`CUS_NAM_SNA`, `CUS_CED_SNA`, etc.) |
| `src/application/cqrs/invoice/commands/create-invoice/create-invoice.command.ts` | +4 parámetros |
| `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts` | Puebla los snapshots al crear la Invoice |
| `src/application/use-cases/sale/quick-confirm-sale.use-case.ts` | Pasa datos del cajero y cliente al comando |
| `src/domain/query-services/invoice.query-service.interface.ts` | +6 campos snapshot en `InvoiceListItem` |
| `src/infrastructure/queries/invoice/invoice.query.service.ts` | `invoiceSelect()` usa `COALESCE` para preferir snapshots sobre JOIN |
| `src/presentation/controllers/sale.controller.ts` | `toInvoiceResponse()` pasa snapshots al Invoice |
| `src/presentation/controllers/invoice.controller.ts` | PDF, resendEmail y findOne pasan snapshots al Invoice |
| `src/infrastructure/database/seed-massive.ts` | Seed masivo puebla snapshots al generar facturas |

## Archivos Creados

| Archivo | Propósito |
|---------|-----------|
| `src/infrastructure/database/migrations/1800000000027-AddAuditSnapshotsToInvoices.ts` | Migración: ALTER TABLE INVOICES ADD columnas |

## Flujo

```
QuickConfirmSaleUseCase
  → CreateInvoiceHandler
    → Invoice creada con snapshots
    → invoiceSelect() usa COALESCE: snapshot > JOIN
    → GET /sales/:id/invoice, GET /invoices/:id, GET /invoices/:id/pdf
      → devuelven datos congelados al momento de la venta
```
