import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: FixSalesColumnCase1800000000012
 *
 * Rename SALES primary key column from "ID" to "id" in Oracle.
 *
 * Root cause: 1800000000003-AddPartitioningScaffold.ts created the SALES table
 * with unquoted identifiers in Oracle, causing the PK column to be stored as
 * uppercase "ID" instead of lowercase "id" like every other table.
 *
 * PostgreSQL: uses quoted "id" → preserved as lowercase
 * Oracle: no quotes → converted to uppercase "ID"
 *
 * This creates a mismatch: TypeORM generates INSERT INTO "SALES"("id", ...)
 * and Oracle throws ORA-00904 because the column is actually "ID".
 */
export class FixSalesColumnCase1800000000012 implements MigrationInterface {
  name = 'FixSalesColumnCase1800000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;

    if (dbType !== 'oracle') {
      console.log('[FixSalesColumnCase] Non-Oracle DB — nothing to do.');
      return;
    }

    // Check current column name in Oracle data dictionary
    const result = await queryRunner.query(`
      SELECT column_name
      FROM user_tab_columns
      WHERE table_name = 'SALES'
        AND column_name IN ('ID', 'id')
    `);

    if (!result || result.length === 0) {
      console.log('[FixSalesColumnCase] No SALES id column found — skipping.');
      return;
    }

    const columnName = result[0].COLUMN_NAME;

    if (columnName === 'ID') {
      console.log('[FixSalesColumnCase] Renaming SALES."ID" -> "id"...');
      await queryRunner.query('ALTER TABLE SALES RENAME COLUMN "ID" TO "id"');
      console.log('[FixSalesColumnCase] Done.');
    } else {
      console.log(`[FixSalesColumnCase] Column already named "${columnName}" — nothing to do.`);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No downgrade — this is a one-way normalization fix
    console.log('[FixSalesColumnCase] down() called — no-op.');
  }
}
