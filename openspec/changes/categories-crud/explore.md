# Exploration Report: Categories CRUD with Soft Delete

We investigated the codebase to implement the Category CRUD endpoints in `Sell-Point-PDSW`.

## Findings

1. **Existing Domain Entities**:
   - `Category` domain entity is already implemented in [category.entity.ts](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/domain/entities/category.entity.ts).
   - It supports `activate()` and `deactivate()` methods which toggle the `_isActive` state (mapping to `isActive`).

2. **Existing Repositories**:
   - `ICategoryRepository` interface is defined in [category.repository.interface.ts](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/domain/repositories/category.repository.interface.ts).
   - `CategoryRepository` infrastructure implementation exists in [category.repository.ts](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/infrastructure/repositories/category.repository.ts) and is mapped to `CategoryTypeOrmEntity`.
   - The database entity `CategoryTypeOrmEntity` maps to table `CATEGORIES` and column `ACT_CAT` for `isActive` boolean.
   - The interface `ICategoryRepository` does **not** yet have a delete or soft delete method.

3. **Existing CQRS Handlers**:
   - Command handlers `CreateCategoryHandler` and `UpdateCategoryHandler` are already defined under [category/commands](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/application/cqrs/category/commands).
   - Query handlers `GetCategoryHandler` and `ListCategoriesHandler` are defined under [category/queries](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/application/cqrs/category/queries).
   - All these handlers are registered in [app.module.ts](file:///C:/Users/patyl/.gemini/antigravity/worktrees/Sell-Point-PDSW/implement-categories-crud-api/src/app.module.ts).

4. **Missing Components**:
   - `CategoryController` is missing under `src/presentation/controllers/`.
   - Category DTOs (`CreateCategoryDto`, `UpdateCategoryDto`, `CategoryResponseDto`) are missing under `src/application/dto/category/`.
   - There are no `delete-category`, `activate-category`, or `deactivate-category` commands/handlers in CQRS yet.

## Recommendations

1. **Delete & Soft Delete Pattern**:
   - Following the existing `DeleteProductHandler` and `DeleteCustomerHandler` patterns, we will add a `softDelete(id: string): Promise<void>` method to `ICategoryRepository` and implement it in `CategoryRepository` as a physical row delete `await this.repo.delete(id)`.
   - To align with "soft delete as we are working" (meaning deactivating the category record by setting `isActive = false`), we will also support `ActivateCategoryCommand` and `DeactivateCategoryCommand`. The controller `DELETE` endpoint can invoke `DeactivateCategoryCommand` to soft delete (deactivate) the category, or we can use `DeactivateCategoryCommand` explicitly via `@Patch(':id/deactivate')` and `@Delete(':id')` for the actual deletion.
   - Let's verify whether we should restrict deletion if the category has associated products (which is the case).
