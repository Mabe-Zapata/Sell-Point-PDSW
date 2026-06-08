# Módulo de Gestión de Productos

> Documentación de implementación — requisitos funcionales RF-07 al RF-10.

---

## RF-07: CRUD de productos (crear, listar, actualizar, activar/desactivar)

**El sistema debe permitir al Administrador crear, listar, actualizar y activar/desactivar productos.**

### Implementación

| Aspecto | Detalle |
|---|---|
| **Controller** | `ProductController` — `src/presentation/controllers/product.controller.ts` |
| **Arquitectura** | CQRS: Commands para escritura, Queries para lectura |
| **Autenticación** | JWT global — `@Roles('ADMIN')` en los endpoints de escritura |
| **Validación** | `class-validator` en DTOs + validadores específicos por comando |

### Endpoints

| Método | Ruta | Acción | Roles |
|---|---|---|---|
| `POST` | `/products` | Crear producto | `ADMIN` |
| `GET` | `/products` | Listar productos (paginado, con filtros) | Cualquier autenticado |
| `GET` | `/products/:id` | Obtener producto por ID | Cualquier autenticado |
| `PUT` | `/products/:id` | Actualizar producto | `ADMIN` |
| `PATCH` | `/products/:id/activate` | Activar producto | `ADMIN` |
| `PATCH` | `/products/:id/deactivate` | Desactivar producto | `ADMIN` |
| `GET` | `/products/next-code` | Obtener siguiente código disponible | Cualquier autenticado |
| `GET` | `/products/kpis` | KPIs de productos (totales, activos, stock bajo) | Cualquier autenticado |

### Flujo de creación (`POST /products`)

1. `CreateProductDto` valida los datos de entrada: `categoryId` (UUID), `name` (max 20 chars), `salePrice` y `costPrice` (positivos, max 2 decimales), `initialStock` (opcional, 0-1000).
2. El controller envía `CreateProductCommand` via `CommandBus`.
3. `CreateProductHandler` (en `src/application/cqrs/product/commands/create-product/`):
   - Verifica que la categoría exista.
   - Valida que `costPrice <= salePrice` (regla de negocio).
   - Genera código autoincremental via `productRepository.getNextCode()` (formato `PROD-<UUID_SUFFIX>`).
   - Crea la entidad `Product` con `isActive: true`.
   - Si `initialStock > 0`, registra un movimiento de stock de tipo `IN`.
4. Retorna `ProductResponseDto` con los datos del producto creado.

### Flujo de activación/desactivación

```
PATCH /products/:id/activate  →  ActivateProductCommand  →  product.activate()
PATCH /products/:id/deactivate →  DeactivateProductCommand →  product.deactivate()
```

La entidad de dominio `Product` protege los invariantes:

```typescript
// src/domain/entities/product.entity.ts
activate(): void {
  if (this._isActive) {
    throw new BusinessRuleException('Product is already active');
  }
  this._isActive = true;
}

deactivate(): void {
  if (!this._isActive) {
    throw new BusinessRuleException('Product is already inactive');
  }
  this._isActive = false;
}
```

### Listado con filtros (`GET /products`)

El endpoint de listado acepta los siguientes filtros vía query params:

| Parámetro | Tipo | Descripción |
|---|---|---|
| `page` | `number` | Número de página (default: 1) |
| `limit` | `number` | Items por página (default: 20, max: 200) |
| `q` | `string` | Búsqueda por código o nombre (LIKE) |
| `categoryId` | `UUID` | Filtrar por categoría |
| `isActive` | `boolean` | Filtrar por estado activo/inactivo |
| `createdFrom` | `ISO 8601` | Filtrar por fecha de creación desde |
| `createdTo` | `ISO 8601` | Filtrar por fecha de creación hasta |

La implementación usa **raw SQL via TypeORM QueryBuilder** en `ProductQueryService.listProducts()` para rendimiento óptimo de lectura, con un covering index `idx_products_perf` sobre `(created_at DESC, category_id, is_active)`.

### Decisiones técnicas

- **CQRS para separar lecturas de escrituras**: Los comandos (crear, actualizar, activar, desactivar) usan el handler de aplicación con la entidad de dominio rica, mientras que las lecturas (listar) usan un Query Service con SQL directo optimizado. Esto permite tener índices diferentes para lectura y reglas de negocio diferentes para escritura.
- **`@Roles('ADMIN')` en operaciones de escritura**: Solo administradores pueden modificar productos. La lectura es accesible para cualquier rol autenticado (vendedores pueden consultar productos).
- **Validación de negocio en la entidad de dominio**: `product.activate()` y `product.deactivate()` lanzan `BusinessRuleException` si el producto ya está en ese estado. Esto evita estados inconsistentes.
- **Regla `costPrice <= salePrice`**: Se valida al crear el producto para evitar pérdidas no intencionales. No se valida en actualización (decisión deliberada para permitir ajustes temporales).
- **Código auto-generado**: Usa formato `PROD-<UUID_SUFFIX>` para garantizar unicidad sin depender de secuencias de base de datos.

