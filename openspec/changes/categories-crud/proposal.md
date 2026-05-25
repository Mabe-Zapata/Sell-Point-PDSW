# Proposal: Category CRUD with Soft Delete

This proposal outlines the implementation of the Category CRUD endpoints in `Sell-Point-PDSW`, aligning with existing Clean Architecture and CQRS patterns.

## Proposed Components

### 1. Repository Enhancements
- Add `softDelete(id: string): Promise<void>` to `ICategoryRepository` interface.
- Implement `softDelete(id: string)` in `CategoryRepository` using TypeORM `this.repo.delete(id)`.

### 2. New CQRS Commands & Handlers
- **DeleteCategory**:
  - `DeleteCategoryCommand(id: string)`
  - `DeleteCategoryHandler`: Injects `ICategoryRepository` and `IProductRepository`. It checks if any products are associated with the category. If yes, it throws a `BusinessRuleException` ("Cannot physically delete category with associated products. Deactivate it instead."). If not, it physically deletes it using `categoryRepository.softDelete(id)`.
  - `DeleteCategoryValidator`
- **ActivateCategory**:
  - `ActivateCategoryCommand(id: string)`
  - `ActivateCategoryHandler`: Injects `ICategoryRepository`, calls `category.activate()`, and persists via `categoryRepository.update(category)`.
  - `ActivateCategoryValidator`
- **DeactivateCategory**:
  - `DeactivateCategoryCommand(id: string)`
  - `DeactivateCategoryHandler`: Injects `ICategoryRepository`, calls `category.deactivate()`, and persists via `categoryRepository.update(category)`.
  - `DeactivateCategoryValidator`

### 3. DTOs
Create the following DTOs in `src/application/dto/category`:
- `CreateCategoryDto`: `name` (required, non-empty string), `description` (optional string)
- `UpdateCategoryDto`: `name` (optional), `description` (optional), `isActive` (optional)
- `CategoryResponseDto`: Maps `Category` domain entity to Swagger/HTTP response, returning `id`, `name`, `description`, `isActive`, `createdAt`, and `updatedAt`.

### 4. Controller
Create `CategoryController` (`src/presentation/controllers/category.controller.ts`) with endpoints:
- `POST /categories` -> `CreateCategoryCommand`
- `GET /categories/:id` -> `GetCategoryQuery`
- `GET /categories` -> `ListCategoriesQuery` (with paginated results, and filtering by query `q` and `isActive`)
- `PUT /categories/:id` -> `UpdateCategoryCommand`
- `DELETE /categories/:id` -> `DeleteCategoryCommand`
- `PATCH /categories/:id/activate` -> `ActivateCategoryCommand`
- `PATCH /categories/:id/deactivate` -> `DeactivateCategoryCommand`

All routes will be secured with `@ApiBearerAuth('access-token')` and `@UseGuards(JwtAuthGuard)` by registering them in AppModule.
