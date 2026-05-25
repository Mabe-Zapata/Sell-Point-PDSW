# Design: Stock Management Features

## Technical Approach

Add stock adjustment commands and queries following existing CQRS pattern (Handler + Validator + Command/Query class). Extend ProductController for product sub-resources (`/products/:id/stock`, `/products/:id/movements`). New InventoryController for global `/stock/levels`. Stock mutation via atomic TypeORM QueryBuilder conditional UPDATE (`SET cur_sto_pro = cur_sto_pro + :delta WHERE id = :id AND cur_sto_pro + :delta >= 0`). StockMovement record created separately after atomic UPDATE (no explicit transaction — single-statement atomicity is sufficient; documented risk). MV_PRODUCT_STOCK deferred to follow-up; first iteration reads from PRODUCTS table.

## Architecture Decisions

| # | Decision | Choice | Alternatives | Rationale |
|---|----------|--------|-------------|-----------|
| D1 | Where stock adjustment logic lives | Application handler (AdjustStockHandler) orchestrates; repository does atomic SQL | Domain service, All-in-repository | Existing CQRS pattern handles orchestration; repository owns infrastructure-specific atomic UPDATE; handler holds business validation (OUT type sufficiency check) |
| D2 | Controller for stock endpoints | ProductController gets `PATCH :id/stock` + `GET :id/movements`; new InventoryController gets `GET /stock/levels` | Single InventoryController at separate base path | `/products/:id/stock` is a product sub-resource, follows existing pattern; `/stock/levels` is global and needs own base path |
| D3 | Transactional boundary | No explicit transaction; atomic conditional UPDATE for stock, then INSERT movement separately | QueryRunner transaction wrapping both | Single UPDATE is atomic at database level (race-condition safe). Movement INSERT failure after stock change is acceptable risk — stock value is correct; audit gap is detectable. Existing codebase has no transaction patterns. |
| D4 | Product entity mutability | Keep anemic; no `adjustStock()` method | Add domain mutation | Product entity is all `readonly` after construction; mutation breaks the existing pattern. Business validation lives in handler/validator. |
| D5 | MV_PRODUCT_STOCK for stock levels | Deferred; first iteration uses productRepository.findAll | ViewEntity + QueryService | Spec says "SHOULD" not "MUST". No evidence MV exists in DB schema. productRepository works now; MV can be added as optimization later. |

## Data Flow

### Stock Adjustment Flow (PATCH /products/:id/stock)

```
Client ──PATCH /products/:id/stock──→ ProductController.adjustStock()
                                            │
                                    CommandBus.execute()
                                            │
                                    AdjustStockHandler.execute()
                                            │
                                    ┌───────┴───────┐
                                    │                │
                              Validator           Valid? ──No──→ 400
                              validates            │
                              type, qty,           Yes
                              sufficiency           │
                                    ┌───────────────┘
                                    │
                            productRepository
                            .decrementStock(id, qty)
                            OR .incrementStock(id, qty)
                              (atomic conditional WHERE)
                                    │
                              affected=0? ──Yes──→ InsufficientStockException (422)
                                    │
                                    No
                              (stock updated)
                                    │
                            stockMovementRepository
                            .create({ productId, type,
                              quantity, previousStock,
                              newStock, description })
                                    │
                              ┌─────┘
                              │
                        Return StockMovementResponseDto (200)
```

### Product Creation with Initial Stock Flow

```
Client ──POST /products──→ ProductController.create()
                                  │
                          CreateProductHandler.execute()
                                  │
                          product: new Product({currentStock: initialStock ?? 0})
                                  │
                          productRepository.create(product)
                                  │
                          initialStock > 0? ──No──→ return product
                                  │
                                  Yes
                                  │
                          stockMovementRepository.create({
                            productId: product.id,
                            type: IN, quantity: initialStock,
                            previousStock: 0, newStock: initialStock,
                            description: 'Initial stock'
                          })
                                  │
                            return product
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/repositories/product.repository.interface.ts` | Modify | Add `incrementStock(id, qty)` and `decrementStock(id, qty)` signatures |
| `src/infrastructure/repositories/product.repository.ts` | Modify | Implement both methods via QueryBuilder.update().where() with conditional |
| `src/infrastructure/repositories/stock-movement.repository.ts` | Modify | Add explicit `implements IStockMovementRepository` to class declaration |
| `src/infrastructure/database/entities/enums/stock-movement-type.db-enum.ts` | Modify | Add `TRANSFER_IN = 'TRANSFER_IN'` and `TRANSFER_OUT = 'TRANSFER_OUT'` to StockMovementTypeDb |
| `src/application/dto/product/create-product.dto.ts` | Modify | Add `@IsOptional() @IsNumber() @Min(0) @Type(() => Number) initialStock?: number` |
| `src/application/cqrs/product/commands/create-product/create-product.handler.ts` | Modify | Accept initialStock in constructor; inject STOCK_MOVEMENT_REPOSITORY; create IN movement if > 0 |
| `src/application/cqrs/product/commands/create-product/create-product.validator.ts` | Modify | Add initialStock validation (>= 0) |
| `src/application/dto/stock/adjust-stock.dto.ts` | Create | Request DTO: type, quantity, description?, referenceType?, referenceId? |
| `src/application/dto/stock/stock-movement-response.dto.ts` | Create | Response DTO: maps StockMovement entity fields |
| `src/application/dto/stock/index.ts` | Create | Barrel export |
| `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.command.ts` | Create | Command class |
| `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.handler.ts` | Create | Handler: validates → atomic stock update → movement creation |
| `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.validator.ts` | Create | Validates type + quantity cross-field rules (negatives only for ADJUSTMENT) |
| `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.handler.spec.ts` | Create | Unit test handler |
| `src/application/cqrs/index.ts` | Modify | Export AdjustStockHandler + AdjustStockValidator |
| `src/presentation/controllers/product.controller.ts` | Modify | Add `@Patch(':id/stock')` and `@Get(':id/movements')` endpoints |
| `src/presentation/controllers/product.controller.spec.ts` | Modify | Add tests for new endpoints |
| `src/presentation/controllers/index.ts` | Modify | Export InventoryController |
| `src/app.module.ts` | Modify | Register AdjustStockHandler, AdjustStockValidator, InventoryController |

