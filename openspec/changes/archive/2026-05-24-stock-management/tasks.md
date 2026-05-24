# Tasks: Stock Management Features

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR (cohesive feature) |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Repository Fixes + Enum Fixes (Groundwork)

### T1 — Add incrementStock/decrementStock to IProductRepository
- **Files**: `src/domain/repositories/product.repository.interface.ts` (modify)
- **Changes**:
  - Add `incrementStock(id: string, quantity: number): Promise<void>` signature
  - Add `decrementStock(id: string, quantity: number): Promise<void>` signature
- **Dependencies**: None
- **Estimated lines**: ~5
- **Acceptance criteria**: Interface compiles with both new methods; no existing callers break.

### T2 — Implement atomic stock mutations in ProductRepository
- **Files**: `src/infrastructure/repositories/product.repository.ts` (modify)
- **Changes**:
  - Replace no-op `decrementStock(_id: number, _quantity: number)` with actual implementation using `this.repo.createQueryBuilder().update()`. Conditional: `.andWhere('"CUR_STO_PRO" >= :qty', { qty })`. Throw `InsufficientStockException` if 0 rows affected.
  - Add `incrementStock(id: string, quantity: number)` using atomic `QueryBuilder.increment()` equivalent (raw SQL expression `"CUR_STO_PRO" + :qty`).
  - Import `InsufficientStockException` from domain exceptions.
- **Dependencies**: T1
- **Estimated lines**: ~40
- **Acceptance criteria**: `incrementStock` increments stock atomically; `decrementStock` decrements only when stock ≥ quantity, throws on insufficient stock.

### T3 — StockMovementRepository explicitly implements IStockMovementRepository
- **Files**:
  - `src/infrastructure/repositories/stock-movement.repository.ts` (modify) — Add `implements IStockMovementRepository` to class declaration
  - `src/domain/repositories/stock-movement.repository.interface.ts` (modify) — Fix `findById(id: string)` → `findById(id: number)` to match domain entity type `id!: number`
- **Dependencies**: None
- **Estimated lines**: ~4
- **Acceptance criteria**: Class satisfies `IStockMovementRepository` contract; TypeScript compilation passes.

### T4 — Add TRANSFER_IN/TRANSFER_OUT to StockMovementTypeDb enum
- **Files**: `src/infrastructure/database/entities/enums/stock-movement-type.db-enum.ts` (modify)
- **Changes**:
  - Add `TRANSFER_IN = 'TRANSFER_IN'` to enum
  - Add `TRANSFER_OUT = 'TRANSFER_OUT'` to enum
- **Dependencies**: None
- **Estimated lines**: ~2
- **Acceptance criteria**: Enum includes both transfer types; StockMovementTypeMapper maps them correctly.

## Phase 2: DTOs and Commands

### T5 — Create AdjustStockDto and StockMovementResponseDto
- **Files**:
  - Create `src/application/dto/stock/adjust-stock.dto.ts` — Request DTO with `type` (StockMovementType enum), `quantity` (number), `description?` (string), `referenceType?` (string), `referenceId?` (string). Use class-validator decorators.
  - Create `src/application/dto/stock/stock-movement-response.dto.ts` — Response DTO with `fromEntity()` static factory. Fields: id, productId, type, quantity, previousStock, newStock, description?, createdAt.
- **Dependencies**: T4 (enum fix ensures StockMovementTypeDb has all types)
- **Estimated lines**: ~45
- **Acceptance criteria**: Both DTOs compile with proper decorators; `StockMovementResponseDto.fromEntity()` correctly maps a StockMovement entity.

### T6 — Create AdjustStockCommand and AdjustStockValidator
- **Files**:
  - Create `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.command.ts` — Command wrapping productId + AdjustStockDto
  - Create `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.validator.ts` — @Injectable validator: cross-field rules (IN/OUT require quantity > 0, ADJUSTMENT allows negative, zero always rejected)
- **Dependencies**: T5 (AdjustStockDto exists)
- **Estimated lines**: ~25
- **Acceptance criteria**: Command class holds productId and dto. Validator rejects invalid type/quantity combos (IN + negative qty → throws, ADJUSTMENT + qty=0 → throws).

### T7 — Create AdjustStockHandler
- **Files**:
  - Create `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.handler.ts` — @CommandHandler
- **Changes**:
  - Inject: AdjustStockValidator, @Inject(PRODUCT_REPOSITORY), @Inject(STOCK_MOVEMENT_REPOSITORY)
  - `execute(command)`: (1) validate, (2) read product (existence + previousStock), (3) compute delta (IN=+qty, OUT=-qty, ADJUSTMENT=+qty), (4) call productRepo.incrementStock or decrementStock, (5) create StockMovement with previousStock/newStock, (6) return StockMovementResponseDto
- **Dependencies**: T2 (incrementStock/decrementStock in repo), T5 (DTOs), T6 (command + validator)
- **Estimated lines**: ~55
- **Acceptance criteria**: Handler creates StockMovement for all type/quantity combos; throws InsufficientStockException when stock insufficient; returns StockMovementResponseDto with correct pre/post values.

## Phase 3: Product Creation Integration

