# Módulo de Autenticación y Seguridad

> Documentación de implementación — requisitos funcionales RF-01 al RF-06.

---

## RF-01: Inicio de sesión (Login) con email y contraseña

**El sistema debe permitir el inicio de sesión (Login) solicitando correo electrónico y contraseña.**

### Implementación

| Aspecto | Detalle |
|---|---|
| **Endpoint** | `POST /auth/login` — público (decorado con `@Public()`) |
| **Controller** | `AuthController.login()` — `src/presentation/controllers/auth.controller.ts` |
| **Service** | `AuthService.login()` — `src/infrastructure/services/auth.service.ts` |
| **DTO** | `LoginDto` — `src/presentation/dto/login.dto.ts` |

### Flujo

1. El cliente envía `{ email, password, rememberMe? }` al endpoint `POST /auth/login`.
2. El `LoginThrottlerGuard` verifica que la IP no haya excedido el rate limit (5 intentos por 60s).
3. `AuthService.login()` busca al usuario por email via `UserRepository.findByEmail()`.
4. Si el usuario no existe, retorna `null` → el controller lanza `UnauthorizedException` con código `INVALID_CREDENTIALS`.
5. Si existe, verifica el estado del usuario: `BLOCKED` o `INACTIVE` lanzan excepción con código específico.
6. Compara la contraseña con `bcrypt.compare()`.
7. Si es correcta, resetea `failedLoginAttempts` a 0 y genera tokens JWT + Refresh Token.
8. Si es incorrecta, incrementa `failedLoginAttempts` (ver RF-03).

### Decisiones técnicas

- **bcrypt** para hashing de contraseñas con 10 rondas de sal. Es el estándar de la industria para almacenamiento seguro de credenciales.
- **Rate limiting por IP** (5 intentos/60s) como primera barrera anti-fuerza bruta, aparte del bloqueo por cuenta (RF-03). Esto previene ataques distribuidos contra múltiples cuentas.
- **Mensaje genérico** `auth.errors.invalid_credentials` sin revelar si el email existe o no, para evitar enumeración de usuarios.
- **i18n de errores**: Los códigos de error como `auth.errors.*` permiten internacionalización desde el frontend.

---

## RF-02: Validación de contraseña

**El sistema debe validar que la contraseña cumpla con: longitud entre 8 y 10 caracteres, al menos una letra mayúscula, una minúscula, un número y un carácter especial.**

### Estado actual: ⚠️ IMPLEMENTACIÓN PARCIAL

| Regla | Implementado | Dónde |
|---|---|---|
| Longitud mínima 8 caracteres | ✅ Sí | `ResetPasswordValidator` — `src/application/cqrs/auth/handlers/reset-password/reset-password.validator.ts` |
| | ✅ Sí | `ResetPasswordDto` — `@MinLength(8)` |
| Longitud máxima 10 caracteres | ❌ **No** | No hay validación de tope máximo |
| Al menos una mayúscula | ❌ **No** | No hay validación |
| Al menos una minúscula | ❌ **No** | No hay validación |
| Al menos un número | ❌ **No** | No hay validación |
| Al menos un carácter especial | ❌ **No** | No hay validación |

### Detalle de lo implementado

**Reset de contraseña** (`POST /auth/reset-password`):
- `ResetPasswordDto.newPassword` usa el decorador `@MinLength(8)` de class-validator.
- `ResetPasswordValidator.validate()` verifica adicionalmente: `newPassword.length < 8 → error`, y que `newPassword === confirmPassword`.

**Registro de empleados** (`POST /auth/register` — solo ADMIN):
- La contraseña es **generada automáticamente** por el sistema mediante `crypto.randomUUID()`, no la elige el usuario.
- `RegisterEmployeeHandler` genera: `crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8)`.
- La contraseña generada se envía al empleado por email via evento `EmployeeCredentialsCreatedEvent`.

### Recomendación

Si RF-02 debe aplicarse **tanto al crear como al resetear contraseñas**, falta implementar un validador de política de contraseñas. Se recomienda crear un `PasswordPolicyValidator` en la capa de aplicación con una regex como:

```
/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,10}$/
```

Y aplicarlo tanto en `RegisterEmployeeHandler` (si se permite contraseña manual) como en `ResetPasswordValidator`.

---

## RF-03: Bloqueo de cuenta tras 3 intentos fallidos

