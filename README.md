# Sell Point - Backend (PDV)

Backend del sistema de Punto de Venta (PDV) construido con **NestJS**, **Clean Architecture** y **CQRS**.

## 🚀 Tecnologías

- **Framework**: [NestJS](https://nestjs.com/)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL / Oracle (TypeORM multi-engine)
- **ORM**: TypeORM
- **Cache/Sesiones**: Redis
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

Asegurate de tener el archivo `.env` en la raíz del proyecto configurado para tu base de datos:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
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

Antes de ejecutar las migraciones, asegurate de haber creado la base de datos `sellpoint` en tu servidor correspondiente. Luego, ejecutá las migraciones para estructurar las tablas:

```bash
npm run typeorm:migration:run
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

## 🧪 Comandos útiles

```bash
# Build y tests
npm run build
npm run test
npm run test:cov
npm run test:e2e

# Seed de datos
npm run db:seed
npm run db:seed:users

# Migraciones
npm run typeorm:migration:run
npm run typeorm:migration:generate -- NombreDeLaMigracion
npm run typeorm:migration:revert

# Formato
npm run format

# Stack local de despliegue
docker compose up --build
```

## 🚀 Despliegue y nube

- **Redis**: servicio cloud ya existente.
- **Postgres**: objetivo de nube en **Neon**.
- **Oracle**: solo local.
- Antes de subir, validar el stack con **Dockerfile** y **docker-compose** en local.

## 🏗️ Arquitectura


El proyecto sigue una arquitectura en capas limpias (Clean Architecture):
- **`domain/`**: Entidades del negocio, interfaces de repositorios, value objects y reglas pura (ej: la calculadora de IVA).
- **`application/`**: Casos de uso (separados en Commands y Queries por CQRS) y los DTOs de transferencia.
- **`infrastructure/`**: Implementación dura de repositorios (TypeORM), integraciones externas (PDFKit) y migraciones.
- **`presentation/`**: Endpoints (Controladores REST), filtros de excepciones e interceptores.

---

## 📁 Documentación

El proyecto incluye documentación adicional en la carpeta `docs/`:

| Archivo | Descripción |
|---------|-------------|
| [Diagrama_ER.pdf](docs/Diagrama_ER.pdf) | Diagrama Entidad-Relación del modelo de datos |
| [tablas.md](docs/tablas.md) | Descripción detallada de todas las tablas, campos, índices y relaciones |
| [justificaciones_ultimos_sdd.md](docs/justificaciones_ultimos_sdd.md) | Justificación resumida de las decisiones tomadas en los últimos SDD |