## Component Design

### IProductRepository (modified interface)
- `incrementStock(id: string, quantity: number): Promise<void>` — atomic increment
- `decrementStock(id: string, quantity: number): Promise<void>` — atomic decrement with conditional `AND cur_sto_pro - :quantity >= 0`
- Both throw if 0 rows affected (stock insufficient or product not found)

### ProductRepository (modified implementation)
- `incrementStock`: `this.repo.createQueryBuilder().update(ProductTypeOrmEntity).set({ currentStock: () => `"CUR_STO_PRO" + :qty` }).where("id = :id", { id }).execute()`
- `decrementStock`: Same approach with `"CUR_STO_PRO" - :qty` and `.andWhere('"CUR_STO_PRO" >= :qty', { qty })`
- Fix current signature from `(id: number, qty: number)` to `(id: string, qty: number)`

### StockMovementRepository (modified)
- Add `implements IStockMovementRepository` to class declaration
- No method changes needed — all interface methods already exist with correct signatures

### AdjustStockCommand (new)
```
class AdjustStockCommand {
  constructor(
    public readonly productId: string,
    public readonly dto: AdjustStockDto,
  ) {}
}
```

### AdjustStockHandler (new)
```
@CommandHandler(AdjustStockCommand)
class AdjustStockHandler implements ICommandHandler<AdjustStockCommand> {
  constructor(
    private readonly validator: AdjustStockValidator,
    @Inject(PRODUCT_REPOSITORY) private readonly productRepo: IProductRepository,
    @Inject(STOCK_MOVEMENT_REPOSITORY) private readonly movementRepo: IStockMovementRepository,
  ) {}

  async execute(command: AdjustStockCommand): Promise<StockMovement> {
    // 1. Validate (type × quantity cross-rules)
    // 2. Read current product (for previousStock + existence check)
    // 3. Compute delta: IN=+qty, OUT=-qty, ADJUSTMENT=+qty (qty can be negative)
    // 4. Apply atomic stock update (repository handles conditional)
    // 5. Create StockMovement with previousStock & newStock
    // 6. Return movement
  }
}
```

### AdjustStockValidator (new)
```
@Injectable()
class AdjustStockValidator {
  validate(dto: AdjustStockDto): void {
    // qty !== 0
    // for IN/OUT: qty > 0
    // for ADJUSTMENT: any non-zero
  }
}
```

### AdjustStockDto (new)
```
class AdjustStockDto {
  @IsEnum(StockMovementType)
  type: StockMovementType;          // IN | OUT | ADJUSTMENT

  @IsNumber()
  @IsNotEmpty()
  quantity: number;                 // validated by type in validator

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  referenceType?: string;

  @IsString()
  @IsOptional()
  referenceId?: string;
}
```

### StockMovementResponseDto (new)
```
class StockMovementResponseDto {
  id: number; productId: string; type: string;
  quantity: number; previousStock: number; newStock: number;
  description?: string; createdAt: Date;

  static fromEntity(entity: StockMovement): StockMovementResponseDto
}
```

### CreateProductDto (modified)
Add: `@IsOptional() @IsNumber() @Min(0) @Type(() => Number) initialStock?: number`

### CreateProductHandler (modified)
- Inject `@Inject(STOCK_MOVEMENT_REPOSITORY)`
- Set `currentStock: command.payload.initialStock ?? 0`
- After product creation, if initialStock > 0:
  ```
  await this.stockMovementRepo.create(new StockMovement({
    productId: product.id, type: StockMovementType.IN,
    quantity: command.payload.initialStock,
    previousStock: 0, newStock: command.payload.initialStock,
    description: 'Initial stock',
  }));
  ```