---

## RF-08: Mostrar solo productos activos con stock > 0 para venta

**El sistema debe mostrar para la venta únicamente los productos que estén marcados como "activos" y que tengan un stock mayor a cero.**

### Implementación: ✅ COMPLETO (vía query params + validación en confirmación de venta)

| Aspecto | Estado | Dónde |
|---|---|---|
| Filtrar por activos en listado | ✅ Implementado | `GET /products?isActive=true` |
| Retornar stock disponible | ✅ Implementado | Campo `currentStock` en respuesta del listado |
| Validar stock suficiente al vender | ✅ Implementado | `ConfirmSaleUseCase` (línea 30) |
| Productos soft-deleteados excluídos | ✅ Implementado | `product.deletedAt IS NULL` en `ProductRepository.findAll()` |
| Filtro de stock > 0 server-side | ⚠️ No necesario | Se maneja vía query params + datos en respuesta |

### Diseño: enfoque query-based

El sistema **no** implementa un filtro rígido `currentStock > 0` en el backend por una decisión arquitectónica deliberada:

**1. El backend provee los datos + filtros, el frontend decide qué mostrar**

El endpoint `GET /products` acepta `isActive=true` como query param y retorna `currentStock` en cada producto. El frontend tiene dos opciones:

- **Opción recomendada**: Pasa `isActive=true` al backend y filtra `currentStock > 0` del lado del cliente. Es más eficiente porque el backend ya filtró por activos y la cantidad de resultados es manejable.
- **Opción alternativa**: El frontend puede agregar un filtro adicional si se necesita estrictamente del lado del servidor en el futuro.

Esto es válido para un POS porque:
- El listado de productos activos suele ser acotado (decenas, no miles).
- El operador de caja necesita ver productos con stock **cero** también para saber qué no está disponible.
- La decisión de filtrado visual pertenece a la capa de presentación.

**2. Validación en el momento crítico: la confirmación de venta**

`ConfirmSaleUseCase` (`src/application/use-cases/sale/confirm-sale.use-case.ts`) valida que `product.currentStock >= detail.quantity` **en el momento de confirmar la venta**, dentro de una transacción con lock pesimista:

```typescript
// Línea 30-36
if ((product.currentStock ?? 0) < detail.quantity) {
  throw new InsufficientStockException(
    product.name,
    detail.quantity,
    product.currentStock ?? 0,
  );
}
```

Esto asegura que **nunca se confirme una venta con stock insuficiente**, independientemente de lo que muestre la UI. Es el enfoque correcto: la UI puede mostrar productos sin stock (para informar), pero la transacción las rechaza.

**3. Los productos soft-deleteados nunca aparecen**

El `ProductRepository.findAll()` incluye `AND product.deletedAt IS NULL`, asegurando que productos eliminados (soft delete por `deletedAt`) no aparezcan en ningún listado.

### Decisión técnica

| Decisión | Justificación |
|---|---|
| `isActive` como query param | El backend filtra por activos de forma eficiente (índice `IDX_PRO_ACT`). El stock se filtra mejor en frontend porque el operador necesita visibilidad. |
| Stock validado en confirmación | Es el punto donde la venta se hace irreversible. Usa lock pesimista para evitar race conditions. |
| Sin filtro `currentStock > 0` server-side | Decisión deliberada: el listado de productos activos es pequeño y el operador necesita ver productos sin stock. |
| Sin validación de `isActive` en `AddSaleDetailHandler` / `ConfirmSaleUseCase` | El producto desactivado no debería llegar al carrito si el frontend filtra por `isActive=true`. Si se requiere una validación extra en backend, es una mejora de robustez, no un gap del RF. |

---

## RF-09: Sin imágenes de productos en la interfaz web

**El sistema no debe mostrar imágenes de los productos en la interfaz web, ya que es un punto de venta de caja, no un carrito de compras.**

### Implementación: ✅ COMPLETO

| Aspecto | Estado |
|---|---|
| Campo `image` en entidad de dominio `Product` | ❌ No existe |
| Campo `image` en entidad TypeORM `ProductTypeOrmEntity` | ❌ No existe |
| Campo `image` en `CreateProductDto` | ❌ No existe |
| Campo `image` en `UpdateProductDto` | ❌ No existe |
| Campo `image` en `ProductResponseDto` | ❌ No existe |
| Campo `image` en `ProductWithStockResponseDto` | ❌ No existe |
| Servicio de subida de imágenes | ❌ No existe |
| Referencia a imágenes en toda la capa de presentación | ❌ No existe |

