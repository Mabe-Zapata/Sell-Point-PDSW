# Proposal: Stock Management Features

## Intent

Enable manual stock adjustments (add/remove) via dedicated API endpoints, with mandatory movement recording and negative-stock prevention. Stock domain artifacts exist (StockMovement entity, repo, exception, queries) but lack commands, controller, and working repository methods.

## Scope

### In Scope
1. Stock adjustment command + handler (IN/OUT/ADJUSTMENT types)
2. Initial stock setting on product creation (optional field in CreateProductDto)
3. IncrementStock & fix decrementStock in IProductRepository + ProductRepository
4. Negative-stock validation in handlers
5. Auto-record StockMovement on every stock change
6. Inventory controller (POST adjust, GET movements for a product)
7. Wire into app.module.ts (handlers, repos, controller)
8. Materialized view integration for stock-levels query (optional)

### Out of Scope
- SALE/TRANSFER stock movements (handled by sale confirmation flow)
- Warehouse-level stock tracking
- Stock alerts / reorder thresholds
- CSV import/export of stock adjustments

## Capabilities

### New Capabilities
- `stock-adjustment`: Manual add/remove stock for a product via POST with mandatory movement audit trail, negative stock prevention, and REST controller

### Modified Capabilities
- None — pure new functionality

## Approach

1. **IProductRepository**: add `incrementStock(id, quantity)` + fix `decrementStock(id, quantity)` from no-op to actual DB update via `QueryBuilder.increment()`
2. **Commands**: `AdjustStockCommand` with DTO (productId, type, quantity, reason) → handler validates stock sufficiency, creates StockMovement, updates product stock
3. **Controller**: `InventoryController` at `/products/:productId/stock` with POST for adjustments + GET for movement history
4. **DTO**: `AdjustStockDto` (class-validator), `StockMovementResponseDto`
5. **Integration**: register in app.module.ts CommandHandlers + QueryHandlers + provider tokens
6. **MV_PRODUCT_STOCK**: refresh on stock change OR use via INVENTORY_QUERY_SERVICE for GetStockLevels query

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `domain/repositories/product.repository.interface.ts` | Modified | Add incrementStock, fix decrementStock signature |
| `domain/entities/product.entity.ts` | Modified | Add adjustStock() domain method with validation |
| `domain/repositories/index.ts` | Modified | Export new types |
| `application/cqrs/inventory/commands/` | New | adjust-stock/ folder (command, handler, validator, spec) |
| `application/dto/stock/` | New | adjust-stock.dto.ts, stock-movement-response.dto.ts |
| `presentation/controllers/inventory.controller.ts` | New | REST endpoints for stock adjustment + movement history |
| `presentation/controllers/index.ts` | Modified | Export InventoryController |
| `infrastructure/repositories/product.repository.ts` | Modified | Implement incrementStock, fix decrementStock |
| `application/cqrs/index.ts` | Modified | Export new handlers |
| `app.module.ts` | Modified | Register controller, handlers, validator |

## Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Race conditions on concurrent stock adjustments | Low | Use TypeORM QueryBuilder.increment() which is atomic; add optimistic locking later if needed |
| Movement record and stock update get out of sync | Low | Wrap in a single transaction (QueryRunner) |
| Negative stock reaches DB despite validation | Low | Add DB CHECK constraint on CUR_STO_PRO as defense-in-depth |
| Breaking currentStock=0 assumption in CreateProduct | Low | Make initialStock optional with default 0; no existing client change needed |

## Rollback Plan

- Revert app.module.ts changes, remove InventoryController from registration, delete new command files
- Existing ProductController and product creation are unchanged; no migration needed
- No data loss: new STOCK_MOVEMENT rows are additive and harmless if unused

## Dependencies

- None. Everything needed exists in the codebase already (entity, repo interface, exceptions, TypeORM entities, query handlers)

## Success Criteria

- [ ] POST /products/:id/stock with IN type creates movement + increments product stock
- [ ] POST /products/:id/stock with OUT type validates sufficient stock before decrementing
- [ ] POST /products/:id/stock with insufficient stock returns InsufficientStockException
- [ ] Every stock change creates a row in STOCK_MOVEMENTS with correct pre/post stock values
- [ ] GET /products/:id/movements returns paginated history for that product
- [ ] CreateProduct accepts optional initialStock field; when provided, creates an IN movement
- [ ] All changes covered by handler unit tests + controller integration tests
