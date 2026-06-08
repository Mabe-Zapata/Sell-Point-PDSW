# Sell-Point Backend — Critical Setup & Operation Guide

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | `>= 22.12.0` | Check with `node -v` |
| Docker & Docker Compose | latest | For PostgreSQL/Oracle and Redis containers |
| npm | Comes with Node | Project uses `package-lock.json` |
| TypeORM CLI | Global or local | `npm i -g typeorm` or via `npm run` scripts |
| NestJS CLI | Global (optional) | `npm i -g @nestjs/cli` |

## 2. Environment Variables

The backend reads from `Sell-Point-PDSW/.env`. Copy `.env.example` to `.env` and fill each variable.

### Application
| Variable | Required | Description |
|----------|----------|-------------|
| `APP_MODE` | Yes | `local` or `production`. Switches between local and cloud DB/Redis URLs |
| `PORT` | No | API port (default `3000`) |

### Database
| Variable | Required | Description |
|----------|----------|-------------|
| `DB_TYPE` | Yes | `postgres` or `oracle` |
| `POSTGRES_HOST` | Yes (local) | PostgreSQL host |
| `POSTGRES_PORT` | Yes (local) | PostgreSQL port |
| `POSTGRES_DB` | Yes (local) | Database name |
| `POSTGRES_USER` | Yes (local) | Database user |
| `POSTGRES_PASSWORD` | Yes (local) | Database password |
| `POSTGRES_CLOUD_URL` | Yes (production) | Full connection string for cloud PostgreSQL |

### Redis
| Variable | Required | Description |
|----------|----------|-------------|
| `REDIS_URL` | Yes (local) | Full Redis connection string. Format: `redis://localhost:6379` or `redis://user:pass@host:6379` |
| `REDIS_URL_PROD` | Yes (prod) | Production Redis URL (Upstash). Format: `rediss://default:token@host:port`. Falls back to `REDIS_URL` if not set |
| `REDIS_HOST` | No | Fallback host (used only if `REDIS_URL` is not set). Default: `localhost` |
| `REDIS_PORT` | No | Fallback port. Default: `6379` |
| `REDIS_PASSWORD` | No | Fallback password (used only if `REDIS_URL` is not set) |

> **Important**: `REDIS_URL` toma precedence — si está definido, se ignora `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`. En tu `.env` actual tenés `REDIS_URL=redis://localhost:6379` sin credenciales, así que funciona directamente.

### JWT
| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | Secret for signing access tokens. Minimum 32 characters |

### Google OAuth (Firebase)
| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_ADMIN_SDK_PATH` | Yes | Path to Firebase Admin service account JSON, e.g. `./secrets/firebase-adminsdk.json` |

> **Fallback chain**: Si `FIREBASE_ADMIN_SDK_PATH` no está definido, el código intenta usar `GOOGLE_APPLICATION_CREDENTIALS` (variable estándar de Google) o Application Default Credentials. Si ninguna existe, Firebase fallará.

### Email (Brevo)
| Variable | Required | Description |
|----------|----------|-------------|
| `BREVO_API_KEY` | Yes | Brevo API key |
| `BREVO_SENDER_EMAIL` | Yes | Sender email address |
| `BREVO_SENDER_NAME` | Yes | Sender display name |
| `BREVO_TEMPLATE_ORDER_CONFIRMATION_ID` | Yes | Brevo template ID for order confirmations |
| `BREVO_TEMPLATE_SALE_CANCELLED_ID` | Yes | Brevo template ID for cancelled sales |
| `BREVO_TEMPLATE_INVOICE_ID` | Yes | Brevo template ID for invoices |

> **Important:** If Brevo template IDs are missing or incorrect, email sending will fail silently or throw Brevo API errors.

## 3. Database Setup

### Engine Support
The backend supports **PostgreSQL** and **Oracle** via the `DB_TYPE` environment variable.

### ⚠️ Critical Safety Rule
In `src/config/typeorm.config.ts`, `synchronize` is **forced to `false`**.  
**Never** set `TYPEORM_SYNCHRONIZE=true` in production — it can drop tables and cause data loss.

### Migrations (Mandatory)
All schema changes must use migrations. Never modify schema directly.

```bash
# Run pending migrations
npm run typeorm:migration:run

# Generate a new migration (after entity changes)
npm run typeorm:migration:generate -- src/infrastructure/database/migrations/MigrationName

