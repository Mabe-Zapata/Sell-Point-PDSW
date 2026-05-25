import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

/**
 * Migration: AddIdempotencyTable
 *
 * Creates IDEMPOTENCY_KEYS table for persistent idempotency storage.
 * Replaces the in-memory Map approach that lost keys on server restart.
 */
export class AddIdempotencyTable1800000000004 implements MigrationInterface {
  name = 'AddIdempotencyTable1800000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const longTextType = dbType === 'oracle' ? 'varchar2' : 'text';

    await queryRunner.createTable(
      new Table({
        name: 'IDEMPOTENCY_KEYS',
        columns: [
          { name: 'IDP_KEY', type: 'varchar', length: '255', isPrimary: true },
          { name: 'IDP_RES', type: longTextType, isNullable: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    await queryRunner.createIndex(
      'IDEMPOTENCY_KEYS',
      new TableIndex({ name: 'IDX_IDP_CREATED_AT', columnNames: ['CRE_AT'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('IDEMPOTENCY_KEYS');
  }
}
