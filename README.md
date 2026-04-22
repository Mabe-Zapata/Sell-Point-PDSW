# Sell Point - Backend (PDV)

Este es el backend del sistema de Punto de Venta (PDV), construido con **NestJS** aplicando patrones arquitectónicos modernos como **CQRS** (Command Query Responsibility Segregation) y enfocado en el Dominio.

## 🚀 Tecnologías

- **Framework**: [NestJS](https://nestjs.com/)
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL
- **ORM**: TypeORM
- **Patrones**: CQRS (`@nestjs/cqrs`)
- **Documentación**: Swagger / OpenAPI
- **PDF Generation**: `pdfkit`

## 📦 Módulos Principales

El sistema está dividido en tres dominios principales:

1. **Clientes (Customers)**:
   - Registro y gestión de clientes con validación de cédula única.
   - Búsqueda genérica inteligente por cédula, nombre o apellido.
2. **Productos (Products)**:
   - Gestión de inventario, precios y stock.
   - Control de concurrencia y descuento atómico de stock.
   - Búsqueda genérica por ID, código o nombre.
3. **Facturas (Invoices)**:
   - Generación de facturas con cálculo automático de subtotales, IVA y total.
   - Búsqueda por ID exacto de la factura o datos parciales del cliente.
   - Generación automática de comprobantes en PDF.

## 🛠️ Configuración y Ejecución

### 1. Variables de Entorno

Asegurate de tener el archivo `.env` en la raíz del proyecto configurado para tu base MySQL:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=
DATABASE_NAME=sellpoint
IVA_PERCENTAGE=15
PORT=3000
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Base de Datos y Migraciones

Antes de ejecutar las migraciones, asegurate de haber creado la base de datos `sellpoint` en tu servidor MySQL. Luego, ejecutá las migraciones para estructurar las tablas:

```bash
npx typeorm-ts-node-commonjs migration:run -d src/config/typeorm.config.ts
```

### 4. Ejecución del Servidor

```bash
# Modo de desarrollo (live-reload)
npm run start:dev

# Compilación y producción
npm run build
npm run start:prod
```

## 📚 Documentación de la API (Swagger)

La API cuenta con una interfaz gráfica interactiva para explorar y probar todos los endpoints. Una vez levantado el servidor, ingresá desde tu navegador a:

👉 **`http://localhost:3000/api/docs`**

## 🏗️ Arquitectura

El proyecto sigue una arquitectura en capas limpias (Clean Architecture):
- **`domain/`**: Entidades del negocio, interfaces de repositorios, value objects y reglas pura (ej: la calculadora de IVA).
- **`application/`**: Casos de uso (separados en Commands y Queries por CQRS) y los DTOs de transferencia.
- **`infrastructure/`**: Implementación dura de repositorios (TypeORM), integraciones externas (PDFKit) y migraciones.
- **`presentation/`**: Endpoints (Controladores REST), filtros de excepciones e interceptores.