# Create empty migration
npm run typeorm:migration:create -- src/infrastructure/database/migrations/MigrationName
```

### Multi-Engine Column Types
When writing migrations that must work on both engines:
- Use `dbBooleanColumn()` helper instead of `type: 'boolean'` (Oracle uses `number`)
- Use `dbLongTextColumn()` helper instead of `type: 'text'` with length constraints
- Avoid `type: 'number'` unless explicitly targeting Oracle

### Seeding
After migrations, seed the initial data:

```bash
npm run db:seed:users    # Seeds admin user, roles, etc.
npm run db:seed:pos      # Seeds POS-related data
```

## 4. Redis Setup

### What Redis Is Used For
- **`/auth/refresh` endpoint**: Stores and verifies user refresh tokens with TTL
- **Token revocation**: When a user logs out or resets password, their refresh tokens are revoked
- **Session invalidation**: Used to force-logout users by revoking all their tokens

### What Happens If Redis Is Down
Users will fail to refresh their session once their short-lived JWT access token expires. They will be silently logged out with no error message to the client.

### Local Setup
Start Redis via Docker Compose:

```bash
docker compose up -d redis
```

The local container is named `sellpoint-redis` on port `6379`.

## 5. Google OAuth Setup

Google OAuth is handled through **Firebase** (not raw Google Client ID/Secret).

### Backend Flow
1. Frontend uses Firebase Web SDK (`signInWithPopup`) to get a Firebase `idToken`
2. Frontend sends the `idToken` to `POST /auth/link-google`
3. Backend uses **Firebase Admin SDK** (`verifyIdToken`) to validate the token
4. On success, the user's `googleId` and `googleEmail` are stored in the database

### Required Setup
1. Go to [Firebase Console](https://console.firebase.google.com) and create a project
2. Enable **Google Sign-In** in Authentication → Sign-in providers
3. Go to **Project Settings → Service Accounts**
4. Click **Generate new private key** → saves a `.json` file
5. Save that JSON as `secrets/firebase-adminsdk.json` relative to the project root (`Sell-Point-PDSW/secrets/firebase-adminsdk.json`)
6. Set `FIREBASE_ADMIN_SDK_PATH=./secrets/firebase-adminsdk.json` in `.env`

> **Nota**: La carpeta `secrets/` no debe commitearse al repo. Ya está ignorada por `.gitignore`.

### If Missing
If `FIREBASE_ADMIN_SDK_PATH` points to a non-existent file or the JSON is invalid:
- `POST /auth/link-google` → `401 Unauthorized`
- `POST /auth/unlink-google` → `401 Unauthorized`
- Any feature relying on Firebase token verification will fail securely (throws auth error)

## 6. Email Service (Brevo)

### What Emails Are Sent
- **Order Confirmation**: After a sale is completed
- **Sale Cancelled**: When a sale is cancelled
- **Invoice**: Invoice document delivery

### Configuration
The backend uses [Brevo](https://www.brevo.com) (formerly Sendinblue) API — not raw SMTP.
Set these in `.env`:
```
BREVO_API_KEY=your-api-key
BREVO_SENDER_EMAIL=orders@sellpoint.com
BREVO_SENDER_NAME=SellPoint
BREVO_TEMPLATE_ORDER_CONFIRMATION_ID=123
BREVO_TEMPLATE_SALE_CANCELLED_ID=456
BREVO_TEMPLATE_INVOICE_ID=789
```

### Template IDs
Log into Brevo → Transactional → Templates. Copy the numeric ID from each template URL.

### If Missing or Incorrect
- Email sending fails silently (logged as error but doesn't break the sale flow)
- Brevo API returns error codes that appear in server logs

## 7. Running Locally

### Terminal 1 — Infrastructure
```bash
cd Sell-Point-PDSW
docker compose up -d postgres redis
# or oracle instead of postgres depending on DB_TYPE
```

### Terminal 2 — Backend
```bash
cd Sell-Point-PDSW
npm install

# Only on first run or after schema changes
npm run typeorm:migration:run
npm run db:seed:users
npm run db:seed:pos

npm run start:dev
```

### Terminal 3 — Frontend
```bash
cd Sell-Point-Frontend
npm install
npm run dev
```

## 8. Common Issues & Troubleshooting

| Issue | Likely Cause | Fix |
|-------|-------------|-----|
| `ORA-01017` invalid credentials (Oracle) | Docker initialization failure | `docker compose restart oracle` or `docker compose down -v` (wipes volumes) |
| `/auth/refresh` returns 500 | Redis connection failed | Check `REDIS_URL` matches your docker instance |
| Google OAuth returns 401 | Missing or invalid Firebase service account JSON | Verify `FIREBASE_ADMIN_SDK_PATH` points to a valid JSON file |
| TypeORM migration fails on Postgres | Accidental `type: 'number'` column (Oracle-specific) | Use `dbBooleanColumn()` and `dbLongTextColumn()` helpers instead |
| `synchronize: true` quietly drops columns | `TYPEORM_SYNCHRONIZE=true` accidentally set | Always keep it `false`; use migrations only |
| Silent logouts after ~15 minutes | Redis went down or `REDIS_URL` changed | Check Redis container is running and `REDIS_URL` is correct |
| Brevo emails not sending | Wrong or missing Brevo template IDs | Verify template IDs in `.env` match Brevo dashboard exactly |
| CORS errors in browser | Backend `CORS_ALLOWED_ORIGINS` doesn't include frontend URL | Add `http://localhost:4321` to the allowed origins list |

## 9. Architecture Notes

### CQRS + Clean Architecture
```
src/
├── application/     # Commands, Queries, DTOs, CQRS handlers
├── domain/          # Entities, value objects, domain events, repository interfaces
├── infrastructure/  # TypeORM repositories, Redis, listeners, services
└── presentation/    # Controllers, guards, decorators
```

### Soft Delete Policy
All core entities (branches, products, users, etc.) use `is_active: boolean` instead of physical deletion.  
**All queries must filter `is_active: true`** — there are no physical deletes in the domain.

### Multi-Engine Database
The backend is designed to work with PostgreSQL and Oracle simultaneously. Use the provided column helpers to avoid engine-specific syntax errors in migrations.

### Frontend Stack
- **Astro** handles routing and static generation
- **Angular** (`@analogjs/astro-angular`) handles interactive features (profile page, OAuth linkage, POS)
