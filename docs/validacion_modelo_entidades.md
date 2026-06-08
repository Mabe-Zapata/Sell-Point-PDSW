# Casos de Validación del Modelo de Entidades

> Control de invariantes a nivel de dominio

---

## Visión General

El sistema implementa validaciones de dominio en dos capas:

| Capa | Responsabilidad | Ejecución |
|------|------------------|------------|
| **Validators (CQRS)** | Pre-condiciones deCommands/Queries | Antes de ejecutar la operación |
| **Value Objects** | Invariantes de tipos compuestos | Inmutabilidad y operaciones seguras |
| **Domain Services** | Lógica de negocio compleja | Cálculos y reglas transaccionales |

---

## Entidades del Dominio y sus Invariantes

### 1. Customer (Cliente)

**Entidad:**

```typescript
class Customer {
  id: string;
  name: string;
  lastName: string;
  cedula: string;        // único en sistema
  email?: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;      // soft delete
}
```

**Invariantes:**

| Invariante | Tipo | Cómo se controla |
|------------|------|------------------|
| `cedula` único | Integridad | `CreateCustomerValidator` consulta `findByCedula()` |
| Campos requeridos | Completitud | DTO con class-validator |
| Eliminación | Soft delete | `deletedAt` en lugar de DELETE físico |

**Casos de validación:**

| Operación | Validator | Validaciones |
|-----------|-----------|--------------|
| CREATE | `CreateCustomerValidator` | ✅ Cedula no existe |
| UPDATE | `UpdateCustomerValidator` | ✅ Entidad existe |
| DELETE | `DeleteCustomerValidator` | ✅ Entidad existe |
| LIST | `ListCustomersValidator` | Sin validaciones especiales |
| GET | `GetCustomerValidator` | ✅ Entidad existe |

---

### 2. Product (Producto)

**Entidad:**

```typescript
class Product {
  id: string;
  code: string;           // único en sistema
  name: string;
  description?: string;
  unitPrice: number;      // >= 0
  availableQuantity: number; // >= 0
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;       // soft delete
}
```

**Invariantes:**

| Invariante | Tipo | Cómo se controla |
|------------|------|------------------|
| `code` único | Integridad | Restricción BD UNIQUE |
| `unitPrice` >= 0 | business rule | Validación en constructor/DTO |
| `availableQuantity` >= 0 | business rule | Validación en constructor/DTO |
| Eliminación | Soft delete | `deletedAt` en lugar de DELETE físico |

**Casos de validación:**

| Operación | Validator | Validaciones |
|-----------|-----------|--------------|
| CREATE | `CreateProductValidator` | Por definir (actualmente vacío) |
| UPDATE | `UpdateProductValidator` | ✅ Entidad existe |
| DELETE | `DeleteProductValidator` | ✅ Entidad existe |
| LIST | `ListProductsValidator` | Sin validaciones especiales |
| GET | `GetProductValidator` | ✅ Entidad existe |

---

### 3. User (Usuario)

**Entidad:**

```typescript
class User {
  id: string;
  employeeId: string;     // único en sistema
  email?: string;
  passwordHash: string;
  role: string;
  isActive: boolean;      // control de acceso
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;       // soft delete
}
```

**Invariantes:**

| Invariante | Tipo | Cómo se controla |
|------------|------|------------------|
| `employeeId` único | Integridad | Restricción BD UNIQUE |
| `isActive` = true para login | Business rule | Auth service verifica estado |
| `passwordHash` no vacío | Completitud | Required en creación |
| Eliminación | Soft delete | `deletedAt` |

**Casos de validación:**

| Operación | Validator | Validaciones |
|-----------|-----------|--------------|
| CREATE | Por definir | ✅ employeeId único |
| LOGIN | `AuthService` | ✅ Usuario existe + isActive=true + password válida |
| DELETE | Por definir | ✅ Entidad existe |

---

### 4. Invoice (Factura)

**Entidad:**

