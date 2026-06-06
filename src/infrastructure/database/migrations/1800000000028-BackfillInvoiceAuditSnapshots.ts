import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class BackfillInvoiceAuditSnapshots1800000000028 implements MigrationInterface {
  name = 'BackfillInvoiceAuditSnapshots1800000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);

    // Backfill customer snapshots
    await queryRunner.query(`
      UPDATE "INVOICES" i
      SET
        "CUS_NAM_SNA" = TRIM(
          COALESCE(cus."NOM_CUS", '') || ' ' || COALESCE(cus."APE_CUS", '')
        ),
        "CUS_CED_SNA" = cus."CED_CUS",
        "CUS_EMA_SNA" = cus."EMA_CUS"
      FROM "SALES" sal
      JOIN "CUSTOMERS" cus ON cus.id = sal."CUS_ID"
      WHERE i."SAL_ID" = sal.id
        AND i."CUS_NAM_SNA" IS NULL
        AND sal."CUS_ID" IS NOT NULL
    `);

    // Backfill invoices with no linked customer (Consumidor Final)
    await queryRunner.query(`
      UPDATE "INVOICES" i
      SET
        "CUS_NAM_SNA" = 'Consumidor Final',
        "CUS_CED_SNA" = '9999999999',
        "CUS_EMA_SNA" = NULL
      WHERE i."SAL_ID" IN (
        SELECT s.id FROM "SALES" s WHERE s."CUS_ID" IS NULL
      )
        AND i."CUS_NAM_SNA" IS NULL
    `);

    // Backfill cashier snapshots
    await queryRunner.query(`
      UPDATE "INVOICES" i
      SET
        "CAS_NAM_SNA" = TRIM(
          COALESCE(usr."FIR_NAM_USR", '') || ' ' || COALESCE(usr."LAS_NAM_USR", '')
        ),
        "CAS_USR_SNA" = usr."USR_USR",
        "CAS_EMP_SNA" = usr."EMP_ID"
      FROM "SALES" sal
      JOIN "USERS" usr ON usr.id = sal."CAS_USR_ID"
      WHERE i."SAL_ID" = sal.id
        AND i."CAS_NAM_SNA" IS NULL
    `);

    // Create invoice audit log table
    const auditTableExists = await queryRunner.getTable('INVOICE_AUDIT_LOG');
    if (!auditTableExists) {
      await queryRunner.createTable(
        new Table({
          name: 'INVOICE_AUDIT_LOG',
          columns: [
            { name: 'id', type: 'uuid', isPrimary: true, generationStrategy: 'uuid' },
            { name: 'INV_ID', type: 'uuid' },
            { name: 'ACT_TYP', type: 'varchar', length: '30' },
            { name: 'USR_ID', type: 'varchar', length: '50' },
            { name: 'USR_NAM', type: 'varchar', length: '255' },
            { name: 'EMP_ID', type: 'varchar', length: '50', isNullable: true },
            { name: 'DET_OLD', type: 'jsonb', isNullable: true },
            { name: 'DET_NEW', type: 'jsonb', isNullable: true },
            { name: 'IP_ADR', type: 'varchar', length: '45', isNullable: true },
            { name: 'USE_AGT', type: 'varchar', length: '500', isNullable: true },
            { name: 'CRE_AT', type: 'timestamp', default: 'CURRENT_TIMESTAMP' },
          ],
        }),
      );

      // Indexes (table name must be quoted since it was created with quotes)
      await queryRunner.query(`
        CREATE INDEX IDX_INV_AUD_INV_ID ON "INVOICE_AUDIT_LOG" ("INV_ID")
      `);
      await queryRunner.query(`
        CREATE INDEX IDX_INV_AUD_USR_ID ON "INVOICE_AUDIT_LOG" ("USR_ID")
      `);
      await queryRunner.query(`
        CREATE INDEX IDX_INV_AUD_ACT_TYP ON "INVOICE_AUDIT_LOG" ("ACT_TYP")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const auditTable = await queryRunner.getTable('INVOICE_AUDIT_LOG');
    if (auditTable) {
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_INV_AUD_ACT_TYP`);
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_INV_AUD_USR_ID`);
      await queryRunner.query(`DROP INDEX IF EXISTS IDX_INV_AUD_INV_ID`);
      await queryRunner.dropTable('INVOICE_AUDIT_LOG');
    }

    await queryRunner.query(`
      UPDATE "INVOICES"
      SET
        "CUS_NAM_SNA" = NULL,
        "CUS_CED_SNA" = NULL,
        "CUS_EMA_SNA" = NULL,
        "CAS_NAM_SNA" = NULL,
        "CAS_USR_SNA" = NULL,
        "CAS_EMP_SNA" = NULL
      WHERE "CUS_NAM_SNA" IS NOT NULL
         OR "CUS_CED_SNA" IS NOT NULL
         OR "CUS_EMA_SNA" IS NOT NULL
         OR "CAS_NAM_SNA" IS NOT NULL
         OR "CAS_USR_SNA" IS NOT NULL
         OR "CAS_EMP_SNA" IS NOT NULL
    `);
  }
}
