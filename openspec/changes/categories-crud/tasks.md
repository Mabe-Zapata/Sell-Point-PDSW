# Tasks: Category CRUD with Soft Delete

Below is the list of implementation tasks for Category CRUD in `Sell-Point-PDSW`.

## Phase 1: Repository Enhancements
- [ ] 1.1 Add `softDelete(id: string): Promise<void>` to `ICategoryRepository` interface
- [ ] 1.2 Implement `softDelete` in `CategoryRepository` using TypeORM `this.repo.delete(id)`

## Phase 2: DTOs
- [ ] 2.1 Create `CreateCategoryDto` with validation
- [ ] 2.2 Create `UpdateCategoryDto` with validation
- [ ] 2.3 Create `CategoryResponseDto` for domain mapping

## Phase 3: CQRS Commands and Handlers
- [ ] 3.1 Create `DeleteCategoryCommand`, handler, and validator (checking for associated products first)
- [ ] 3.2 Create `ActivateCategoryCommand`, handler, and validator
- [ ] 3.3 Create `DeactivateCategoryCommand`, handler, and validator

## Phase 4: Integration
- [ ] 4.1 Export new handlers in `src/application/cqrs/index.ts`
- [ ] 4.2 Register new handlers and validators in `src/app.module.ts`
- [ ] 4.3 Create `CategoryController` with all routes
- [ ] 4.4 Export `CategoryController` in `src/presentation/controllers/index.ts`
- [ ] 4.5 Register `CategoryController` in `src/app.module.ts`

## Phase 5: Verification
- [ ] 5.1 Run tests (`npm run test`) to ensure everything compiles and test suite passes
- [ ] 5.2 Build application (`npm run build`)
