# Tasks: paginated-response-contract

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~235 LoC (Slice A ~65 + Slice B ~170) |
| 400-line budget risk | Low |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 (Slice A — backend) → PR #2 (Slice B — frontend) |
| Delivery strategy | stacked-to-main (slice A first, slice B second) |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| A1 | Flatten interceptor + DTO default + contract e2e test | PR #1 | Branch from `main`; merge gate = e2e green against Postgres |
| B1 | Canonical `PaginatedList<T>` + 17 consumer cleanups | PR #2 | Branch from `main` after PR #1 merges; merge gate = `ng build` clean |

---

## Slice A — Backend (PR #1, stacked-to-main, ~65 LoC)

- [x] **T1** — Refactor `PaginationInterceptor` to flat shape
  - Files: `Sell-Point-PDSW/src/presentation/interceptors/pagination.interceptor.ts` (lines 11-21 delete, 38-58 rewrite)
  - Depends on: none
  - Done: returns `{ data, total, page, limit, totalPages }`; non-paginated values passthrough via `isPaginatedResult` guard; `PaginationMetadata` + `PaginatedResponse<T>` interfaces deleted
  - Size: small (~10 LoC)
  - Commit: `refactor(pagination): flatten response shape in interceptor`

- [x] **T2** — Update `PaginationQueryDto` default `limit: 20` → `25`
  - Files: `Sell-Point-PDSW/src/presentation/dto/pagination/pagination-query.dto.ts:18, 26`
  - Depends on: none (can run parallel to T1)
  - Done: `limit?` default is `25`; `@Max(100)` ceiling unchanged
  - Size: trivial (~1 LoC)
  - Commit: `feat(pagination): default limit to 25 per pagination spec`

- [x] **T3** — New e2e test for contract lockdown
  - Files: `Sell-Point-PDSW/test/paginated-response-contract.e2e-spec.ts` (NEW)
  - Depends on: none (write parallel to T1; only runs green after T1+T2)
  - Done: covers 11 endpoints (`/products`, `/customers`, `/categories`, `/users`, `/auth/users`, `/tax-rates`, `/invoice-series`, `/sales`, `/invoices`, `/error-logs`, `/products/:id/movements`); asserts flat shape (5 fields), `body.pagination === undefined` hard gate, `totalPages = Math.ceil(total/limit)`, default `limit=25` on `/products`, override `?limit=10`. Auth-required endpoints asserted as `401`. Mirrors setup in `pagination-validation.e2e-spec.ts:10-21`.
  - Size: medium (~40 LoC, mechanical copy-paste-modify)
  - Commit: `test(pagination): add contract lockdown e2e suite`

**Slice A commit order**: T1 and T2 can ship as one commit (or two) before T3; T3 must be the last commit on PR #1 and must fail before T1+T2 and pass after.

---

## Slice B — Frontend (PR #2, stacked-to-main AFTER slice A, ~170 LoC)

> T4 is the keystone. Land it first in PR #2 (own commit). All other T5+ tasks import from it; order them so each cleanly applies on top of T4.

- [ ] **T4** — Create canonical `PaginatedList<T>` type
  - Files: `Sell-Point-Frontend/src/presentation/shared/types/pagination.ts` (NEW, ~10 LoC)
  - Depends on: none (keystone of slice B)
  - Done: exports `interface PaginatedList<T> { data: T[]; total: number; page: number; limit: number; totalPages: number; }`
  - Size: trivial
  - Commit: `chore(shared): add canonical PaginatedList<T> type`

- [ ] **T5** — Customer datasource + domain + impl (delete nested type, flatten)
  - Files: `customer-remote.datasource.ts:24-32, 40, 92, 105-111, 128`; `domain/customer.repository.ts:16-26`; `data/customer-impl.repository.ts:15-21`
  - Depends on: T4
  - Done: delete nested `PaginatedResponse<T>` and `export {… type PaginatedResponse}`; datasource returns `PaginatedList<BackendCustomer>`; delete `CustomerPagination`; `CustomerListResult` reuses `PaginatedList<CustomerEntity>`; impl spreads flat fields
  - Size: small (~20 LoC)
  - Commit: `refactor(customers): adopt flat PaginatedList shape`

- [ ] **T6** — Customers page: read flat fields
  - Files: `customers-page.component.ts:405-408`
  - Depends on: T5
  - Done: `result.pagination.X` → `result.X` × 4; drop `Math.max(1, …)` on `totalPages`
  - Size: trivial (~4 LoC)
  - Commit: `refactor(customers): drop pagination wrapper in page component`