**El sistema debe bloquear automáticamente la cuenta de un usuario tras 3 intentos consecutivos de inicio de sesión fallidos.**

### Implementación

| Aspecto | Detalle |
|---|---|
| **Variable** | `AUTH_MAX_FAILED_ATTEMPTS=3` en `.env` |
| **Config** | `auth.maxFailedAttempts` — `src/config/configuration.ts` (default 5, override a 3 en `.env`) |
| **Lógica** | `AuthService.login()` líneas 85-98 — `src/infrastructure/services/auth.service.ts` |
| **Entidad** | `User.failedLoginAttempts` — `src/domain/entities/user.entity.ts` |
| **Estado** | `UserStatus.BLOCKED` — `src/domain/entities/enums/user-status.enum.ts` |

### Flujo de bloqueo

1. En `AuthService.login()`, si la contraseña es incorrecta (`!valid`):
   - Incrementa `user.failedLoginAttempts + 1` y persiste via `userRepository.updateFailedLoginAttempts()`.
   - Si `newAttempts >= maxFailedAttempts`, llama a `user.block()` que cambia el status a `BLOCKED`.
   - Persiste el usuario bloqueado y lanza `UnauthorizedException` con código `USER_BLOCKED`.
2. Si el usuario ya está bloqueado, cualquier intento de login devuelve `USER_BLOCKED` inmediatamente (sin consumir intento).
3. Al iniciar sesión exitosamente, `failedLoginAttempts` se resetea a 0.

### Protección adicional: Rate Limiting por IP

Además del bloqueo por cuenta, el `LoginThrottlerGuard` aplica un límite de **5 requests por 60 segundos por IP** usando `@nestjs/throttler`:

```typescript
// src/app.module.ts
ThrottlerModule.forRoot([
  { name: 'login', ttl: 60000, limit: 5 },
])
```

### Decisiones técnicas

- **Doble capa de seguridad**: Rate limiting por IP (ThrottlerGuard) + bloqueo por cuenta (failedLoginAttempts). El rate limit protege contra ataques de fuerza bruta distribuidos; el bloqueo por cuenta protege contra credenciales comprometidas.
- **El contador por IP es independiente del bloqueo de cuenta**: Una IP puede ser rate-limited sin afectar al usuario, y viceversa.
- **`maxFailedAttempts` configurable por entorno** via variable de entorno `AUTH_MAX_FAILED_ATTEMPTS`, default 5 en código, sobreescrito a 3 en `.env`.

---

## RF-04: JWT para gestión de sesión

**El sistema debe utilizar JWT (JSON Web Token) para gestionar y validar la sesión del usuario de forma segura.**

### Implementación

| Componente | Archivo | Rol |
|---|---|---|
| `JwtModule` | `src/app.module.ts` líneas 237-244 | Configuración global de JWT |
| `AuthService.generateAccessToken()` | `src/infrastructure/services/auth.service.ts` línea 119 | Firma de tokens |
| `AuthService.verifyAccessToken()` | `src/infrastructure/services/auth.service.ts` línea 156 | Verificación de tokens |
| `JwtAuthGuard` | `src/presentation/guards/jwt-auth.guard.ts` | Guard global de validación |
| `AuthService.generateRefreshToken()` | `src/infrastructure/services/auth.service.ts` línea 125 | Refresh tokens via Redis |

### Configuración JWT

```typescript
// src/app.module.ts
JwtModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('jwt.secret'),
    signOptions: { expiresIn: 900 }, // 15 minutos
  }),
  inject: [ConfigService],
}),
```

- **Secret**: `JWT_SECRET` del `.env` (hash SHA-256 de 64 bytes).
- **Access Token TTL**: 900 segundos (15 minutos) — constante `ACCESS_TOKEN_TTL`.
- **Refresh Token**: UUID v4 almacenado en Redis con payload `{ employeeId, employeeCode, role, createdAt }`.

### Payload del Token

```typescript
interface TokenPayload {
  employeeId: string;
  employeeCode: string;
  role: string;
}
```

### Guard global

El `JwtAuthGuard` está registrado como `APP_GUARD` global en `AppModule`:
- Intercepta **todas** las rutas automáticamente.
- Rutas marcadas con `@Public()` se saltan la validación.
- Extrae el token del header `Authorization: Bearer <token>`.
- Si el token es inválido o expiró, lanza `UnauthorizedException`.
- Si es válido, inyecta `request.user = payload` para que los controllers y guards de rol accedan a los datos del usuario.

