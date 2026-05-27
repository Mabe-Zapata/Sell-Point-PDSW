import { MigrationInterface, QueryRunner, Table, TableColumn, TableIndex } from 'typeorm';

/**
 * Migration: AddIdempotencyTable
 *
 * Creates IDEMPOTENCY_KEYS table for persistent idempotency storage.
 * Replaces the in-memory Map approach that lost keys on server restart.
 *
 * Uses database-agnostic approach with safety checks:
 * - hasTable() check before creating table
 * - try-catch around createTable for Oracle edge cases
 * - Can run multiple times safely
 *
 * NOTE: On Oracle, isPrimary already implies unique. Using both isPrimary and isUnique
 * on the same column can cause ORA-02261 due to constraint naming conflicts.
 */
export class AddIdempotencyTable1800000000010 implements MigrationInterface {
  name = 'AddIdempotencyTable1800000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Safety check: skip if table already exists
    const tableExists = await queryRunner.hasTable('IDEMPOTENCY_KEYS');
    if (tableExists) {
      return;
    }

    const dbType = queryRunner.connection.options.type;
    const longTextType = dbType === 'oracle' ? 'varchar2' : dbType === 'postgres' ? 'text' : 'text';

    const col = (name: string, type: string, opts: Partial<TableColumn> = {}): TableColumn => {
      return new TableColumn({ name, type, ...opts });
    };

    try {
      await queryRunner.createTable(
        new Table({
          name: 'IDEMPOTENCY_KEYS',
          columns: [
            // Note: isPrimary implies unique, don't add isUnique on same column
            col('IDP_KEY', 'varchar', { length: '255', isPrimary: true }),
            col('IDP_RES', longTextType, { isNullable: true }),
            col('CRE_AT', 'timestamp', { precision: 6 }),
          ],
        }),
        false,
      );
    } catch (error: any) {
      // Oracle can fail with ORA-02261 if table partially exists from a failed attempt.
      // In this case, check again and skip if it now exists.
      if (error.message && error.message.includes('ORA-02261')) {
        const existsAfterError = await queryRunner.hasTable('IDEMPOTENCY_KEYS');
        if (existsAfterError) {
          return; // Table was created by this migration despite error
        }
      }
      throw error; // Re-throw if it's a different error
    }

    await queryRunner.createIndex(
      'IDEMPOTENCY_KEYS',
      new TableIndex({ name: 'IDX_IDP_CREATED_AT', columnNames: ['CRE_AT'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableExists = await queryRunner.hasTable('IDEMPOTENCY_KEYS');
    if (!tableExists) {
      return;
    }

    await queryRunner.dropIndex('IDEMPOTENCY_KEYS', 'IDX_IDP_CREATED_AT');
    await queryRunner.dropTable('IDEMPOTENCY_KEYS');
  }
}