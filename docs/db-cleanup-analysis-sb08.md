# SB-08 Initial DB Cleanup Analysis

No destructive migration is included in M-01.

## Exclusions

- `ERROR_LOGS` fields are excluded because SB-06 uses them for persisted exception traces.
- `DEL_AT` fields are excluded because SB-07 uses them for soft delete.
- New lot fields are excluded because they support FIFO, profit snapshots, and invoice traceability.

## Candidate review process

Before removing any column, verify usage in:

1. TypeORM entities and migrations.
2. Repository/query-service filters.
3. Controller DTOs and frontend mappings.
4. Error log listeners and soft-delete flows.

Any removal must be reviewed with Kerly before a migration is created.
