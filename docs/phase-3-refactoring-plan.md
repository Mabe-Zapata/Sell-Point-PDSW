# Phase 3 Refactoring Plan: Clean Architecture + SOLID

## Executive Summary

Phase 3 fixes the **DIP violations** and **SRP tensions** identified in the architecture analysis. The goal is to make dependencies flow correctly: application depends on domain abstractions, infrastructure implements them, and no layer knows about concrete frameworks.

**Problems to fix:**
1. Handlers import concrete repositories from `infrastructure/` instead of interfaces from `domain/`
2. `TaxCalculator` uses NestJS decorators (`@Injectable`, `@Inject`)
3. Validators do data fetching (SRP violation)
4. `CreateInvoiceHandler` is a "god class" doing too many things
5. No transactional boundary for composite use cases
6. `GenerateInvoicePdfHandler` uses concrete `PdfService` instead of `IPdfService`

**Effort:** ~3-4 days for full implementation

---

## Task Breakdown

### Task 1: DI Tokens — Dependency Injection Bridge
**Priority:** Critical | **Effort:** Low | **Dependency:** None

Create injection tokens so application layer depends on interfaces, not concretes.

**Create:** `src/application/tokens.ts`

```typescript
// Repository Tokens
export const CUSTOMER_REPOSITORY = 'CUSTOMER_REPOSITORY';
export const PRODUCT_REPOSITORY = 'PRODUCT_REPOSITORY';
export const INVOICE_REPOSITORY = 'INVOICE_REPOSITORY';
export const INVOICE_ITEM_REPOSITORY = 'INVOICE_ITEM_REPOSITORY';
export const USER_REPOSITORY = 'USER_REPOSITORY';
export const DASHBOARD_REPOSITORY = 'DASHBOARD_REPOSITORY';
// ... remaining repositories

// Service Tokens
export const PDF_SERVICE = 'PDF_SERVICE';  // already exists in pdf-service.interface.ts
export const TAX_CALCULATOR = 'TAX_CALCULATOR';
```

**Update:** `app.module.ts` — change from concrete registration to token-based:

```typescript
// BEFORE (concrete)
ProductRepository,
InvoiceRepository,

// AFTER (token + concrete mapping)
{
  provide: PRODUCT_REPOSITORY,
  useClass: ProductRepository,
},
{
  provide: INVOICE_REPOSITORY,
  useClass: InvoiceRepository,
},
```

---

### Task 2: Fix DIP in all Handlers
**Priority:** Critical | **Effort:** Medium | **Dependency:** Task 1

Update every handler that imports from `infrastructure/repositories` to import from `domain/repositories` and inject via token.

**Files to change:**

| File | Current Import | Fix |
|------|----------------|-----|
| `create-product.handler.ts` | `ProductRepository` | Inject `IProductRepository` via `PRODUCT_REPOSITORY` token |
| `update-product.handler.ts` | `ProductRepository` | Inject `IProductRepository` via `PRODUCT_REPOSITORY` token |
| `delete-product.handler.ts` | `ProductRepository` | Inject `IProductRepository` via `PRODUCT_REPOSITORY` token |
| `list-products.handler.ts` | `ProductRepository` | Inject `IProductRepository` via `PRODUCT_REPOSITORY` token |
| `get-product.handler.ts` | `ProductRepository` | Inject `IProductRepository` via `PRODUCT_REPOSITORY` token |
| `create-customer.handler.ts` | `CustomerRepository` | Inject `ICustomerRepository` via `CUSTOMER_REPOSITORY` token |
| `update-customer.handler.ts` | `CustomerRepository` | Inject `ICustomerRepository` via `CUSTOMER_REPOSITORY` token |
| `delete-customer.handler.ts` | `CustomerRepository` | Inject `ICustomerRepository` via `CUSTOMER_REPOSITORY` token |
| `list-customers.handler.ts` | `CustomerRepository` | Inject `ICustomerRepository` via `CUSTOMER_REPOSITORY` token |
| `get-customer.handler.ts` | `CustomerRepository` | Inject `ICustomerRepository` via `CUSTOMER_REPOSITORY` token |
| `create-invoice.handler.ts` | `InvoiceRepository`, `InvoiceItemRepository`, `ProductRepository` | Inject interfaces via tokens |
| `list-invoices.handler.ts` | `InvoiceRepository` | Inject `IInvoiceRepository` via token |
| `get-invoice.handler.ts` | `InvoiceRepository` | Inject `IInvoiceRepository` via token |
| `generate-invoice-pdf.handler.ts` | `InvoiceRepository`, `InvoiceItemRepository`, `PdfService` | Inject interfaces + `IPdfService` via token |

**Example transformation:**

```typescript
// BEFORE (create-product.handler.ts)
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';

constructor(
  private readonly productRepository: ProductRepository,
) {}

// AFTER
import { IProductRepository } from '../../../../../domain/repositories';
import { PRODUCT_REPOSITORY } from '../../../../tokens';

constructor(
  @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
) {}
```