### Refresh Token Flow

- El endpoint `POST /auth/refresh` recibe el refresh token (UUID), busca en Redis el payload asociado, y si es válido genera un **nuevo** access token (manteniendo el mismo refresh token).
- El refresh token default dura **7 días** (604800s), pero con `rememberMe=true` dura **30 días** (2592000s).
- Al hacer `unlinkGoogle`, se revocan **todos** los refresh tokens del usuario via `redisService.revokeAllUserRefreshTokens()`.

### Decisiones técnicas

- **Dos tipos de token**: Access token JWT (stateless, corta duración) + Refresh token opaco (stateful en Redis). Esto permite revocar sesiones activas sin depender de listas negras de JWT.
- **Refresh token en Redis** (no JWT): Al ser opacos y almacenados en Redis, se pueden revocar individualmente o por lote. Redis permite TTL nativo para expiración automática.
- **TTL corto de access token (15 min)**: Minimiza la ventana de exposición si un token es robado.
- **Guard global con bypass público**: Simplifica la seguridad por defecto (todo requiere autenticación) y permite excepciones explícitas con `@Public()`.

---

## RF-05: Roles ADMIN y VENDEDOR

**El sistema debe gestionar dos roles mínimos: Administrador (acceso total) y Vendedor (acceso limitado a ventas, consulta de productos/clientes y visualización de sus propias facturas).**

### Implementación

| Componente | Archivo | Rol |
|---|---|---|
| `UserRole` enum | `src/application/dto/auth/register-employee.dto.ts` | Definición de roles disponibles |
| `Roles` decorator | `src/presentation/decorators/roles.decorator.ts` | Metadatos de roles requeridos |
| `RolesGuard` | `src/presentation/guards/roles.guard.ts` | Guard global de autorización |
| `AuthService.login()` | payload incluye `role` en el JWT | El rol viaja en el token |

### Roles disponibles

```typescript
enum UserRole {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  CAJERO = 'CAJERO',
  BODEGA = 'BODEGA',
}
```

El sistema define **4 roles** (no solo 2), pero los requisitos mínimos son ADMIN y VENDEDOR.

### Mecanismo

1. **En el login**: El `role` del usuario se incluye en el payload del JWT.
2. **En cada ruta protegida**: El decorador `@Roles('ADMIN')` o `@Roles('VENDEDOR')` declara qué roles pueden acceder.
3. **RolesGuard** (global): Lee los metadatos del decorador y compara con `request.user.role` del JWT. Si no hay match, lanza `ForbiddenException`.
4. **Aplicación**: Los endpoints de administración (listar usuarios, desbloquear, registrar empleados, CRUD de roles) usan `@Roles('ADMIN')`.

### Ejemplos de protección

| Endpoint | Roles | Uso |
|---|---|---|
| `POST /auth/register` | `ADMIN` | Registrar nuevo empleado |
| `POST /auth/unlock/:id` | `ADMIN` | Desbloquear usuario |
| `GET /auth/users` | `ADMIN` | Listar usuarios |
| `POST /auth/login` | `@Public()` | Login público |
| Módulo Ventas | `ADMIN`, `VENDEDOR` | Gestión de ventas |
| Módulo Facturas | `ADMIN`, `VENDEDOR` | Visualización de facturas |

### Decisiones técnicas

- **Rol en el JWT**: Evita una consulta a DB en cada request para verificar permisos. El rol viaja firmado en el token.
- **Decorator + Reflector**: Usa el patrón `SetMetadata` de NestJS + `Reflector` para leer metadatos en el guard. Es el enfoque idiomático de NestJS para autorización.
- **Roles estáticos, no dinámicos**: Se definen como enum en código. Si se necesitaran roles dinámicos (creados por usuario), habría que migrar a un sistema de permisos más granular.
- **ADMIN como único rol con acceso a `/auth/users` y `/auth/unlock`**: Asegura que solo administradores puedan gestionar usuarios y desbloquear cuentas.

---

## RF-06: Administrador desbloquea cuentas

**El sistema debe permitir al Administrador desbloquear las cuentas de usuarios que hayan sido bloqueadas.**

### Implementación

