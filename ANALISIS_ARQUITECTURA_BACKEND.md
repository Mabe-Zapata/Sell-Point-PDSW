# Análisis de arquitectura backend

## Resumen ejecutivo

El proyecto **muestra intención clara de aplicar Clean Architecture y CQRS**, pero hoy la implementación está **parcialmente lograda**. La separación por carpetas (`domain`, `application`, `infrastructure`, `presentation`) está bien encaminada, pero en varios puntos la capa de aplicación **depende directamente de infraestructura y de detalles de framework**, lo cual rompe la inversión de dependencias y debilita la arquitectura.

La conclusión corta es esta:

- **Clean Architecture: parcial, no estricta**.
- **SOLID: hay aciertos, pero DIP y SRP están tensionados de forma importante**.
- **CQRS: presente a nivel estructural, pero todavía es mayormente “CQRS de organización”, no CQRS completo**.

---

## 1. Mapa actual del backend

La estructura general del proyecto está organizada así:

- `src/domain/`: entidades, excepciones, contratos de repositorio y servicios de dominio.
- `src/application/`: comandos, queries, handlers, validators, DTOs y contratos de aplicación.
- `src/infrastructure/`: repositorios concretos TypeORM, entidades ORM y servicios técnicos.
- `src/presentation/`: controllers, filtros e interceptores.
- `src/app.module.ts`: composición general de dependencias.

### Lectura arquitectónica

Eso está bien como intención. El problema no es el naming de carpetas; el problema es la **dirección real de las dependencias**.

---

## 2. Evaluación de Clean Architecture

## Qué está bien

1. **Separación explícita de capas**
   - La estructura del código distingue dominio, aplicación, infraestructura y presentación.
   - Los controllers delegan en `CommandBus` y `QueryBus`, evitando lógica HTTP mezclada con casos de uso.

2. **Existencia de contratos de repositorio**
   - Hay interfaces como `IProductRepository` en `src/domain/repositories/product.repository.interface.ts`.
   - Esto indica una intención correcta de programar contra abstracciones.

3. **Uso de handlers por caso de uso**
   - Los handlers de comandos y consultas ayudan a encapsular operaciones por intención.

## Qué está mal o incompleto

### 2.1 La capa de aplicación depende de infraestructura concreta

**Evidencia:**

- `src/application/cqrs/product/commands/create-product/create-product.handler.ts:4`
  importa `ProductRepository` desde `infrastructure/repositories/product.repository`.
- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:5-7`
  importa `InvoiceRepository`, `InvoiceItemRepository` y `ProductRepository` concretos.
- `src/application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler.ts:4-5`
  importa `InvoiceItemRepository` y `PdfService` concretos.

**Problema:**

En Clean Architecture, application no debería depender de implementaciones concretas de infraestructura. Debería depender de **puertos/abstracciones** y dejar que infraestructura implemente esos contratos.

**Conclusión:**

La arquitectura está **separada físicamente**, pero no **desacoplada realmente**.

### 2.2 El dominio todavía está contaminado con detalles de NestJS

**Evidencia:**

- `src/domain/services/tax-calculator.service.ts:1,10,12`
  usa `@Injectable()` e `@Inject(...)` de NestJS.

**Problema:**

El dominio no debería conocer el framework. Cuando una clase del dominio depende de decoradores o mecanismos DI de Nest, deja de ser un core puro y portátil.

### 2.3 Entidades anémicas

**Evidencia:**

- `src/domain/entities/product.entity.ts:20-21`
  construye la entidad con `Object.assign(this, partial)`.

**Problema:**

La entidad está actuando como contenedor de datos, no como modelo rico de negocio. No protege invariantes ni encapsula comportamiento.

### 2.4 La composición de dependencias está centrada en concretos

**Evidencia:**

- `src/app.module.ts:165-170`
  registra directamente `CustomerRepository`, `ProductRepository`, `InvoiceRepository`, `InvoiceItemRepository` y `PdfService`.

**Problema:**

La aplicación termina consumiendo concretos porque la composición no expone puertos mediante tokens o adapters explícitos.

---

## 3. Evaluación SOLID

## 3.1 SRP — Single Responsibility Principle

### Hallazgo 1

- **Observed Signal:** `GetProductValidator` consulta repositorio y devuelve la entidad encontrada.
- **Evidencia:** `src/application/cqrs/product/queries/get-product/get-product.validator.ts:10-15`
- **Principle Under Tension:** SRP.
- **Why It Hurts:** un validador debería validar entrada o precondiciones, no transformarse en servicio de lectura.
- **Minimum Action:** mover el fetch al `QueryHandler` y dejar validación de formato/estructura en DTOs, pipes o validadores de entrada.
- **Escalation Path:** eliminar el patrón de “validator que también consulta repositorio” en todos los queries.
- **Confidence:** alta.

### Hallazgo 2

- **Observed Signal:** `CreateInvoiceHandler` orquesta validación, armado de ítems, cálculo tributario, numeración, persistencia de factura, persistencia de ítems y decremento de stock.
- **Evidencia:** `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:23-80`
- **Principle Under Tension:** SRP.
- **Why It Hurts:** el handler tiene demasiadas razones de cambio: reglas de numeración, persistencia, stock, cálculo y coordinación transaccional.
- **Minimum Action:** extraer servicios de aplicación específicos, por ejemplo `InvoiceNumberGenerator`, `InvoiceFactory` y `IUnitOfWork`.
- **Escalation Path:** modelar el proceso como caso de uso orquestado por puertos + domain services.
- **Confidence:** alta.

## 3.2 OCP — Open/Closed Principle

### Hallazgo

- **Observed Signal:** para agregar nuevas variantes de salida o persistencia hay que editar handlers existentes porque dependen de concretos.
- **Evidencia:** `GenerateInvoicePdfHandler` consume `PdfService` concreto en `src/application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler.ts:5,12,19`.
- **Principle Under Tension:** OCP.
- **Why It Hurts:** si mañana querés generar PDF con otro motor, o emitir HTML/Excel, tenés que modificar el caso de uso en lugar de extender una implementación detrás de un puerto.
- **Minimum Action:** inyectar `IPdfService` usando el token `PDF_SERVICE` ya existente en `src/application/services/pdf-service.interface.ts:8,16-23`.
- **Escalation Path:** introducir estrategia/factory para renderizadores de documentos.
- **Confidence:** media-alta.

## 3.3 LSP — Liskov Substitution Principle

### Hallazgo

- **Observed Signal:** no encontré una violación fuerte por herencia problemática.
- **Principle Under Tension:** bajo actualmente.
- **Why It Hurts:** no es el foco principal del problema en este código.
- **Minimum Action:** mantener contratos de repositorio pequeños y consistentes.
- **Escalation Path:** revisar sustitución si en el futuro aparecen repositorios especializados con comportamientos incompatibles.
- **Confidence:** media.

## 3.4 ISP — Interface Segregation Principle

### Hallazgo

- **Observed Signal:** existen interfaces correctas de repositorio, pero no siempre son las que consume application.
- **Evidencia:** existe `IProductRepository` en `src/domain/repositories/product.repository.interface.ts:21-55`, pero `CreateProductHandler` usa `ProductRepository` concreto en `src/application/cqrs/product/commands/create-product/create-product.handler.ts:4,11,25`.
- **Principle Under Tension:** ISP/DIP combinados.
- **Why It Hurts:** diseñar contratos chicos y después ignorarlos elimina el beneficio del desacoplamiento.
- **Minimum Action:** que handlers y validators dependan de interfaces, no de clases concretas.
- **Escalation Path:** separar puertos de lectura y escritura si CQRS va a profundizarse.
- **Confidence:** alta.

## 3.5 DIP — Dependency Inversion Principle

### Hallazgo crítico

- **Observed Signal:** los casos de uso dependen de TypeORM y de implementaciones concretas.
- **Evidencia:**
  - `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:2` importa `DataSource` de `typeorm`.
  - `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:16-20` inyecta repositorios concretos y `DataSource`.
  - `src/application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler.ts:5,12` usa `PdfService` concreto.

- **Principle Under Tension:** DIP.
- **Why It Hurts:** la regla central de Clean Architecture queda rota: el core depende de detalles externos.
- **Minimum Action:** registrar providers por token, por ejemplo:
  - `provide: PRODUCT_REPOSITORY, useClass: ProductRepository`
  - `provide: PDF_SERVICE, useClass: PdfService`
  - y consumir esos tokens desde application.
- **Escalation Path:** puertos explícitos para escritura, lectura, transacciones y servicios externos.
- **Confidence:** altísima.

---

## 4. Evaluación de CQRS

## Qué está bien

1. **Separación explícita de comandos y queries**
   - Los controllers usan `CommandBus` y `QueryBus`.
   - Existen handlers dedicados por operación.

2. **Intención semántica correcta**
   - Mutaciones van por command handlers.
   - Lecturas van por query handlers.

## Qué está incompleto o cosmético

### 4.1 Lectura y escritura comparten el mismo modelo conceptual

**Evidencia:**

- `src/application/cqrs/invoice/queries/list-invoices/list-invoices.handler.ts:15-17`
  devuelve `PaginatedResult<Invoice>` usando `InvoiceRepository`.

**Problema:**

Eso no implementa CQRS profundo. Sigue habiendo un modelo central compartido para lectura y escritura. No hay read models, proyecciones ni consultas optimizadas separadas.

### 4.2 Los comandos retornan entidades

**Evidencia:**

- `src/application/cqrs/product/commands/create-product/create-product.handler.ts:14,25`
  retorna `Promise<Product>`.
- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:23,80`
  retorna `Promise<Invoice>`.

**Problema:**

En una interpretación estricta de CQS/CQRS, un comando debería devolver como mucho un identificador, estado de operación o resultado mínimo, no una entidad completa ya leída nuevamente.

### 4.3 No hay consistencia transaccional de caso de uso completa

**Evidencia:**