- [ ] **T7** — Product datasource + impl: add `totalPages`, drop `??` chains
  - Files: `product-remote-datasource.ts:45-50, 120-122, 214-216`; `product-impl.repository.ts:32-37, 75-80`
  - Depends on: T4
  - Done: `PaginatedRawDto<T>` extends with `totalPages` (or use `PaginatedList<T>`); `body.pagination?.X ?? body.X` → `body.X`; impl passes through `totalPages`
  - Size: small (~10 LoC)
  - Commit: `refactor(products): adopt flat PaginatedList shape`

- [ ] **T8** — Products page: read `totalPages` from response
  - Files: `products-page.component.ts:467, 501`
  - Depends on: T7
  - Done: drop local `Math.ceil(totalCount / pageSize)`; read from `res.totalPages` (new field on product result)
  - Size: trivial (~4 LoC)
  - Commit: `refactor(products): drop local totalPages math in page`

- [ ] **T9** — Category datasource + impl: add `totalPages`, drop `??` chains
  - Files: `category-remote-datasource.ts:16-21, 46-48`; `category-impl.repository.ts:20-25`
  - Depends on: T4
  - Done: `PaginatedRawDto<T>` extended with `totalPages` (or use `PaginatedList<T>`); `body.pagination?.X ?? body.X` → `body.X`; impl passes through `totalPages`
  - Size: small (~6 LoC)
  - Commit: `refactor(categories): adopt flat PaginatedList shape`

- [ ] **T10** — Categories page: read `totalPages` from response
  - Files: `categories-page.component.ts:431-433`
  - Depends on: T9
  - Done: drop local `Math.ceil(totalCategoriesCount / pageSize)`; read from `result.totalPages`
  - Size: trivial (~3 LoC)
  - Commit: `refactor(categories): drop local totalPages math in page`

- [ ] **T11** — Employee API service: extend type, drop `??` chains
  - Files: `employee-api.service.ts:23-28, 120-129`
  - Depends on: none (own type; no canonical-type import needed)
  - Done: `EmployeeListResponse` extended with `totalPages: number`; `body.pagination?.X ?? body.X ?? fallback` simplified to `body.X ?? fallback`
  - Size: small (~6 LoC)
  - Commit: `refactor(employees): extend EmployeeListResponse with totalPages`

- [ ] **T12** — Employees page: read `totalPages` from response
  - Files: `employees-page.component.ts:906`
  - Depends on: T11
  - Done: drop local `Math.ceil(totalCount / pageSize)`; read from new `result.totalPages` field
  - Size: trivial (~2 LoC)
  - Commit: `refactor(employees): drop local totalPages math in page`

- [ ] **T13** — Dashboard API service: extend local flat type
  - Files: `dashboard-api.service.ts:43-48`
  - Depends on: none (own type; not exported)
  - Done: `PaginatedResponse<T>` (local, lines 43-48) extended with `totalPages: number`; callers using `...res` spread inherit the new field automatically
  - Size: trivial (~1 LoC)
  - Commit: `refactor(dashboard): add totalPages to local PaginatedResponse`

- [ ] **T14** — Invoice API service: full cleanup (largest task)
  - Files: `invoice-api.service.ts:117-125, 226-227, 297, 340, 349, 360-369, 379-388, 438-453`
  - Depends on: T4
  - Done: delete nested `PaginatedResponse<T>` (117-125); delete `mapPaginated` helper (438-453); inline flat shape in 5 callers (`listInvoices`, `listInvoiceSeries`, `searchCustomers`, `fetchCustomersPage`, `searchProducts`, `fetchProductsPage`); preserve post-fetch slicing/filtering in `searchProducts`/`fetchProductsPage` (360-369, 379-388) using `...body` spread. **Candidate to split further** if reviewer finds it dense: split into T14a (delete type + `mapPaginated`, update 4 simple callers) + T14b (rewrite `searchProducts`/`fetchProductsPage` with preserved slicing).
  - Size: large (~40 LoC)
  - Commit: `refactor(invoices): drop mapPaginated helper, adopt flat shape`

- [ ] **T15** — Customer selection modal: read `res.total`
  - Files: `invoices/customer-selection-modal.component.ts:237`
  - Depends on: T14
  - Done: `res.pagination?.total ?? res.data.length` → `res.total`
  - Size: trivial (~1 LoC)
  - Commit: `refactor(invoices-modal): read flat total in customer picker`

- [ ] **T16** — Product selection modal: read `res.total`
  - Files: `invoices/product-selection-modal.component.ts:240`
  - Depends on: T14
  - Done: `res.pagination?.total ?? res.data.length` → `res.total`
  - Size: trivial (~1 LoC)
  - Commit: `refactor(invoices-modal): read flat total in product picker`