```typescript
class Invoice {
  id: string;
  customerId: string;      // FK → Customer
  invoiceNumber: string;  // único en sistema
  subtotal: number;
  iva: number;
  total: number;
  status: InvoiceStatus;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

**Invariantes:**

| Invariante | Tipo | Cómo se controla |
|------------|------|------------------|
| `invoiceNumber` único | Integridad | Restricción BD UNIQUE |
| `customer` debe existir | Referencia | `CreateInvoiceValidator` consulta |
| `total` = subtotal + iva | Calculado | `TaxCalculator` domain service |
| Items con stock disponible | Inventory | `CreateInvoiceValidator` verifica |

**Casos de validación:**

| Operación | Validator | Validaciones |
|-----------|-----------|--------------|
| CREATE | `CreateInvoiceValidator` | ✅ Cliente existe, ✅ Productos existen, ✅ Stock suficiente |
| LIST | `ListInvoicesValidator` | Sin validaciones especiales |
| GET | `GetInvoiceValidator` | ✅ Entidad existe |
| PDF | `GenerateInvoicePdfValidator` | ✅ Factura existe |

---

### 5. InvoiceItem (Línea de Factura)

**Entidad:**

```typescript
class InvoiceItem {
  id: string;
  invoiceId: string;       // FK → Invoice
  productId: string;      // FK → Product
  quantity: number;      // > 0
  unitPrice: number;      // >= 0
  total: number;          // quantity * unitPrice
}
```

**Invariantes:**

| Invariante | Tipo | Cómo se controla |
|------------|------|------------------|
| `quantity` > 0 | Business rule | Validación DTO |
| `unitPrice` >= 0 | Business rule | Validación DTO |
| `total` = quantity * unitPrice | Calculado | Constructor o factory |
| `product` activo en venta | Referencia | Validación en CreateInvoice |

---

## Value Objects y Validaciones Compuestas

### Money

```typescript
class Money {
  private readonly cents: number;

  // Constructores seguros
  static fromDecimal(amount: number): Money;
  static fromCents(cents: number): Money;
  static zero(): Money;

  // Invariantes garantizadas por diseño
  // - Siempre representa valores no-negativos (opcional, depende del contexto)
  // - Precisión de 2 decimales garantizada
  // - Sin problemas de floating-point
}
```

**Invariantes controladas:**

| Invariante | Cómo se controla |
|------------|------------------|
| División por cero | Lanza `Error` en `divide(0)` |
| Precisión decimal | Usa representación en centavos (integer) |
| Inmutabilidad | Métodos retornan nuevas instancias |

---

## Domain Services

### TaxCalculator

```typescript
class TaxCalculator {
  constructor(taxPercentage: number) {
    // Invariante: 0 <= taxPercentage <= 100
    if (isNaN(taxPercentage) || taxPercentage < 0 || taxPercentage > 100) {
      throw new Error('IVA_PERCENTAGE must be a valid number between 0 and 100');
    }
  }

  calculateSubtotal(items: InvoiceItem[]): number;
  calculateIva(subtotal: number): number;
  calculateTotal(subtotal: number, iva: number): number;
}
```

**Invariantes controladas:**

| Invariante | Cómo se controla |
|------------|------------------|
| items no nulos | Retorna 0 si `items.length === 0` |
| subtotal > 0 para IVA | Retorna 0 si `subtotal <= 0` |
| Redondeo a 2 decimales | `Math.round(value * 100) / 100` |

---

## Excepciones de Dominio

| Excepción | Tipo | Cuándo se lanza |
|-----------|------|-----------------|
| `DomainException` | Base | Clase padre para todas |
| `EntityNotFoundException` | Integridad | Entity no existe en BD |
| `DuplicateCedulaException` | Integridad | Cedula ya registrada |
| `InsufficientStockException` | Inventory | `availableQuantity < requested` |

**Patrón de uso:**

```typescript
// En validators
if (!customer) {
  throw new EntityNotFoundException('Customer', id);
}

if (product.availableQuantity < requestedQty) {
  throw new InsufficientStockException(product.name, requestedQty, product.availableQuantity);
}
```

---

## Resumen: Validaciones por Operación

| Entidad | CREATE | UPDATE | DELETE | GET | LIST |
|---------|--------|--------|--------|-----|------|
| **Customer** | cedula único | existe | existe | existe | - |
| **Product** | (vacío) | existe | existe | existe | - |
| **User** | employeeId único | - | - | - | - |
| **Invoice** | cliente existe, stock OK | - | - | existe | - |
| **InvoiceItem** | qty > 0, price >= 0 | - | - | - | - |

---

## Pendientes / Gaps Identificados

| Entidad | Gap | Recomendación |
|---------|-----|---------------|
| Product | CREATE sin validaciones | Agregar: code único, price >= 0, quantity >= 0 |
| User | CREATE/DELETE sin validators | Implementar según tabla |
| Customer | UPDATE no valida cedula único | Validar que no choque con otro registro |
| Invoice | No valida products activos | Validar `product.isActive` antes de vender |

---

## Reglas del Dominio para Validaciones

1. **Todo validator vive en CQRS**: Los validators son parte de la capa de aplicación, no del dominio
2. **Entidades son anémicas**: No contienen lógica de validación; delegan a validators
3. **Value objects son inmutables**: Siempre retornan nuevas instancias
4. **Domain services encapsulan lógica compleja**: Como TaxCalculator para cálculos financieros
5. **Excepciones son específicas**: Usar excepciones de dominio, no genéricas