- `CreateInvoiceHandler` crea factura, luego ítems, luego decrementa stock en un loop: `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:54-71`.
- Además inyecta `DataSource` en `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts:20`, pero no lo usa.
- `ProductRepository.decrementStock()` abre su propia transacción interna: `src/infrastructure/repositories/product.repository.ts:112-157`.

**Problema:**

La operación completa “crear factura” no es atómica. Si falla un decremento de stock después de guardar factura e ítems, podés quedar con estado inconsistente.

### 4.4 Los queries usan repositorios pensados para el modelo de dominio

**Problema:**

En CQRS más robusto, la lectura suele usar read repositories o query services dedicados, optimizados para respuesta, filtros y serialización.

## Veredicto CQRS

El proyecto **sí usa CQRS a nivel de organización del flujo**, pero **todavía no tiene CQRS maduro**. Hoy el patrón está aplicado más como separación de handlers que como separación real de modelos, dependencias y estrategias de lectura/escritura.

---

## 5. Patrones recomendados para robustecer el backend y desacoplarlo

## Prioridad alta

### 5.1 Ports and Adapters bien cerrados

**Aplicar:** tokens/puertos para repositorios, servicios externos y transacciones.

**Beneficio:** corta el acoplamiento directo entre application e infrastructure.

### 5.2 Unit of Work

**Aplicar:** un `IUnitOfWork` o `TransactionManager` abstracto para casos de uso compuestos.

**Beneficio:** `CreateInvoiceHandler` podría ejecutar toda la operación en una sola transacción lógica.

### 5.3 Rich Domain Model

**Aplicar:** mover reglas como decremento de stock, validaciones de cantidad, cálculo monetario y consistencia a entidades/value objects/domain services puros.

**Beneficio:** el dominio protege invariantes y deja de ser un simple set de propiedades.

### 5.4 Read Model / Query Service

**Aplicar:** separar consultas de lectura en servicios/puertos dedicados que retornen DTOs de lectura.

**Beneficio:** CQRS deja de ser solo estructural y pasa a ser real.

## Prioridad media

### 5.5 Domain Events

**Aplicar:** eventos como `InvoiceCreated`, `StockDecremented`, `ProductStockInsufficient`.

**Beneficio:** desacopla efectos secundarios, auditoría, notificaciones y futuras integraciones.

### 5.6 Specification Pattern

**Aplicar:** para filtros de búsqueda y reglas de consulta reutilizables.

**Beneficio:** evita que lógica de filtros crezca desordenadamente en repositorios o query builders.

### 5.7 Factory / Builder para agregados complejos

**Aplicar:** creación de factura + ítems + cálculos usando una fábrica de dominio o application factory.

**Beneficio:** reduce complejidad del handler y centraliza ensamblado de objetos válidos.

## Prioridad media-baja

### 5.8 Result / Either Pattern

**Aplicar:** para respuestas de casos de uso sin abusar de excepciones técnicas.

**Beneficio:** hace más explícitos errores de negocio vs errores de infraestructura.

### 5.9 Outbox Pattern

**Aplicar:** si en el futuro este backend publica eventos o integra procesos externos.

**Beneficio:** consistencia entre persistencia y mensajería.

---

## 6. Recomendaciones concretas de refactor

1. **Cambiar todos los handlers para depender de interfaces/tokens** y no de repositorios concretos.
2. **Sacar NestJS del dominio**, empezando por `TaxCalculator`.
3. **Eliminar validators con responsabilidad de lectura** y mover esa lógica a query handlers o servicios de aplicación.
4. **Introducir transacción de caso de uso** para `CreateInvoiceHandler`.
5. **Separar read side y write side** al menos en invoice/product listing.
6. **Enriquecer entidades y value objects**, especialmente en dinero, stock y numeración.

---

## 7. Veredicto final

Si te soy brutalmente honesto: **la base está bien orientada, pero todavía no está correctamente desacoplada**.

El proyecto **parece Clean Architecture desde afuera**, pero todavía **no la cumple con rigor** porque la aplicación conoce infraestructura y el dominio conoce NestJS. Lo mismo con CQRS: **la separación existe, pero todavía no hay independencia real entre lectura y escritura**.

La buena noticia es que **esto tiene arreglo sin reescribir todo**. La estructura ya existe; lo que falta es hacer que las dependencias respeten la arquitectura en serio.

---

## 8. Archivos revisados como evidencia principal

- `src/app.module.ts`
- `src/application/cqrs/product/commands/create-product/create-product.handler.ts`
- `src/application/cqrs/product/queries/get-product/get-product.validator.ts`
- `src/application/cqrs/invoice/commands/create-invoice/create-invoice.handler.ts`
- `src/application/cqrs/invoice/queries/list-invoices/list-invoices.handler.ts`
- `src/application/cqrs/invoice/queries/generate-invoice-pdf/generate-invoice-pdf.handler.ts`
- `src/application/services/pdf-service.interface.ts`
- `src/domain/entities/product.entity.ts`
- `src/domain/services/tax-calculator.service.ts`
- `src/domain/repositories/product.repository.interface.ts`
- `src/infrastructure/repositories/product.repository.ts`