| Aspecto | Detalle |
|---|---|
| **Endpoint** | `POST /auth/unlock/:id` — solo ADMIN |
| **Controller** | `AuthController.unlockUser()` — `src/presentation/controllers/auth.controller.ts` línea 174 |
| **Service** | `AuthService.unlockUser()` — `src/infrastructure/services/auth.service.ts` línea 168 |
| **Entidad** | `User.unlock()` — `src/domain/entities/user.entity.ts` línea 104 |

### Flujo

1. Admin autenticado envía `POST /auth/unlock/:id` con el UUID del usuario.
2. `RolesGuard` verifica que el rol sea `ADMIN` (del JWT).
3. `AuthService.unlockUser(userId)`:
   - Busca al usuario por ID via `UserRepository.findById()`.
   - Si no existe, retorna silenciosamente (no expone existencia del usuario).
   - Llama a `user.unlock()` que cambia el status de `BLOCKED` a `ACTIVE`.
   - Persiste el cambio via `UserRepository.update()`.
   - Resetea `failedLoginAttempts` a 0 via `UserRepository.updateFailedLoginAttempts()`.
4. Retorna `{ message: 'User unlocked successfully' }`.

### Validaciones de dominio

```typescript
// src/domain/entities/user.entity.ts
unlock(): void {
  if (this._status !== UserStatus.BLOCKED) {
    throw new BusinessRuleException('User is not blocked');
  }
  this._status = UserStatus.ACTIVE;
  this._updatedAt = new Date();
}
```

La entidad de dominio protege el invariante: **solo usuarios bloqueados pueden ser desbloqueados**. Si se intenta desbloquear un usuario ACTIVE o INACTIVE, lanza `BusinessRuleException`.

### Decisiones técnicas

- **Regla de negocio en la entidad de dominio**: `User.unlock()` encapsula la validación en el core de dominio, no en el service ni en el controller. Esto asegura que ningún caso de uso pueda desbloquear un usuario no bloqueado.
- **Reset de `failedLoginAttempts`**: Al desbloquear, se limpia el contador de intentos fallidos para que el usuario comience desde cero.
- **Retorno silencioso si no encuentra el usuario**: Por seguridad, no se revela si un UUID de usuario existe o no. El admin recibe siempre éxito si la petición es válida.

---

## Resumen de archivos involucrados

| Archivo | RF |
|---|---|
| `src/presentation/controllers/auth.controller.ts` | RF-01, RF-04, RF-05, RF-06 |
| `src/presentation/dto/login.dto.ts` | RF-01 |
| `src/presentation/guards/jwt-auth.guard.ts` | RF-04 |
| `src/presentation/guards/login-throttler.guard.ts` | RF-01, RF-03 |
| `src/presentation/guards/roles.guard.ts` | RF-05 |
| `src/presentation/decorators/public.decorator.ts` | RF-01, RF-04 |
| `src/presentation/decorators/roles.decorator.ts` | RF-05 |
| `src/infrastructure/services/auth.service.ts` | RF-01, RF-03, RF-04, RF-06 |
| `src/infrastructure/redis/redis.service.ts` | RF-04 |
| `src/infrastructure/cqrs/auth/handlers/register-employee/RegisterEmployeeHandler.ts` | RF-02 |
| `src/domain/entities/user.entity.ts` | RF-03, RF-06 |
| `src/domain/entities/enums/user-status.enum.ts` | RF-03 |
| `src/application/dto/auth/register-employee.dto.ts` | RF-05 |
| `src/application/dto/auth/reset-password.dto.ts` | RF-02 |
| `src/application/cqrs/auth/handlers/reset-password/reset-password.validator.ts` | RF-02 |
| `src/application/cqrs/auth/handlers/register-employee/register-employee.handler.ts` | RF-02 |
| `src/config/configuration.ts` | RF-03 |
| `src/app.module.ts` | RF-01, RF-03, RF-04, RF-05 |
| `.env` (variable `AUTH_MAX_FAILED_ATTEMPTS`) | RF-03 |

---

## Pendientes / Gaps identificados

| RF | Gap | Impacto |
|---|---|---|
| RF-02 | No se valida longitud máxima (10), mayúscula, minúscula, número ni carácter especial | Las contraseñas pueden no cumplir la política de seguridad definida |
| RF-02 | La contraseña generada automáticamente con `crypto.randomUUID()` no garantiza caracteres especiales | El empleado recibe una contraseña que podría no cumplir el estándar si se empieza a validar después |
| RF-05 | Roles CAJERO y BODEGA existen en el enum pero no están documentados en los requisitos | El sistema es más flexible de lo que pide el RF |
