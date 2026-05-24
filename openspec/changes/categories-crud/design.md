# Design: Category CRUD with Soft Delete

This document details the classes, methods, and files that will be added/modified to implement Category CRUD with Soft Delete.

## Affected Files

### 1. [MODIFY] `src/domain/repositories/category.repository.interface.ts`
Add the `softDelete` method:
```typescript
softDelete(id: string): Promise<void>;
```

### 2. [MODIFY] `src/infrastructure/repositories/category.repository.ts`
Implement `softDelete`:
```typescript
async softDelete(id: string): Promise<void> {
  await this.repo.delete(id);
}
```

### 3. [NEW] `src/application/cqrs/category/commands/delete-category/`
- `delete-category.command.ts`:
  ```typescript
  export class DeleteCategoryCommand {
    constructor(readonly id: string) {}
  }
  ```
- `delete-category.handler.ts`:
  ```typescript
  @CommandHandler(DeleteCategoryCommand)
  export class DeleteCategoryHandler implements ICommandHandler<DeleteCategoryCommand> {
    constructor(
      private readonly validator: DeleteCategoryValidator,
      @Inject(CATEGORY_REPOSITORY) private readonly categoryRepository: ICategoryRepository,
      @Inject(PRODUCT_REPOSITORY) private readonly productRepository: IProductRepository,
    ) {}

    async execute(command: DeleteCategoryCommand): Promise<void> {
      const id = this.validator.validate(command.id);
      const category = await this.categoryRepository.findById(id);
      if (!category) {
        throw new EntityNotFoundException('Category', id);
      }

      // Check if there are associated products
      const products = await this.productRepository.findAll(
        { page: 1, limit: 1 },
        { categoryId: id }
      );

      if (products.total > 0) {
        throw new BusinessRuleException('Cannot physically delete category with associated products. Deactivate it instead.');
      }

      await this.categoryRepository.softDelete(id);
    }
  }
  ```
- `delete-category.validator.ts`:
  ```typescript
  @Injectable()
  export class DeleteCategoryValidator {
    validate(id: string): string {
      if (!id) {
        throw new Error('Category ID is required');
      }
      return id;
    }
  }
  ```

### 4. [NEW] `src/application/cqrs/category/commands/activate-category/`
- Similar to `activate-product`, calls `category.activate()` and persists it via repository update.

### 5. [NEW] `src/application/cqrs/category/commands/deactivate-category/`
- Similar to `deactivate-product`, calls `category.deactivate()` and persists it via repository update.

### 6. [NEW] `src/application/dto/category/`
- `create-category.dto.ts`:
  ```typescript
  import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
  import { Transform } from 'class-transformer';

  export class CreateCategoryDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(255)
    description?: string;
  }
  ```
- `update-category.dto.ts`
- `category-response.dto.ts`

### 7. [NEW] `src/presentation/controllers/category.controller.ts`
- Registers HTTP endpoints and delegates to CQRS command/query buses.

### 8. [MODIFY] `src/application/cqrs/index.ts`
- Exports the new handlers and validators.

### 9. [MODIFY] `src/app.module.ts`
- Imports and registers the new handlers and validators.
- Registers `CategoryController`.