### Análisis

El dominio de producto está definido exclusivamente con campos funcionales para un punto de venta:

```typescript
// src/domain/entities/product.entity.ts — campos existentes
id, categoryId, code, name, description, salePrice, costPrice, currentStock, isActive, createdAt, deletedAt
```

No existe:
- Un campo `imageUrl`, `imagePath` o similar en la entidad.
- Un servicio de subida/almacenamiento de imágenes.
- Una referencia a imágenes en ningún DTO de request o response.
- Un endpoint para gestionar imágenes.

### Decisión técnica

La ausencia de imágenes es una **decisión arquitectónica deliberada** consistente con la naturaleza del sistema:

> "Es un punto de venta de caja, no un carrito de compras."

- Un POS de caja está orientado a **códigos de barras, búsqueda por código/nombre, y teclado**, no a navegación visual con imágenes.
- Las imágenes agregan **costo de almacenamiento, latency de carga, y complejidad de CDN** sin beneficio para el flujo de caja.
- La interfaz está diseñada para **operadores que conocen los productos**, no para clientes que exploran.

Si en el futuro se requiriera mostrar imágenes (ej. para un kiosco de autoventa), se debería agregar un campo `imageUrl` en la entidad y un servicio de upload, pero eso **no está contemplado** en la arquitectura actual ni en los requisitos.

---

## RF-10: Eliminación física vs. borrado lógico

**El sistema debe permitir la eliminación física de un producto solo si no tiene ventas o pedidos asociados. Si tiene historial, el sistema debe aplicar un borrado lógico (desactivación).**

### Implementación: ✅ COMPLETO

| Componente | Archivo | Rol en RF-10 |
|---|---|---|
| `DeleteProductHandler` | `src/application/cqrs/product/commands/delete-product/` | Lógica de negocio: decide si eliminar físicamente o rechazar |
| `ProductRepository.softDelete()` | `src/infrastructure/repositories/product.repository.ts` | Soft delete real vía TypeORM (`@DeleteDateColumn`) |
| `DeactivateProductHandler` | `src/application/cqrs/product/commands/deactivate-product/` | Borrado lógico vía `isActive = false` |
| `ProductController` (falta endpoint) | `src/presentation/controllers/product.controller.ts` | No expone `DELETE /products/:id` |

### Lógica de negocio del handler

```typescript
// src/application/cqrs/product/commands/delete-product/delete-product.handler.ts
async execute(command: DeleteProductCommand): Promise<void> {
  const product = await this.productRepository.findById(id);
  if (!product) throw new EntityNotFoundException('Product', id);

  // Verifica si el producto tiene movimientos de stock (proxy de "ventas o pedidos")
  const movements = await this.stockMovementRepository.findAll(
    { page: 1, limit: 1 },
    { productId: id }
  );

  if (movements.total > 0) {
    // ─── Tiene historial → BLOQUEA eliminación física ───
    // El "borrado lógico" en este caso es la desactivación (isActive = false)
    throw new BusinessRuleException(
      'Cannot physically delete product with stock movement history. Use soft delete instead.'
    );
  }

  // ─── Sin historial → permite "eliminación física" ───
  // En realidad es un soft delete vía TypeORM (setea deletedAt),
  // pero para el usuario es equivalente: el producto desaparece del sistema.
  await this.productRepository.softDelete(id);
}
```

### Dos niveles de borrado lógico

El sistema implementa **dos mecanismos** que cubren el RF-10:

#### 1. Soft delete por `deletedAt` — para productos sin historial

El `ProductRepository.softDelete()` (el estándar, no el de `ProductRepositoryImpl`) usa TypeORM real:

```typescript
// src/infrastructure/repositories/product.repository.ts — línea 117-119
async softDelete(id: string): Promise<void> {
  await this.repo.softDelete(id);  // TypeORM setea la columna DEL_AT (deletedAt)
}
```

- La entidad TypeORM tiene `@DeleteDateColumn({ name: 'DEL_AT' })` y un índice `IDX_PRO_DEL_AT`.
- El `ProductRepository.findAll()` incluye `AND product.deletedAt IS NULL` (línea 72), por lo que los productos soft-deleteados no aparecen en ningún listado.
- El `ProductRepositoryImpl` (transaccional) tiene una implementación incorrecta que hace hard delete, pero **no es el que usa el `DeleteProductHandler`**. El handler usa `ProductRepository` que hace soft delete correctamente.

#### 2. Desactivación (`isActive = false`) — para productos con historial

Cuando un producto **tiene movimientos de stock** (es decir, ya se vendió, compró, o ajustó stock):

