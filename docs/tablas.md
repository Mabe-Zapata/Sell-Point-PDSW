# Documentación del Modelo de Datos

Este documento describe las tablas del modelo de base de datos PostgreSQL para el sistema de ventas con gestión de sucursales, inventario, facturación y seguridad.

## Tabla de Contenidos

- [Seguridad](#seguridad)
- [Sucursales y Bodegas](#sucursales-y-bodegas)
- [Clientes](#clientes)
- [Productos](#productos)
- [IVA Parametrizable](#iva-parametrizable)
- [Inventario](#inventario)
- [Transferencias](#transferencias)
- [Ventas](#ventas)
- [Pagos](#pagos)
- [Facturación](#facturación)
- [Log de Errores](#log-de-errores)

---

## Seguridad

### roles

Almacena los roles disponibles en el sistema para control de acceso.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único del rol |
| name | varchar(50) | NOT NULL, UNIQUE | Nombre del rol (ADMIN, VENDEDOR, CAJERO, BODEGA) |
| description | varchar(255) | | Descripción del rol |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Registros iniciales:**
- `ADMIN`: Acceso total al sistema
- `VENDEDOR`: Gestión de ventas y clientes
- `CAJERO`: Gestión de ventas y facturación
- `BODEGA`: Gestión de inventario y bodegas

---

### users

Usuarios del sistema con autenticación.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único del usuario |
| username | varchar(50) | NOT NULL, UNIQUE | Nombre de usuario para login |
| password_hash | varchar(255) | NOT NULL | Hash de la contraseña |
| full_name | varchar(120) | NOT NULL | Nombre completo |
| email | varchar(120) | UNIQUE | Correo electrónico |
| status | user_status | NOT NULL, DEFAULT 'ACTIVE' | Estado: ACTIVE, INACTIVE, BLOCKED |
| default_branch_id | bigint | | FK - Sucursal por defecto |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de última actualización |

**Índices:** username, email

---

### user_roles

Relación muchos a muchos entre usuarios y roles.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| user_id | bigint | NOT NULL | FK - Usuario |
| role_id | bigint | NOT NULL | FK - Rol |

**Clave primaria compuesta:** (user_id, role_id)

---

### user_branches

Relación muchos a muchos entre usuarios y sucursales (acceso múltiple a sucursales).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| user_id | bigint | NOT NULL | FK - Usuario |
| branch_id | bigint | NOT NULL | FK - Sucursal |

**Clave primaria compuesta:** (user_id, branch_id)

---

## Sucursales y Bodegas

### branches

Sucursales del sistema de ventas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| name | varchar(100) | NOT NULL | Nombre de la sucursal |
| city | varchar(80) | NOT NULL | Ciudad de ubicación |
| address | varchar(255) | | Dirección |
| phone | varchar(20) | | Teléfono de contacto |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activa |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índice único:** (name, city)

**Registros iniciales:**
- Sucursal Quito
- Sucursal Ambato
- Sucursal Cuenca

---

### warehouses

Bodegas dentro de cada sucursal.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| branch_id | bigint | NOT NULL | FK - Sucursal |
| name | varchar(100) | NOT NULL | Nombre de la bodega |
| description | varchar(255) | | Descripción |
| is_main | boolean | NOT NULL, DEFAULT true | Si es la bodega principal |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activa |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índice único:** (branch_id, name)

---

## Clientes

### customers

Clientes registrados en el sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| identification | varchar(20) | NOT NULL, UNIQUE | Cédula/RUC de identificación |
| full_name | varchar(150) | NOT NULL | Nombre completo |
| email | varchar(120) | | Correo electrónico |
| phone | varchar(20) | | Teléfono de contacto |
| address | varchar(255) | | Dirección |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índices:** identification, full_name

---

## Productos

### categories

Categorías para clasificar productos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| name | varchar(100) | NOT NULL, UNIQUE | Nombre de la categoría |
| description | varchar(255) | | Descripción |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activa |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

---

### products

Catálogo de productos del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| category_id | bigint | NOT NULL | FK - Categoría |
| code | varchar(50) | NOT NULL, UNIQUE | Código interno del producto |
| name | varchar(150) | NOT NULL | Nombre del producto |
| description | text | | Descripción detallada |
| sale_price | decimal(12,2) | NOT NULL | Precio de venta |
| cost_price | decimal(12,2) | NOT NULL, DEFAULT 0 | Precio de costo |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activo |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índices:** name, code

---

## IVA Parametrizable

### tax_rates

Tasas de impuesto configurables (IVA).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| name | varchar(50) | NOT NULL | Nombre de la tasa (ej: "IVA 15%") |
| percentage | decimal(5,2) | NOT NULL | Porcentaje del impuesto |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activa |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Índice único:** name

**Registros iniciales:**
- IVA 15%: 15.00%
- IVA 0%: 0.00%

---

## Inventario

### inventories

Stock de productos por bodega.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| warehouse_id | bigint | NOT NULL | FK - Bodega |
| product_id | bigint | NOT NULL | FK - Producto |
| current_stock | integer | NOT NULL, DEFAULT 0 | Cantidad actual en stock |
| minimum_stock | integer | NOT NULL, DEFAULT 0 | Stock mínimo (alerta) |
| maximum_stock | integer | | Stock máximo |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índice único:** (warehouse_id, product_id)

---

### stock_movements

Historial de movimientos de inventario.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| warehouse_id | bigint | NOT NULL | FK - Bodega origen/destino |
| product_id | bigint | NOT NULL | FK - Producto |
| user_id | bigint | NOT NULL | FK - Usuario que registra |
| movement_type | stock_movement_type | NOT NULL | Tipo: IN, OUT, TRANSFER_IN, TRANSFER_OUT, SALE, ADJUSTMENT |
| quantity | integer | NOT NULL | Cantidad del movimiento |
| reference_type | varchar(50) | | Tipo de referencia (sale, transfer, etc) |
| reference_id | bigint | | ID de la referencia |
| description | varchar(255) | | Descripción del movimiento |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |

**Índices:** warehouse_id, product_id, movement_type, created_at

---

## Transferencias

### stock_transfers

Solicitudes de transferencia de stock entre sucursales.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| from_branch_id | bigint | NOT NULL | FK - Sucursal origen |
| to_branch_id | bigint | NOT NULL | FK - Sucursal destino |
| requested_by_user_id | bigint | NOT NULL | FK - Usuario que solicita |
| approved_by_user_id | bigint | | FK - Usuario que aprueba |
| status | transfer_status | NOT NULL, DEFAULT 'REQUESTED' | Estado: REQUESTED, APPROVED, SENT, RECEIVED, CANCELLED |
| requested_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de solicitud |
| approved_at | timestamp | | Fecha de aprobación |
| sent_at | timestamp | | Fecha de envío |
| received_at | timestamp | | Fecha de recepción |
| notes | varchar(255) | | Notas adicionales |

**Índices:** from_branch_id, to_branch_id, status

---

### stock_transfer_details

Detalle de productos en cada transferencia.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| stock_transfer_id | bigint | NOT NULL | FK - Transferencia |
| product_id | bigint | NOT NULL | FK - Producto |
| requested_quantity | integer | NOT NULL | Cantidad solicitada |
| sent_quantity | integer | NOT NULL, DEFAULT 0 | Cantidad enviada |
| received_quantity | integer | NOT NULL, DEFAULT 0 | Cantidad recibida |

**Índice único:** (stock_transfer_id, product_id)

---

## Ventas

### sales

Cabecera de ventas del sistema.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| branch_id | bigint | NOT NULL | FK - Sucursal |
| customer_id | bigint | NOT NULL | FK - Cliente |
| cashier_user_id | bigint | NOT NULL | FK - Usuario cajero |
| tax_rate_id | bigint | NOT NULL | FK - Tasa de impuesto |
| sale_number | varchar(50) | NOT NULL, UNIQUE | Número de venta |
| subtotal | decimal(12,2) | NOT NULL, DEFAULT 0 | Subtotal sin impuestos |
| tax_amount | decimal(12,2) | NOT NULL, DEFAULT 0 | Monto del impuesto |
| discount_amount | decimal(12,2) | NOT NULL, DEFAULT 0 | Descuento aplicado |
| total | decimal(12,2) | NOT NULL, DEFAULT 0 | Total final |
| status | sale_status | NOT NULL, DEFAULT 'DRAFT' | Estado: DRAFT, CONFIRMED, CANCELLED |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índices:** branch_id, customer_id, cashier_user_id, status, created_at

---

### sale_details

Detalle de productos en cada venta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| sale_id | bigint | NOT NULL | FK - Venta |
| product_id | bigint | NOT NULL | FK - Producto |
| warehouse_id | bigint | NOT NULL | FK - Bodega de donde se despacha |
| quantity | integer | NOT NULL | Cantidad vendida |
| unit_price | decimal(12,2) | NOT NULL | Precio unitario |
| subtotal | decimal(12,2) | NOT NULL | Subtotal de la línea |
| tax_percentage | decimal(5,2) | NOT NULL | Porcentaje de impuesto |
| tax_amount | decimal(12,2) | NOT NULL | Monto de impuesto |
| total | decimal(12,2) | NOT NULL | Total de la línea |

**Índices:** sale_id, product_id

---

### sales_history

Histórico de ventas confirmadas o canceladas (no se eliminan).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| original_sale_id | bigint | NOT NULL | ID original de la venta |
| branch_id | bigint | NOT null | FK - Sucursal |
| customer_id | bigint | NOT NULL | FK - Cliente |
| cashier_user_id | bigint | NOT NULL | FK - Cajero |
| tax_rate_id | bigint | NOT NULL | FK - Tasa de impuesto |
| sale_number | varchar(50) | NOT NULL, UNIQUE | Número de venta |
| subtotal | decimal(12,2) | NOT NULL | Subtotal |
| tax_amount | decimal(12,2) | NOT NULL | Monto de impuesto |
| discount_amount | decimal(12,2) | NOT NULL | Descuento |
| total | decimal(12,2) | NOT NULL | Total |
| status | sale_status | NOT NULL | Estado final |
| original_created_at | timestamp | NOT NULL | Fecha original de la venta |
| moved_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de migración al histórico |

**Índices:** original_sale_id (único), branch_id, sale_number, original_created_at

---

## Pagos

### payments

Métodos de pago utilizados en cada venta.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| sale_id | bigint | NOT NULL | FK - Venta |
| method | payment_method | NOT NULL | Método: CASH, CARD, TRANSFER |
| amount | decimal(12,2) | NOT NULL | Monto pagado |
| reference | varchar(100) | | Referencia (número de cheque, transacción, etc) |
| paid_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de pago |

**Índices:** sale_id, method

---

## Facturación

### invoice_series

Series de facturación por sucursal y punto de emisión.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| branch_id | bigint | NOT NULL | FK - Sucursal |
| establishment_code | varchar(3) | NOT NULL | Código de establecimiento (SRI) |
| emission_point_code | varchar(3) | NOT NULL | Punto de emisión |
| current_sequence | integer | NOT NULL, DEFAULT 0 | Secuencia actual del número de factura |
| is_active | boolean | NOT NULL, DEFAULT true | Si está activa |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de creación |
| updated_at | timestamp | | Fecha de actualización |

**Índice único:** (branch_id, establishment_code, emission_point_code)

---

### invoices

Facturas emitidas por ventas confirmadas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| sale_id | bigint | NOT NULL, UNIQUE | FK - Venta asociada |
| invoice_series_id | bigint | NOT NULL | FK - Serie de facturación |
| invoice_number | varchar(30) | NOT NULL, UNIQUE | Número de factura (secuencial) |
| status | invoice_status | NOT NULL, DEFAULT 'ISSUED' | Estado: ISSUED, CANCELLED |
| subtotal | decimal(12,2) | NOT NULL | Subtotal |
| tax_amount | decimal(12,2) | NOT NULL | Monto del impuesto |
| total | decimal(12,2) | NOT NULL | Total de la factura |
| pdf_path | varchar(255) | | Ruta del archivo PDF |
| issued_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha de emisión |
| cancelled_at | timestamp | | Fecha de cancelación |

**Índices:** invoice_number, issued_at

---

## Log de Errores

### error_logs

Registro de errores del sistema para auditoría y debugging.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|----------------|--------------|
| id | bigint | PK, autoincrement | Identificador único |
| message | varchar(500) | NOT NULL | Mensaje del error |
| exception_type | exception_type | NOT NULL | Tipo: VALIDATION_ERROR, DATABASE_ERROR, AUTHENTICATION_ERROR, AUTHORIZATION_ERROR, BUSINESS_RULE_ERROR, EXTERNAL_SERVICE_ERROR, UNEXPECTED_ERROR |
| stack_trace | text | | Traza completa del error |
| source | varchar(100) | | Origen del error (servicio, controlador, etc) |
| user_id | bigint | | FK - Usuario relacionado (si aplica) |
| created_at | timestamp | DEFAULT CURRENT_TIMESTAMP | Fecha del error |

**Índices:** user_id, exception_type, created_at

---

## Relaciones entre Tablas

| Tabla Origen | Tabla Destino | Nombre de Relación |
|--------------|---------------|--------------------|
| users | branches | default_branch_id |
| user_roles | users | user_id |
| user_roles | roles | role_id |
| user_branches | users | user_id |
| user_branches | branches | branch_id |
| error_logs | users | user_id |
| warehouses | branches | branch_id |
| products | categories | category_id |
| inventories | warehouses | warehouse_id |
| inventories | products | product_id |
| stock_movements | warehouses | warehouse_id |
| stock_movements | products | product_id |
| stock_movements | users | user_id |
| stock_transfers | branches | from_branch_id |
| stock_transfers | branches | to_branch_id |
| stock_transfers | users | requested_by_user_id |
| stock_transfers | users | approved_by_user_id |
| stock_transfer_details | stock_transfers | stock_transfer_id |
| stock_transfer_details | products | product_id |
| sales | branches | branch_id |
| sales | customers | customer_id |
| sales | users | cashier_user_id |
| sales | tax_rates | tax_rate_id |
| sale_details | sales | sale_id |
| sale_details | products | product_id |
| sale_details | warehouses | warehouse_id |
| sales_history | branches | branch_id |
| sales_history | customers | customer_id |
| sales_history | users | cashier_user_id |
| sales_history | tax_rates | tax_rate_id |
| payments | sales | sale_id |
| invoice_series | branches | branch_id |
| invoices | sales | sale_id |
| invoices | invoice_series | invoice_series_id |

---

## Enumeraciones

| Enum | Valores |
|------|---------|
| user_status | ACTIVE, INACTIVE, BLOCKED |
| sale_status | DRAFT, CONFIRMED, CANCELLED |
| invoice_status | ISSUED, CANCELLED |
| payment_method | CASH, CARD, TRANSFER |
| stock_movement_type | IN, OUT, TRANSFER_IN, TRANSFER_OUT, SALE, ADJUSTMENT |
| transfer_status | REQUESTED, APPROVED, SENT, RECEIVED, CANCELLED |
| exception_type | VALIDATION_ERROR, DATABASE_ERROR, AUTHENTICATION_ERROR, AUTHORIZATION_ERROR, BUSINESS_RULE_ERROR, EXTERNAL_SERVICE_ERROR, UNEXPECTED_ERROR |