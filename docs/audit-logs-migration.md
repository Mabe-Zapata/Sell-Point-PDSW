# Audit logs migration

Creamos la migración `1800000000029-CreateAuditLogs.ts` para PostgreSQL con la tabla `audit_logs`, FK opcional a `USERS` y los índices pedidos por sprint.

## Quick path

1. Ejecutar staging:
   - `npm run typeorm:migration:run`
2. Verificar tabla e índices:
   - `SELECT * FROM audit_logs LIMIT 1;`
   - `SELECT indexname FROM pg_indexes WHERE tablename = 'audit_logs';`
3. Rollback si hace falta:
   - `npm run typeorm:migration:revert`

## Schema

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `table_name` | `varchar(128)` | audited table |
| `record_id` | `uuid` | affected record |
| `action` | `ENUM(INSERT, UPDATE, DELETE)` | audit action |
| `user_id` | `uuid` | nullable FK to `USERS.id` |
| `email` | `varchar(255)` | nullable |
| `rol` | `varchar(50)` | nullable |
| `changed_columns` | `jsonb` | nullable |
| `old_values` | `jsonb` | nullable |
| `new_values` | `jsonb` | nullable |
| `ip` | `varchar(45)` | nullable |
| `user_agent` | `varchar(512)` | nullable |
| `metadata` | `jsonb` | nullable |
| `created_at` | `timestamp` | defaults to current timestamp |

## Required indexes

- `IDX_AUDIT_LOGS_TABLE_NAME`
- `IDX_AUDIT_LOGS_RECORD_ID`
- `IDX_AUDIT_LOGS_USER_ID`
- `IDX_AUDIT_LOGS_CREATED_AT`
- `IDX_AUDIT_LOGS_ACTION`

## Staging validation checklist

- [ ] `audit_logs` exists after migration
- [ ] the five indexes exist
- [ ] existing tables were not altered
- [ ] `npm run typeorm:migration:revert` drops `audit_logs` cleanly

## Production note

No ejecuté producción desde acá porque este workspace no tiene acceso al entorno. Lo que sí dejé preparado es:

- migración versionada
- comando de ejecución: `npm run typeorm:migration:run`
- comando de rollback: `npm run typeorm:migration:revert`
- checklist para confirmar que no se tocaron tablas existentes
