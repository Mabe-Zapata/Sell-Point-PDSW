import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class EnhanceIdempotencyKeys1800000000018 implements MigrationInterface {
  name = 'EnhanceIdempotencyKeys1800000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('IDEMPOTENCY_KEYS');
    if (!table) return;

    const ensureColumn = async (column: TableColumn): Promise<void> => {
      const exists = table.columns.some((col) => col.name === column.name);
      if (!exists) {
        await queryRunner.addColumn('IDEMPOTENCY_KEYS', column);
      }
    };

    await ensureColumn(new TableColumn({
      name: 'REQ_HASH',
      type: 'varchar',
      length: '128',
      isNullable: true,
    }));

    await ensureColumn(new TableColumn({
      name: 'STATUS',
      type: 'varchar',
      length: '20',
      isNullable: true,
    }));

    await ensureColumn(new TableColumn({
      name: 'UPD_AT',
      type: 'timestamp',
      precision: 6,
      isNullable: true,
    }));

    await queryRunner.query(`
      UPDATE "IDEMPOTENCY_KEYS"
      SET "STATUS" = CASE
        WHEN "IDP_RES" IS NOT NULL THEN 'COMPLETED'
        ELSE 'FAILED'
      END
      WHERE "STATUS" IS NULL
    `);

    await queryRunner.query(`
      UPDATE "IDEMPOTENCY_KEYS"
      SET "UPD_AT" = "CRE_AT"
      WHERE "UPD_AT" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('IDEMPOTENCY_KEYS');
    if (!table) return;

    for (const colName of ['UPD_AT', 'STATUS', 'REQ_HASH']) {
      const exists = table.columns.some((col) => col.name === colName);
      if (exists) {
        await queryRunner.dropColumn('IDEMPOTENCY_KEYS', colName);
      }
    }
  }
}