---

### Task 3: Fix GenerateInvoicePdfHandler — OCP Fix
**Priority:** Critical | **Effort:** Low | **Dependency:** Task 1

The `IPdfService` interface and `PDF_SERVICE` token already exist. Just wire them correctly.

**File:** `generate-invoice-pdf.handler.ts`

```typescript
// BEFORE
import { PdfService } from '../../../../../infrastructure/services/pdf.service';
constructor(private readonly pdfService: PdfService) {}

// AFTER
import { IPdfService, PDF_SERVICE } from '../../../../services/pdf-service.interface';
constructor(@Inject(PDF_SERVICE) private readonly pdfService: IPdfService) {}
```

---

### Task 4: Remove NestJS from Domain — TaxCalculator
**Priority:** High | **Effort:** Medium | **Dependency:** None

`TaxCalculator` should be a plain TypeScript class. NestJS DI should only be in infrastructure/application layers.

**Before:** `domain/services/tax-calculator.service.ts`
```typescript
import { Injectable, Inject } from '@nestjs/common';
@Injectable()
export class TaxCalculator {
  constructor(@Inject(IVA_CONFIG) private readonly taxPercentage: number) {}
}
```

**After:** Create `domain/services/iva.config.ts`
```typescript
export const IVA_CONFIG = 'IVA_CONFIG';
```

Keep `TaxCalculator` as a simple domain service (no decorators). Register it in `app.module.ts` using the token:

```typescript
{
  provide: TAX_CALCULATOR,
  useFactory: (configService: ConfigService) => {
    const taxPercentage = configService.get<number>('tax.percentage');
    return new TaxCalculator(taxPercentage ?? 12);  // plain constructor
  },
  inject: [ConfigService],
},
```

---

### Task 5: Fix Validators — SRP
**Priority:** High | **Effort:** Medium | **Dependency:** Task 2

Validators should ONLY validate structure/format. Move data fetching to handlers.

**Pattern to eliminate:**
```typescript
// GetProductValidator — WRONG (fetches data AND validates)
@Injectable()
export class GetProductValidator {
  constructor(private readonly productRepository: ProductRepository) {}
  validate(id: string): Product {
    return this.productRepository.findById(id);  // VIOLATION
  }
}
```

**Correct pattern — validator only validates format:**
```typescript
// GetProductValidator — CORRECT (only validates input format)
@Injectable()
export class GetProductValidator {
  validate(id: string): string {
    if (!id || id.trim().length === 0) {
      throw new BadRequestException('Product id is required');
    }
    return id;
  }
}
```

**Handler fetches data:**
```typescript
async execute(query: GetProductQuery): Promise<ProductResponseDto> {
  const validId = this.validator.validate(query.id);
  const product = await this.productRepository.findById(validId);
  if (!product) throw new EntityNotFoundException('Product', query.id);
  return ProductResponseDto.from(product);
}
```

**Validators to fix (remove repository injection):**
- `get-product.validator.ts` — remove `ProductRepository` injection
- `get-customer.validator.ts` — remove `CustomerRepository` injection
- `get-invoice.validator.ts` — remove `InvoiceRepository` injection
- `list-products.validator.ts` — remove `ProductRepository` injection
- `list-customers.validator.ts` — remove `CustomerRepository` injection
- `list-invoices.validator.ts` — remove `InvoiceRepository` injection

---

### Task 6: Create Unit of Work for Transactions
**Priority:** High | **Effort:** High | **Dependency:** Tasks 1-2

`CreateInvoiceHandler` needs atomic transactions. Currently each `decrementStock()` opens its own transaction internally.

**Create:** `src/domain/services/unit-of-work.interface.ts`
```typescript
export const UNIT_OF_WORK = 'UNIT_OF_WORK';

export interface IUnitOfWork {
  start(): Promise<void>;
  complete(fn: () => Promise<void>): Promise<void>;
  rollback(): Promise<void>;
}
```

**Implement in infrastructure:** `src/infrastructure/services/typeorm-unit-of-work.ts`
- Wraps TypeORM `DataSource` transaction
- Provides `start()`, `complete(fn)`, `rollback()`

**Update `CreateInvoiceHandler`:**
```typescript
constructor(
  @Inject(UNIT_OF_WORK) private readonly unitOfWork: IUnitOfWork,
  // ... interfaces
) {}

async execute(command: CreateInvoiceCommand): Promise<Invoice> {
  let invoice: Invoice;
  
  await this.unitOfWork.complete(async () => {
    // All operations in one transaction
    const savedInvoice = await this.invoiceRepository.create(invoice);
    await this.invoiceItemRepository.createMany(items);
    for (const item of items) {
      await this.productRepository.decrementStock(item.productId, item.quantity);
    }
  });
  
  return this.invoiceRepository.findById(invoice.id);
}
```

