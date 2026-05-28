# Invoice Model 1 — Implementation Plan

This plan formalizes **Model 1** for the POS: **every confirmed sale must generate its invoice automatically**. Sales remain internal business operations; invoices remain fiscal documents. The system must never ask the cashier to create an invoice manually after confirming a sale.

## Quick path

1. Keep `Sale` as the internal transaction and `Invoice` as the fiscal document.
2. Emit the invoice automatically after `Sale.CONFIRMED`.
3. Make `InvoiceSeries` exclusive to invoices and make its increment atomic.
4. Publish invoice-specific events for PDF/email/retry flows.

## Decision summary

| Topic | Decision |
|-------|----------|
| Business model | Every confirmed sale generates one invoice automatically |
| Sale numbering | Internal only, non-fiscal |
| Invoice numbering | Fiscal only, generated from `InvoiceSeries` |
| Relationship | `Sale` and `Invoice` stay separate entities, but business policy is effectively 1:1 |
| Manual button | No `Generate invoice` button after sale confirmation |
| Post-sale actions | `View invoice`, `Download PDF`, `Print`, `Resend`, `Retry issue` |

## Target flow

```text
1. Cashier confirms sale
2. System validates stock and totals
3. System persists sale as internal transaction
4. System emits SaleConfirmedEvent
5. Invoice flow consumes the event
6. System reserves next fiscal sequence from InvoiceSeries
7. System creates invoice
8. System emits InvoiceIssuedEvent
9. PDF / email / print side effects listen to InvoiceIssuedEvent
```

## What the architecture should guarantee

- A sale confirmation MUST NOT consume the fiscal counter directly.
- An invoice MUST be the only document that consumes `InvoiceSeries`.
- A sale MUST NOT end with two invoices.
- Cancelling a sale MUST cancel its invoice if it exists.
- Email/PDF side effects MUST depend on successful invoice issuance, not on sale confirmation alone.

## Current status

### Already aligned with Model 1

- `quick-confirm-sale` no longer uses `InvoiceSeries` for `saleNumber`.
- `saleNumber` is now internal and non-fiscal.
- Invoice creation uses CQRS.
- Invoice cancellation uses CQRS.
- Sale confirmation can trigger automatic invoice creation via listener.
- Sale cancellation can trigger automatic invoice cancellation via listener.

### Still missing for a production-grade Model 1

1. **Atomic fiscal sequence reservation**
2. **Consistent series selection in invoice creation**
3. **Duplicate invoice protection at handler level**
4. **Dedicated `InvoiceIssuedEvent`**
5. **Invoice email/PDF flow moved to invoice issuance event**
6. **Full-suite verification**

## Implementation phases

## Phase 1 — Lock the domain contract

### Goal
Make the model explicit: sales are internal, invoices are fiscal, and confirmation implies issuance.

### Files

- `src/domain/entities/sale.entity.ts`
- `src/domain/entities/invoice.entity.ts`
- `src/domain/events/sale-confirmed.event.ts`

### Tasks

- Keep `saleNumber` as internal-only.
- Keep `invoiceNumber` as the only fiscal number.
- Keep `SaleConfirmedEvent` focused on sale business data (`saleId`, `branchId`, `customer`, `details`, `totals`).
- Stop relying on `invoiceId` inside sale-confirmation semantics.

### Acceptance criteria

- [ ] Sale code does not assume fiscal numbering.
- [ ] Invoice code remains the only fiscal numbering owner.

## Phase 2 — Make invoice issuance authoritative

### Goal
`CreateInvoiceHandler` becomes the single authority for invoice issuance.

### Files

- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts`
- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.command.ts`
- `src/infrastructure/listeners/sale-confirmed-invoice.listener.ts`

### Tasks

- Validate that the selected series is the one actually used.
- Prevent duplicate invoice creation by checking `findBySaleId(saleId)` before issuing.
- Remove any inconsistency between `seriesId` passed in and the active series loaded by branch.

### Recommended rule

For auto-generated invoices from confirmed sales:

- the **branch** is the source of truth
- the active fiscal series for that branch is selected internally
- callers should not be able to create mismatched `seriesId` / `branchId` combinations

### Acceptance criteria

- [ ] One confirmed sale cannot create two invoices.
- [ ] The stored `seriesId` always matches the series used to generate `invoiceNumber`.

## Phase 3 — Make fiscal sequence reservation atomic

### Goal
Prevent duplicate or skipped invoice numbers under concurrency.

### Problem today

`InvoiceSeriesRepository.incrementSequence()` currently does:

1. `findOne`
2. `currentSequence += 1`
3. `save`

That is not strong enough under concurrent requests.

### Files

- `src/domain/repositories/invoice-series.repository.interface.ts`
- `src/infrastructure/repositories/invoice-series.repository.ts`

### Tasks

- Replace `find + mutate + save` with an atomic reservation strategy.
- Prefer one of these:
  - pessimistic lock in a transaction
  - DB-level atomic update returning the incremented row
- Return the reserved sequence together with series metadata needed to build `invoiceNumber`.

### Recommended API

