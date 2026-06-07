# Implementación SB-09 y SB-13: Paginación y Rate Limiting

## Descripción

Implementación de dos historias de usuario del Sprint 9:

- **SB-09**: Validación de paginación con `@Min(1)` y `@Max(100)` en todos los DTOs de query con paginación
- **SB-13**: Rate Limiting en `POST /auth/login` con `@nestjs/throttler` (5 intentos por IP cada 60 segundos)

---

## Cambios realizados

### SB-09 — Paginación con validaciones

**Archivo**: `src/presentation/dto/pagination/pagination-query.dto.ts` (nuevo)

DTO reutilizable para todos los endpoints paginados con las siguientes validaciones:
- `@Min(1)` en page y limit
- `@Max(100)` en limit
- Mensajes descriptivos en español para errores de validación

**Archivos modificados** (9 controllers):

| Controller | Endpoints actualizados |
|------------|----------------------|
| `product.controller.ts` | `GET /products`, `GET /products/:id/movements` |
| `customer.controller.ts` | `GET /customers` |
| `category.controller.ts` | `GET /categories` |
| `invoice.controller.ts` | `GET /invoices` |
| `sale.controller.ts` | `GET /sales` |
| `user.controller.ts` | `GET /users` |
| `auth.controller.ts` | `GET /auth/users` |
| `invoice-series.controller.ts` | `GET /invoice-series` |
| `error-log.controller.ts` | `GET /error-logs` |

---

### SB-13 — Rate Limiting en login

**Archivo**: `src/presentation/guards/login-throttler.guard.ts` (nuevo)

Guard que extiende `ThrottlerGuard` con:
- Tracking por dirección IP
- Límite: 5 intentos por IP cada 60 segundos
- Mensaje de error en español: "Demasiados intentos de inicio de sesión. Por favor, espera 60 segundos antes de intentarlo de nuevo."

**Archivo**: `src/app.module.ts`

Configuración de `ThrottlerModule`:
```typescript
ThrottlerModule.forRoot([
  {
    name: 'login',
    ttl: 60000,  // 60 segundos
    limit: 5,    // 5 intentos
  },
]),
```

**Archivo**: `src/presentation/controllers/auth.controller.ts`

Aplicado `@UseGuards(LoginThrottlerGuard)` en:
- `POST /auth/login`

---

## Notas técnicas

- La configuración de throttle aplica **solo** a `POST /auth/login`. Otros endpoints (`/auth/login-google`, `/auth/refresh`, etc.) **no** tienen throttle.
- El throttle es por IP, cubriendo el escenario de emails inexistentes (atacante no puede distinguir entre email inexistente y contraseña incorrecta sin first hacer brute force del password).
- Los guards `JwtAuthGuard` y `RolesGuard` ya están registrados globalmente en `app.module.ts` como `APP_GUARD`.
- Se respetó el patrón existente del proyecto para la configuración del throttler.

---

## Archivos nuevos

```
src/presentation/dto/pagination/
├── pagination-query.dto.ts
└── pagination-query.dto.spec.ts

src/presentation/guards/
├── login-throttler.guard.ts
└── login-throttler.guard.spec.ts

test/
├── pagination-validation.e2e-spec.ts
└── auth-rate-limit.e2e-spec.ts
```

---

## Archivos modificados

### Controllers (9 archivos)
- `src/presentation/controllers/product.controller.ts`
- `src/presentation/controllers/customer.controller.ts`
- `src/presentation/controllers/category.controller.ts`
- `src/presentation/controllers/invoice.controller.ts`
- `src/presentation/controllers/sale.controller.ts`
- `src/presentation/controllers/user.controller.ts`
- `src/presentation/controllers/auth.controller.ts`
- `src/presentation/controllers/invoice-series.controller.ts`
- `src/presentation/controllers/error-log.controller.ts`

### Specs actualizados (3 archivos)
- `src/presentation/controllers/product.controller.spec.ts`
- `src/presentation/controllers/customer.controller.spec.ts`
- `src/presentation/controllers/auth.controller.spec.ts`

### Configuración
- `src/app.module.ts` — ThrottlerModule
- `package.json` — @nestjs/throttler

---

## Pruebas

### Unit Tests (190 tests pasando)

**PaginationQueryDto** (`pagination-query.dto.spec.ts`):
| Test | Resultado |
|------|-----------|
| `page=1, limit=20` → válido | ✓ |
| `page=0` → 400 "La página debe ser mayor o igual a 1" | ✓ |
| `page=-1` → 400 | ✓ |
| `limit=0` → 400 "El límite debe ser mayor o igual a 1" | ✓ |
| `limit=101` → 400 "El límite máximo por página es 100" | ✓ |
| `limit=10000` → 400 | ✓ |
| `limit=100` (máx) → válido | ✓ |
| Valores default (page=1, limit=20) | ✓ |
| Transformación string → number | ✓ |

**LoginThrottlerGuard** (`login-throttler.guard.spec.ts`):
| Test | Resultado |
|------|-----------|
| `req.ip` → retorna IP | ✓ |
| `req.connection.remoteAddress` → retorna IP | ✓ |
| Sin IP disponible → retorna "unknown" | ✓ |
| `throwThrottlingException` → lanza ThrottlerException con mensaje español | ✓ |

### E2E Tests

**Pagination Validation** (`pagination-validation.e2e-spec.ts`):
| Endpoint | Test | Resultado |
|----------|------|-----------|
| `GET /products?page=0` | → 400 | ✓ |
| `GET /products?page=-1` | → 400 | ✓ |
| `GET /products?limit=0` | → 400 | ✓ |
| `GET /products?limit=101` | → 400 | ✓ |
| `GET /products?limit=10000` | → 400 | ✓ |
| `GET /products?limit=100` | → 200 | ✓ |
| `GET /products` | → 200 (default) | ✓ |
| `GET /products?page=1&limit=20` | → 200 | ✓ |
| `GET /customers?page=0` | → 400 | ✓ |
| `GET /customers?limit=0` | → 400 | ✓ |
| `GET /customers?limit=200` | → 400 | ✓ |
| `GET /categories?page=0` | → 400 | ✓ |
| `GET /categories?limit=150` | → 400 | ✓ |
| `GET /invoices?page=0` | → 400 | ✓ |
| `GET /invoices?limit=500` | → 400 | ✓ |
| `GET /sales?page=0` | → 400 | ✓ |
| `GET /sales?limit=0` | → 400 | ✓ |

**Auth Rate Limiting** (`auth-rate-limit.e2e-spec.ts`):
| Test | Resultado |
|------|-----------|
| 5 requests → 401 (no throttle) | ✓ |
| 6ta request → 429 | ✓ |
| 7ma request → 429 | ✓ |
| `/auth/login-google` sin throttle (7 requests → 400, no 429) | ✓ |

---

## Build y Tests

```
npm run build  ✓  (sin errores)
npm test       ✓  (190 tests passing)
```

---

## Sprint

**Sprint 9 — Testing y Seguridad**
Domingo 8 junio 2026

**Rama**: `feature/implementacion-s09-s13`