### T8 — Add optional initialStock to CreateProductDto
- **Files**: `src/application/dto/product/create-product.dto.ts` (modify)
- **Changes**:
  - Add `@IsOptional() @IsNumber({ maxDecimalPlaces: 0 }) @Min(0) @Type(() => Number) initialStock?: number`
- **Dependencies**: None
- **Estimated lines**: ~4
- **Acceptance criteria**: DTO accepts optional initialStock field; validation rejects negative values.

### T9 — Modify CreateProductHandler to handle initialStock (and update validator)
- **Files**:
  - `src/application/cqrs/product/commands/create-product/create-product.handler.ts` (modify)
    - Inject `@Inject(STOCK_MOVEMENT_REPOSITORY) private readonly stockMovementRepo: IStockMovementRepository`
    - Change `currentStock: 0` to `currentStock: command.payload.initialStock ?? 0`
    - After `productRepository.create(product)`, if `initialStock > 0`, create IN StockMovement with description 'Initial stock'
  - `src/application/cqrs/product/commands/create-product/create-product.validator.ts` (modify)
    - Add rule: initialStock >= 0 (class-validator on DTO handles this, but add explicit rule for completeness)
- **Dependencies**: T8 (initialStock field on DTO)
- **Estimated lines**: ~25
- **Acceptance criteria**: With initialStock=10, product creates with currentStock=10 + IN movement created. With no initialStock, currentStock=0, no movement. With initialStock=0, no movement.

## Phase 4: Controller and Wiring

### T10 — Add stock adjustment and movement history endpoints to ProductController
- **Files**: `src/presentation/controllers/product.controller.ts` (modify)
- **Changes**:
  - Add `@Patch(':id/stock') adjustStock(@Param('id') id, @Body() dto: AdjustStockDto)` — executes `AdjustStockCommand(id, dto)`, returns `StockMovementResponseDto`
  - Add `@Get(':id/movements') getMovements(@Param('id') id, @Query() page, limit, type)` — executes `GetMovementsHistoryQuery(...)`, returns paginated result
  - Import AdjustStockCommand, AdjustStockDto, StockMovementResponseDto, GetMovementsHistoryQuery
- **Dependencies**: T5 (DTOs), T6 (command), T7 (handler)
- **Estimated lines**: ~65
- **Acceptance criteria**: PATCH /products/:id/stock returns 200 with StockMovementResponseDto; GET /products/:id/movements returns paginated movements.

### T11 — Update barrel exports and app.module.ts registration
- **Files**:
  - `src/application/cqrs/index.ts` (modify) — Add export for `AdjustStockHandler` and `AdjustStockValidator`
  - `src/app.module.ts` (modify) — Add `AdjustStockHandler` and `AdjustStockValidator` to `CommandHandlers` array; add import line for them
- **Dependencies**: T7 (handler), T6 (validator)
- **Estimated lines**: ~8
- **Acceptance criteria**: App module compiles with all registrations; new handlers are discoverable by CQRS bus.

## Phase 5: Testing

### T12 — Unit tests for AdjustStockHandler
- **Files**:
  - Create `src/application/cqrs/inventory/commands/adjust-stock/adjust-stock.handler.spec.ts`
- **Scenarios to cover** (from spec):
  - Happy IN: product stock=10, type=IN qty=5 → 200, prevStock=10, newStock=15, movement created
  - Happy OUT: product stock=10, type=OUT qty=3 → 200, prevStock=10, newStock=7
  - OUT insufficient: product stock=2, type=OUT qty=5 → throws InsufficientStockException
  - ADJUSTMENT +delta: product stock=10, type=ADJUSTMENT qty=15 → newStock=25
  - ADJUSTMENT -delta: product stock=10, type=ADJUSTMENT qty=-5 → newStock=5
  - ADJUSTMENT negative result: product stock=3, type=ADJUSTMENT qty=-10 → throws InsufficientStockException
- **Dependencies**: T7 (handler exists)
- **Estimated lines**: ~70
- **Acceptance criteria**: All 6 spec scenarios pass; mock repositories verify correct calls.

### T13 — Update CreateProductHandler spec with initialStock scenarios
- **Files**: `src/application/cqrs/product/commands/create-product/create-product.handler.spec.ts` (modify)
- **Scenarios to add**:
  - With initialStock=10 → product created with currentStock=10, stockMovementRepo.create called
  - No initialStock → product created with currentStock=0, stockMovementRepo.create NOT called
  - initialStock=0 → no movement created
- **Dependencies**: T9 (handler modified)
- **Estimated lines**: ~30
- **Acceptance criteria**: All 4 new scenarios pass (including the existing tests still passing).

### T14 — Update product.controller.spec.ts for new endpoints
- **Files**: `src/presentation/controllers/product.controller.spec.ts` (modify)
- **Scenarios to add**:
  - PATCH /:id/stock calls commandBus.execute with AdjustStockCommand
  - GET /:id/movements calls queryBus.execute with GetMovementsHistoryQuery
- **Dependencies**: T10 (controller endpoints exist)
- **Estimated lines**: ~35
- **Acceptance criteria**: Both new endpoint tests pass; existing tests still pass.
