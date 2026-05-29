import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AlterIdempotencyResponseColumn1800000000019 implements MigrationInterface {
  name = 'AlterIdempotencyResponseColumn1800000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('IDEMPOTENCY_KEYS');
    if (!table) return;

    const col = table.columns.find((c) => c.name === 'IDP_RES');
    if (!col) return;

    const dbType = queryRunner.connection.options.type;

    if (dbType === 'oracle') {
      const currentLen = Number(col.length) || 0;
      if (currentLen > 0 && currentLen < 4000) {
        await queryRunner.query(
          `ALTER TABLE "IDEMPOTENCY_KEYS" MODIFY "IDP_RES" VARCHAR2(4000)`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // No revertimos el tamaño por seguridad — no rompe nada tenerlo más grande
  }
}