```ts
reserveNextSequence(seriesId: string): Promise<{
  seriesId: string;
  establishmentCode: string;
  emissionPointCode: string;
  currentSequence: number;
}>;
```

### Acceptance criteria

- [ ] Two concurrent invoice issuances cannot produce the same fiscal number.
- [ ] The increment logic lives in one repository method only.

## Phase 4 — Introduce `InvoiceIssuedEvent`

### Goal
Move invoice-side effects to the invoice lifecycle instead of the sale lifecycle.

### Why

`SaleConfirmedEvent` means the sale was accepted. It does **not** guarantee invoice issuance has already succeeded.

PDF, email, print, and resend flows should react to:

```text
Invoice successfully issued
```

not to:

```text
Sale confirmed
```

### Files

- `src/domain/events/` → add `invoice-issued.event.ts`
- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts`
- `src/infrastructure/listeners/invoice-email.listener.ts`
- `src/infrastructure/listeners/order-confirmed.listener.ts` (review if still needed)

### Tasks

- Publish `InvoiceIssuedEvent` after the invoice is created successfully.
- Move invoice email/PDF side effects to `InvoiceIssuedEvent` listeners.
- Keep sale-confirmation listeners focused on sale concerns only.

### Acceptance criteria

- [ ] Invoice email is triggered only after successful invoice issuance.
- [ ] A failed invoice creation does not produce fake email/PDF side effects.

## Phase 5 — UI and API contract alignment

### Goal
Remove the conceptual need for a manual “Generate invoice” action after a confirmed sale.

### API decisions

- `POST /sales/confirm` remains the cashier action.
- The system automatically creates the invoice after a confirmed sale.
- Manual invoice creation should be either:
  - removed for POS flows, or
  - explicitly restricted to backoffice/recovery/admin use cases.

### UI decisions

Allowed actions after sale confirmation:

- `View invoice`
- `Download PDF`
- `Print`
- `Resend invoice`
- `Retry issue` (only if issuance failed and the system supports retry states)

Disallowed as standard POS action:

- `Generate invoice` manually after sale confirmation

### Acceptance criteria

- [ ] Frontend does not treat `saleNumber` as fiscal.
- [ ] Frontend exposes invoice actions, not invoice creation, after sale confirmation.

## Phase 6 — Data and schema cleanup

### Goal
Remove confusing leftovers from the old mixed-numbering model.

### Files

- `src/infrastructure/database/entities/invoice-series.typeorm.entity.ts`
- `src/domain/entities/invoice-series.entity.ts`
- `src/infrastructure/database/migrations/*`

### Tasks

- Review `sequenceNumber` because it currently exists but is not used in the fiscal sequence logic.
- Decide one of:
  - remove it
  - redefine it with a real purpose
  - document it clearly if it must remain

### Acceptance criteria

- [ ] `InvoiceSeries` fields have one clear meaning each.
- [ ] No dead or misleading sequence fields remain undocumented.

## Phase 7 — Verification and rollout

### Goal
Prove that Model 1 works end-to-end.

### Verification checklist

- [ ] Confirming one sale creates exactly one invoice.
- [ ] Confirming two concurrent sales for the same branch creates two distinct invoice numbers.
- [ ] Cancelling a sale cancels its invoice.
- [ ] `saleNumber` is internal and non-fiscal everywhere.
- [ ] `invoiceNumber` is the only fiscal-facing number.
- [ ] PDF/email depends on `InvoiceIssuedEvent`, not `SaleConfirmedEvent`.
- [ ] Full `npm run build` passes.
- [ ] Full `npm test` passes.

## Recommended implementation order

1. Fix `CreateInvoiceHandler` consistency and duplicate protection.
2. Make `InvoiceSeries` reservation atomic.
3. Introduce `InvoiceIssuedEvent`.
4. Move invoice email/PDF side effects to `InvoiceIssuedEvent`.
5. Review manual invoice creation endpoint for POS vs backoffice boundaries.
6. Clean `InvoiceSeries` schema leftovers.
7. Run full verification.

## File-by-file focus list

### Critical next files

- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts`
- `src/infrastructure/repositories/invoice-series.repository.ts`
- `src/domain/repositories/invoice-series.repository.interface.ts`
- `src/domain/events/` (new invoice-issued event)
- `src/infrastructure/listeners/invoice-email.listener.ts`

### Supporting files

- `src/presentation/controllers/invoice.controller.ts`
- `src/presentation/controllers/sale.controller.ts`
- `src/application/dto/sale/*`
- `src/application/dto/invoice/*`
- `src/infrastructure/database/entities/invoice-series.typeorm.entity.ts`

## Out of scope for this plan

- Electronic tax authority integration
- Credit note / debit note workflows
- Multi-document fiscal families beyond invoice
- Full retry/orchestration infrastructure for failed issuance

## Final recommendation

Model 1 is the right fit for this POS:

- cashier confirms sale once
- stock moves once
- invoice is emitted automatically
- fiscal sequence is consumed once
- post-sale actions operate on the issued invoice

That keeps the flow simple for operations and clean for architecture.
