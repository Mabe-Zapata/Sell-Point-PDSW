# Stock Management Specifications

## Domain: Stock Adjustment (New)

### Requirement: Adjust Stock Endpoint

PATCH `/products/:id/stock` with Bearer auth. Body: `{type: IN|OUT|ADJUSTMENT, quantity: >0, description?, referenceType?, referenceId?}`.

#### Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Happy IN | product stock=10 | PATCH type=IN qty=5 | 200, prevStock=10, newStock=15, STOCK_MOVEMENTS row created |
| 2 | Happy OUT | product stock=10 | PATCH type=OUT qty=3 | 200, prevStock=10, newStock=7, movement created |
| 3 | OUT insufficient | product stock=2 | PATCH type=OUT qty=5 | 422 InsufficientStockException, no movement created |
| 4 | ADJUSTMENT (+ delta) | product stock=10 | PATCH type=ADJUSTMENT qty=15 | 200, prevStock=10, newStock=25 |
| 5 | ADJUSTMENT (- delta) | product stock=10 | PATCH type=ADJUSTMENT qty=-5 | 200, prevStock=10, newStock=5 |
| 6 | ADJUSTMENT negative result | product stock=3 | PATCH type=ADJUSTMENT qty=-10 | 422 InsufficientStockException |
| 7 | Unauthorized | no Bearer token | any PATCH | 401 |
| 8 | Invalid type | product exists | PATCH type=PURCHASE | 400 Validation error |
| 9 | Zero quantity | product exists | PATCH qty=0 | 400 Validation error |
| 10 | Negative quantity (non-ADJUST) | product exists | PATCH type=IN qty=-5 | 400 Validation error |

### Requirement: Atomic Stock Mutation

Stock SHALL update via atomic conditional: `UPDATE products SET cur_sto_pro = cur_sto_pro + :delta WHERE id = :id AND cur_sto_pro + :delta >= 0` through TypeORM QueryBuilder. No separate read-then-write.

### Requirement: Audit Trail

Every stock change MUST create a STOCK_MOVEMENTS record with previousStock, newStock, type, quantity, productId. IN/OUT use the endpoint's type. ADJUSTMENT records the delta direction in type.

## Domain: Stock Movement History (New)

### Requirement: GET Product Movements

GET `/products/:id/movements` with Bearer auth. Query: `page`, `limit`, `type?`. Response: PaginatedResult<StockMovement> ordered by createdAt DESC.

#### Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | Paginated | product has 10 movements | GET page=1 limit=5 | 200, data length=5, total=10 |
| 2 | Filter by type | has IN and OUT movements | GET type=IN | 200, all returned type=IN |
| 3 | Empty | product has no movements | GET | 200, data=[], total=0 |
| 4 | Unauthorized | no Bearer token | GET | 401 |

## Domain: Product Creation — Initial Stock (Modified)

### Requirement: initialStock Field

CreateProductDto SHALL accept optional `initialStock?: number` (default 0, validation >= 0). CreateProductHandler SHALL set currentStock = initialStock. If initialStock > 0, SHALL create an IN StockMovement with description='Initial stock'.

#### Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | With stock | initialStock=10 | Create product | currentStock=10, STOCK_MOVEMENTS row IN with description 'Initial stock' |
| 2 | Default | no initialStock | Create product | currentStock=0, no movement |
| 3 | Negative value | initialStock=-5 | Create product | 400 validation error |
| 4 | Zero explicit | initialStock=0 | Create product | currentStock=0, no movement |

## Domain: Global Stock Levels (Modified)

### Requirement: GET Stock Levels

GET `/stock/levels` with Bearer auth. Query: `page`, `limit`, `productId?`. Response: PaginatedResult with productId and currentStock. SHOULD query MV_PRODUCT_STOCK for non-transactional reads.

#### Scenarios

| # | Scenario | Given | When | Then |
|---|----------|-------|------|------|
| 1 | All levels | 50 products exist | GET page=1 limit=20 | 200, data length=20, total=50 |
| 2 | Filter by product | product X stock=15 | GET productId=X | 200, single result with currentStock=15 |
| 3 | Empty | no products | GET | 200, data=[], total=0 |

## Domain: MV_PRODUCT_STOCK (New)

### Requirement: ViewEntity Mapping

SHOULD create a TypeORM ViewEntity mapping MV_PRODUCT_STOCK. SHOULD provide INVENTORY_QUERY_SERVICE-backed query service for stock-level reads. MUST NOT use the view for transactional queries (stock adjustment).

## Domain: Repository & Interface Fixes (Modified)

### Requirement: IProductRepository

MUST add: `incrementStock(id: string, quantity: number): Promise<void>` and fix `decrementStock(id: string, quantity: number): Promise<void>` from no-op to actual atomic UPDATE via QueryBuilder.

### Requirement: StockMovementRepository Implements IStockMovementRepository

StockMovementRepository MUST declare `implements IStockMovementRepository`. All interface methods SHALL be fully typed.

### Requirement: StockMovementTypeDb Enum

MUST include `TRANSFER_IN = 'TRANSFER_IN'` and `TRANSFER_OUT = 'TRANSFER_OUT'` to match domain enum. StockMovementTypeMapper SHALL map both directions.

## Domain: Wiring (New)

### Requirement: Module Registration

StockAdjustmentHandler, AdjustStockValidator, InventoryController SHALL be registered in app.module.ts. Controller SHALL be added to controllers array. CQRS index SHALL export new handler + validator.

## Non-functional

### Oracle Compatibility
All DB operations MUST use TypeORM QueryBuilder (not raw SQL). Boolean columns SHALL use `dbBooleanColumn` helper.

### Performance
Stock mutation SHALL be a single atomic UPDATE. Movement history and stock levels SHALL be paginated (mandatory page/limit). Indexes: `STOCK_MOVEMENTS.productId`, `STOCK_MOVEMENTS.createdAt` (existing IDX_STR_MOV_CREATED_AT).

### Idempotency
Stock adjustments are NOT idempotent by design. Each call creates a distinct StockMovement record. No deduplication.