- [ ] **T17** — SSR funnel chokepoint: flatten 4 generic args + 13 `??` reads
  - Files: `shared/ssr-page-data.ts:309, 313-316, 329, 339-341, 350, 354-356, 400, 406-408`
  - Depends on: T4
  - Done: line 309 `<{…; pagination?: {…} }>` → `<PaginatedList<BackendCustomer>>`; line 329 same with `ProductRawDto`; line 350 same with `CategoryBackendDto`; line 400 `<{ data: any[]; …}>` → `<PaginatedList<EmployeeRowDto>>` (narrow `any[]`); lines 313-316/339-341/354-356 `?.pagination?.X ?? ?.X ?? fallback` → `?.X ?? fallback`; lines 406-408 same simplification for `/users`. Drop `Math.max(1, …)` on `totalPages` at 316.
  - Size: medium (~20 LoC)
  - Commit: `refactor(ssr): adopt flat PaginatedList in initial data loaders`

- [ ] **T18** — Final grep verification (no `pagination?.` left in frontend)
  - Files: frontend tree (grep)
  - Depends on: T5-T17
  - Done: `rg "body\.pagination|result\.pagination|res\.pagination|pagination\?\." Sell-Point-Frontend/src` returns 0 matches outside `tasks.md` and OpenSpec files. Also `rg "CustomerPagination"` returns 0 matches. Report any hits as follow-up tasks before merge.
  - Size: trivial
  - Commit: `chore(frontend): no remaining pagination envelope references`

**Slice B commit order**: T4 → T5/T7/T9/T11/T13 (can be parallel/independent commits) → T6/T8/T10/T12 (depend on their respective data files) → T14 → T15/T16 → T17 → T18.

---

## Cross-slice tasks

- [ ] **T19** — Update OpenSpec `proposal.md` to reflect ~235 LoC actual vs ~400 original
  - Files: `Sell-Point-PDSW/openspec/changes/paginated-response-contract/proposal.md` (if it exists by apply time)
  - Depends on: none
  - Done: numeric LoC estimate updated if proposal file is present. **Optional / low priority** — skip if proposal was never written. The design.md already documents the corrected estimate.
  - Size: trivial
  - Commit: `docs(openspec): reconcile LoC estimate in proposal`

---

## Verification tasks (run AFTER apply, NOT part of apply)

- **V1** — Backend e2e green: `npm run test:e2e -- paginated-response-contract` passes all 11 endpoint assertions; `body.pagination === undefined` is the load-bearing gate.
- **V2** — Frontend build clean: `ng build` exits 0 with no TS errors after T18.
- **V3** — Manual smoke (per design §5): with backend on `npm run start:dev`:
  - `curl -s http://localhost:3000/products | jq '{ data: (.data|length), total, page, limit, totalPages, hasPagination: (.pagination != null) }'` → `{ data: <n>, total: <n>, page: 1, limit: 25, totalPages: <ceil>, hasPagination: false }`
  - `curl -s 'http://localhost:3000/products?limit=10' | jq '{ total, limit, totalPages, hasPagination }'` → `limit: 10`
  - `curl -s http://localhost:3000/customers | jq '.pagination'` → `null`
  - `curl -s 'http://localhost:3000/products/00000000-0000-0000-0000-000000000000/movements' | jq '{ total, totalPages, hasPagination }'` → flat, no envelope

---

## Risks / open items (carried forward from design)

| # | Risk | Mitigation in tasks |
|---|------|---------------------|
| 1 | Wire-breaking window between PR #1 and PR #2 merges | T5-T17 degrade gracefully (`??` chains fall back to flat fields). Deploy PR #1 + PR #2 in same release window. Worst case = "of 1" paginator display. |
| 2 | T14 reviewer-overload (40 LoC in one task) | Marked as "candidate to split further" with T14a/T14b suggestion. Apply agent decides. |
| 3 | E2E test (T3) requires running Postgres at `localhost:5432/sellpoint` | Documented in PR #1 description; per `.env.test`. No schema migration needed. |
| 4 | `mapPaginated` deletion breaks 5 callers if inlined wrong | T14 done criteria explicit: all 5 callers do `await res.json() as PaginatedList<…>` and return body directly with mapper applied to `data`. |
| 5 | `searchProducts`/`fetchProductsPage` post-fetch slicing logic lost during cleanup | T14 done criteria explicit: preserve `.slice(0, limit)` and `filterProducts` calls; only the `pagination: {…}` construction is replaced. |
| 6 | `any` boundary narrowing in T17 line 400 (`data: any[]` → `EmployeeRowDto[]`) | May surface latent type issues — desirable, not a risk. |
| 7 | Frontend has zero `.spec.ts` files for affected consumers | T18 grep verification is the safety net; manual smoke (V3) confirms runtime behavior. |
| 8 | Proposal.md missing from disk and Engram | Not blocking — design.md and cached decisions cover scope. T19 is optional. Flag in PR #1 description. |