---

### Task 7: Extract InvoiceFactory — SRP
**Priority:** Medium | **Effort:** Medium | **Dependency:** Tasks 1-2

`CreateInvoiceHandler` does too much: validates, assembles items, calculates taxes, generates number, persists.

**Create:** `src/application/factories/invoice.factory.ts`
```typescript
export interface IInvoiceFactory {
  createInvoice(params: CreateInvoiceParams): Invoice;
  createInvoiceItems(items: ItemParams[], products: Map<string, Product>): InvoiceItem[];
}

export class InvoiceFactory implements IInvoiceFactory {
  constructor(private readonly taxCalculator: TaxCalculator) {}
  
  createInvoice(params: CreateInvoiceParams): Invoice {
    // Just creates the invoice aggregate
  }
  
  createInvoiceItems(items: ItemParams[], products: Map<string, Product>): InvoiceItem[] {
    // Creates invoice items with prices from products
  }
}
```

**Handler becomes thin orchestrator:**
```typescript
async execute(command: CreateInvoiceCommand): Promise<Invoice> {
  const validated = await this.validator.validate(command.payload);
  const products = await this.productRepository.findByIds(validated.items);
  
  const invoice = this.invoiceFactory.createInvoice({
    ...validated,
    items: validated.items,
    products,
  });
  
  return this.unitOfWork.complete(() => 
    this.invoiceRepository.create(invoice)
  );
}
```

---

### Task 8: Read Models — CQRS Real Separation
**Priority:** Medium | **Effort:** Medium | **Dependency:** Tasks 1-2

Queries should use dedicated query services returning DTOs, not entity repositories.

**Create:** `src/application/queries/invoice.query-handler.ts`
```typescript
@QueryHandler(ListInvoicesQuery)
export class ListInvoicesQueryHandler implements IQueryHandler<ListInvoicesQuery> {
  constructor(
    @Inject(INVOICE_QUERY_SERVICE) private readonly queryService: IInvoiceQueryService,
  ) {}
  
  async execute(query: ListInvoicesQuery): Promise<InvoiceListResponseDto[]> {
    return this.queryService.list(query.params);  // Returns DTOs, not entities
  }
}
```

**Create query service interface:** `src/domain/query-services/invoice.query-service.interface.ts`
```typescript
export interface IInvoiceQueryService {
  list(params: ListInvoicesParams): Promise<InvoiceListResponseDto[]>;
  getById(id: string): Promise<InvoiceDetailResponseDto | null>;
}
```

**Move existing query services** from `infrastructure/queries/` to implement domain interfaces.

---

## Dependency Graph

```
[Task 1: DI Tokens] ──────────────┐
       │                          │
       ├───> [Task 2: Fix DIP] ◄──┤
       │         │                │
       ├───> [Task 3: OCP Fix]    │
       │         │                │
       └───> [Task 4: TaxCalc] ───┘
                   │
[Task 1 done] ─────┴──> [Task 5: Validators] ──> [Task 6: UnitOfWork] ──> [Task 7: InvoiceFactory]
                                                    │
                                              [Task 8: Read Models]
```

## Before/After Import Comparison

### CreateProductHandler

**BEFORE:**
```typescript
import { ProductRepository } from '../../../../../infrastructure/repositories/product.repository';
constructor(private readonly productRepository: ProductRepository) {}
```

**AFTER:**
```typescript
import { IProductRepository } from '../../../../../domain/repositories';
import { PRODUCT_REPOSITORY } from '../../../../tokens';
constructor(@Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository) {}
```

### GenerateInvoicePdfHandler

**BEFORE:**
```typescript
import { PdfService } from '../../../../../infrastructure/services/pdf.service';
constructor(private readonly pdfService: PdfService) {}
```

**AFTER:**
```typescript
import { IPdfService, PDF_SERVICE } from '../../../../services/pdf-service.interface';
constructor(@Inject(PDF_SERVICE) private readonly pdfService: IPdfService) {}
```

## Success Criteria

1. No handler imports from `infrastructure/repositories`
2. No handler imports concrete services (only interfaces)
3. `domain/services/` has zero NestJS decorators
4. Validators don't inject repositories
5. `CreateInvoiceHandler` uses unit of work for atomic transactions
6. Read queries return DTOs, not entities
7. TypeScript compiles without errors
8. All existing tests pass

## Effort Estimate

| Task | Effort | Days |
|------|--------|------|
| 1. DI Tokens | Low | 0.25 |
| 2. Fix DIP | Medium | 1.0 |
| 3. OCP Fix | Low | 0.25 |
| 4. TaxCalculator | Medium | 0.5 |
| 5. Validators | Medium | 0.5 |
| 6. Unit of Work | High | 1.0 |
| 7. InvoiceFactory | Medium | 0.5 |
| 8. Read Models | Medium | 0.5 |
| **Total** | | **3.5 days** |