### StockMovementTypeDb (modified enum)
Add: `TRANSFER_IN = 'TRANSFER_IN'`, `TRANSFER_OUT = 'TRANSFER_OUT'`

## Interface Contracts

### PATCH /products/:id/stock
**Request:**
```json
{
  "type": "IN" | "OUT" | "ADJUSTMENT",
  "quantity": 5,
  "description": "Restock from supplier",
  "referenceType": "PURCHASE_ORDER",
  "referenceId": "PO-123"
}
```
**Response (200):**
```json
{
  "id": 42,
  "productId": "uuid",
  "type": "IN",
  "quantity": 5,
  "previousStock": 10,
  "newStock": 15,
  "description": "Restock from supplier",
  "createdAt": "2026-05-24T20:00:00.000Z"
}
```
**Errors:** 400 (validation), 404 (product not found), 422 (InsufficientStockException)

### GET /products/:id/movements
**Query:** `?page=1&limit=20&type=IN`

**Response (200):**
```json
{
  "data": [{ "id": 42, "productId": "uuid", ... }],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

### GET /stock/levels
**Query:** `?page=1&limit=20&productId=uuid`

**Response (200):**
```json
{
  "data": [{ "productId": "uuid", "currentStock": 15 }],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

## Database Considerations

| Operation | PostgreSQL | Oracle | Mechanism |
|-----------|-----------|--------|-----------|
| Stock increment | `UPDATE "PRODUCTS" SET "CUR_STO_PRO" = "CUR_STO_PRO" + :qty WHERE "id" = :id` | Same via QueryBuilder (quotes handled by TypeORM dialect) | `repo.createQueryBuilder().update().set({ currentStock: () => `"CUR_STO_PRO" + :qty` })` |
| Stock decrement (conditional) | Same with `AND "CUR_STO_PRO" >= :qty` | Same | `.andWhere('"CUR_STO_PRO" >= :qty')` |
| Movement insert | INSERT via `repo.save()` | Same | `stockMovementRepo.create()` |
| Pagination | `skip/take` (LIMIT/OFFSET) | Same via QueryBuilder | Existing pattern in all repositories |

No raw SQL used; all operations go through TypeORM QueryBuilder for cross-dialect compatibility.

## Performance Strategy

1. **Atomic stock UPDATE**: Single SQL statement eliminates read-then-write race condition. No explicit lock needed.
2. **Pagination mandatory**: `page` and `limit` required on all list endpoints. No unbounded queries.
3. **Index coverage**: `STOCK_MOVEMENTS.productId` (FK column) implicitly indexed by FK; `IDX_STR_MOV_CREATED_AT` already exists for ordering.
4. **No N+1**: Movement queries filter by productId directly (no relation loading).
5. **Future optimization**: MV_PRODUCT_STOCK ViewEntity for stock-level reads shifts load from transactional PRODUCTS table to read-optimized view.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit - AdjustStockHandler | Happy paths (IN/OUT/ADJUSTMENT), insufficient stock, validation errors | Mock both repositories + validator; verify repository calls, verify StockMovement values (previousStock, newStock) |
| Unit - CreateProductHandler (modified) | initialStock > 0 creates movement, initialStock=0/undefined skips movement | Mock both repositories; verify stockMovementRepo.create called conditionally |
| Unit - AdjustStockValidator | type+quantity cross-field rules (negative only for ADJUSTMENT, zero always fails) | Direct validator instantiation |
| Unit - ProductRepository (modified) | incrementStock/decrementStock produce correct QueryBuilder SQL (Oracle + PG) | Integration test with test DB or verify query output |
| Integration - ProductController | PATCH :id/stock returns 200/422/404, GET :id/movements returns paginated | Use TestingModule with mocked CommandBus/QueryBus (existing pattern) |
| Integration - InventoryController | GET /stock/levels returns paginated results | Same as above |

## Implementation Order

1. **Repository fixes** — incrementStock/decrementStock in IProductRepository + ProductRepository; StockMovementRepository implements; StockMovementTypeDb enum fix
2. **DTOs** — AdjustStockDto, StockMovementResponseDto, CreateProductDto (add initialStock)
3. **AdjustStockCommand + AdjustStockValidator** — Command class + validator logic
4. **AdjustStockHandler** — Orchestration with both repositories + atomic stock mutation
5. **CreateProductHandler modification** — Inject movement repo, handle initialStock
6. **Controller endpoints** — ProductController (stock + movements), InventoryController (levels)
7. **Barrel exports + app.module.ts wiring** — Register all new providers, handlers, controller
8. **Tests** — Handler spec, controller spec update, validator spec

## Open Questions

- [ ] MV_PRODUCT_STOCK: Does the materialized view exist in the database? If not, creating it is a separate DBA task. First iteration uses PRODUCTS table.
- [ ] QueryRunner transaction: Should the pair (stock update + movement create) be wrapped in a transaction for stronger guarantees? Current design says no, but team should evaluate.
- [ ] INVENTORY_QUERY_SERVICE token exists but has no provider — should we implement a dedicated query service for stock levels now, or defer to MV task?