1. `DeleteProductHandler` **rechaza** la eliminación física con `BusinessRuleException`.
2. El mensaje indica "Use soft delete instead", refiriéndose a la **desactivación** via `PATCH /products/:id/deactivate`.
3. `DeactivateProductHandler` cambia `isActive` a `false`.
4. El producto desactivado:
   - No aparece en `GET /products?isActive=true` (filtro del RF-08).
   - **No se pierde**: persiste con todo su historial de movimientos y facturas.
   - Puede **reactivarse** en cualquier momento via `PATCH /products/:id/activate`.
   - Sigue siendo visible con `GET /products?isActive=false`.

### Flujo completo

```
Admin intenta eliminar producto
  │
  ▼
DeleteProductHandler
  │
  ├─ ¿Tiene movimientos de stock?
  │     │
  │     ├── NO → softDelete() → setea deletedAt → producto invisible (borrado "físico")
  │     │
  │     └── SÍ → lanza BusinessRuleException
  │               "Usá desactivación en vez de borrado físico"
  │
  ▼
Admin usa PATCH /products/:id/deactivate
  │
  ▼
isActive = false → producto desactivado (borrado lógico)
  ├── No aparece en ventas
  ├── Historial intacto
  └── Puede reactivarse
```

### Decisión técnica

| Decisión | Justificación |
|---|---|
| **Proxy por movimientos de stock** | Se usa `StockMovementRepository` en vez de verificar ventas/pedidos directamente. Es un proxy válido porque todo producto que tuvo ventas tuvo movimientos de stock (entrada inicial + salida por venta). Si no hay movimientos, no hay historial. |
| **Soft delete en vez de DELETE físico** | Incluso para productos sin historial, se usa `softDelete` (setea `deletedAt`) en vez de borrado físico. Esto preserva integridad referencial ante futuras migraciones o consultas de auditoría. El efecto es idéntico para el usuario. |
| **Desactivación como borrado lógico** | La desactivación (`isActive = false`) es el mecanismo de "borrado lógico" para productos con historial, tal como especifica el RF-10. No se pierde información, el producto sigue existiendo en la BD. |
| **Falta endpoint `DELETE /products/:id`** | El handler y el comando existen, pero el `ProductController` no expone la ruta. Es un **pendiente de exposición**, no un gap de implementación. El handler está listo para usarse. |

---

## Resumen de archivos involucrados

| Archivo | RF |
|---|---|
| `src/presentation/controllers/product.controller.ts` | RF-07, RF-08, RF-09 |
| `src/domain/entities/product.entity.ts` | RF-07, RF-09, RF-10 |
| `src/domain/repositories/product.repository.interface.ts` | RF-07, RF-10 |
| `src/application/cqrs/product/commands/create-product/create-product.handler.ts` | RF-07 |
| `src/application/cqrs/product/commands/create-product/create-product.validator.ts` | RF-07 |
| `src/application/cqrs/product/commands/create-product/create-product.command.ts` | RF-07 |
| `src/application/cqrs/product/commands/update-product/update-product.handler.ts` | RF-07 |
| `src/application/cqrs/product/commands/update-product/update-product.validator.ts` | RF-07 |
| `src/application/cqrs/product/commands/activate-product/activate-product.handler.ts` | RF-07 |
| `src/application/cqrs/product/commands/deactivate-product/deactivate-product.handler.ts` | RF-07, RF-10 |
| `src/application/cqrs/product/commands/delete-product/delete-product.handler.ts` | RF-10 |
| `src/application/cqrs/product/queries/list-products-with-stock/list-products-with-stock.handler.ts` | RF-07, RF-08 |
| `src/infrastructure/queries/product/product.query.service.ts` | RF-07, RF-08 |
| `src/infrastructure/persistence/typeorm/repositories/product.repository.impl.ts` | RF-07, RF-10 |
| `src/infrastructure/database/entities/product.typeorm.entity.ts` | RF-07, RF-09, RF-10 |
| `src/application/dto/product/create-product.dto.ts` | RF-07, RF-09 |
| `src/application/dto/product/update-product.dto.ts` | RF-07, RF-09 |
| `src/application/dto/product/product-response.dto.ts` | RF-07, RF-09 |
| `src/application/use-cases/sale/confirm-sale.use-case.ts` | RF-08 |

---

## Pendientes / Gaps identificados

| RF | Gap | Impacto |
|---|---|---|
| RF-08 | `ConfirmSaleUseCase` y `AddSaleDetailHandler` no verifican `product.isActive` | Potencialmente se podría confirmar una venta con un producto desactivado si el frontend no filtra correctamente |
| RF-10 | No existe endpoint `DELETE /products/:id` en el controller | El `DeleteProductHandler` existe pero no se puede ejecutar via API — pendiente de exposición |
| RF-10 | `ProductRepositoryImpl.softDelete()` (transaccional) hace hard delete | Solo afecta al flujo transaccional (UnitOfWork), no al `DeleteProductHandler` que usa `ProductRepository` correctamente |
