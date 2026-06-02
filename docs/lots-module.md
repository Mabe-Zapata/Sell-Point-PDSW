# M-01 Lots Module

## REST API

- `POST /lots`
  - Body: `productId`, `lotCode`, `quantityReceived`, `unitCost`, `receivedAt`, optional `expiresAt`.
  - Behavior: creates a lot, sets `quantityAvailable = quantityReceived`, calculates `estimatedUnitProfit`, and increments product stock.

- `GET /lots?productId={id}`
  - Returns active lots for one product ordered by `receivedAt ASC` for FIFO.

- `PATCH /lots/{id}/stock`
  - Body: `quantityAvailable`.
  - Behavior: sets the absolute available quantity and adjusts product stock by the delta.

- `DELETE /lots/{id}`
  - Soft-deletes the lot only when `quantityAvailable` is `0`.

## FIFO invoicing

When an invoice is issued, invoice items consume lots by `receivedAt ASC`.
Each allocation is stored in `INVOICE_ITEM_LOTS` with quantity, unit cost snapshot, and profit amount.
Invoice total profit is stored in `INVOICES.PRO_TOT_INV`.
