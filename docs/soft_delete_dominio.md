# Soft Delete en el Dominio: Desactivación en lugar de Eliminación

## Principio Fundamental

> **Nunca se elimina un registro del sistema. Se desactiva.**

El sistema implementa un patrón de **desactivación lógica** donde los registros sensibles se marcan como inactivos en lugar de eliminarse fisicamente. Esto garantiza trazabilidad, auditoría y consistencia referencial.

---

## Representación en las Tablas

### Campo `is_active`

| Tipo | Restricciones | Comportamiento |
|------|---------------|-----------------|
| `boolean` | NOT NULL, DEFAULT true | `true` = activo, `false` = desactivado |

### Tablas que implementan este patrón

| Tabla | Campo | Notas |
|-------|-------|-------|
| `branches` | is_active | Una sucursal desactivada no aparece en listados públicos |
| `warehouses` | is_active | Las bodegas inactivas no permiten movimientos de stock |
| `users` | is_active | Usuarios desactivados no pueden autenticarse |
| `products` | is_active | Productos inactivos no aparecen en ventas |
| `invoice_series` | is_active | Series inactivas no pueden emitir facturas |
| `categories` | is_active | Categorías desactivadas no muestran productos |
| `roles` | is_active | Roles inactivos no se asignan a usuarios |

---

## Reglas del Dominio

### 1. Consultas siempre filtran por `is_active = true`

```go
// ❌ Incorrecto: retorna registros desactivados
repository.FindAll()

// ✅ Correcto: solo retorna activos por defecto
repository.FindByIsActiveTrue()
```

**Rationale**: El dominio asume que las operaciones de lectura默认值 buscan entidades activas. Solo operaciones específicas (auditoría, recuperación) acceden a registros inactivos.

### 2. La desactivación es irreversible a nivel de dominio

```go
// Al desactivar un producto
product.Deactivate() // → is_active = false

// Nunca se vuelve a activar
product.Activate() // ❌ No existe en el dominio
```

**Rationale**: Si un producto fue desactivado, existe una razón de negocio (obsoleto, fuera de catálogo). Reactivarlo requiere intervención manual directa en base de datos con justificación documentada.

### 3. Las relaciones referenciales validan estado activo

```
Usuario → Sucursal por defecto
   └─→ Validar que branch.is_active = true

Venta → Producto
   └─→ Validar que product.is_active = true (al confirmar venta)
```

**Rationale**: No se puede crear una relación con una entidad inactiva. La venta a un producto desactivado es un error de negocio, no una validación de BD.

### 4. Cascada de desactivación

| Entidad | Al desactivar... |
|---------|------------------|
| `branch` | Se desactivan todas sus `warehouses` |
| `warehouse` | Se bloquean movimientos, pero existen referencias en `inventories` y `stock_movements` |
| `category` | Los `products` remain active pero la categoría no aparece en listados |
| `role` | Los `user_roles` existentes permanecen, pero el rol no se asigna a nuevos usuarios |

---

## Comportamiento por Contexto

### Contexto de Lectura (Queries)

| Escenario | Comportamiento |
|-----------|----------------|
| Listar productos para venta | Solo `is_active = true` |
| Buscar cliente por ID | Retornar error si `is_active = false` |
| Reporte de inventario | Incluir productos activos |
| Historial de auditoría | Acceder a registros sin filtro |

### Contexto de Escritura (Commands)

| Escenario | Comportamiento |
|-----------|----------------|
| Crear venta | Validar que productos estén activos |
| Asignar rol a usuario | Validar que rol esté activo |
| Transferencia entre sucursales | Validar que ambas sucursales estén activas |
| Actualizar producto | Permitido incluso si está inactivo (para auditoría) |

---

## Implementación Recomendada

### En el modelo de dominio (Go)

```go
type Branch struct {
    ID        bigint
    Name      string
    City      string
    IsActive  bool
    // ...
}

// El dominio no exppone método para activar
func (b *Branch) Deactivate() {
    b.IsActive = false
}

// Query methods del repositorio
func (r *BranchRepository) FindActiveByID(id bigint) (*Branch, error) {
    return r.db.Where("id = ? AND is_active = true").First()
}

func (r *BranchRepository) FindAllActive() ([]Branch, error) {
    return r.db.Where("is_active = true").Find()
}
```

### En la capa de aplicación (Use Cases)

```go
func (uc *SaleUseCase) CreateSale(req CreateSaleRequest) error {
    // Validar que todos los productos estén activos
    for _, item := range req.Items {
        product, err := uc.productRepo.FindActiveByID(item.ProductID)
        if err != nil {
            return ErrProductNotFound // incluye verificación de is_active
        }
        if !product.IsActive {
            return ErrProductInactive
        }
    }
    // ...
}
```

---

## Excepciones: Tablas sin `is_active`

Algunas tablas **no implementan desactivación** y operan con eliminación o histórico:

| Tabla | Razón |
|-------|-------|
| `sales` | Se migra a `sales_history` al confirmar/cancelar |
| `sale_details` | Historial atado a la venta |
| `payments` | Historial financiero atado a la venta |
| `stock_movements` | Auditoría de stock — inmutables |
| `invoices` | Cumplimiento fiscal — inmutables |
| `error_logs` | Auditoría de errores — solo se agregan |

---

## Resumen

| Aspecto | Regla |
|---------|-------|
| **Mecanismo** | `is_active` boolean (DEFAULT true) |
| **Lectura default** | Solo entidades activas |
| **Desactivación** | Irreversible a nivel de dominio |
| **Relaciones** | Validar estado activo en operaciones de escritura |
| **Excepciones** | Tablas de historial usan migración, no desactivación |