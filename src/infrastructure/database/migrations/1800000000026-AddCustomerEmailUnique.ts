import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddCustomerEmailUnique1800000000026 implements MigrationInterface {
  name = 'AddCustomerEmailUnique1800000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('CUSTOMERS');
    if (!table?.indices.some((index) => index.name === 'IDX_CUS_EMAIL')) {
      await queryRunner.createIndex(
        'CUSTOMERS',
        new TableIndex({ name: 'IDX_CUS_EMAIL', columnNames: ['EMA_CUS'], isUnique: true }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('CUSTOMERS');
    if (table?.indices.some((index) => index.name === 'IDX_CUS_EMAIL')) {
      await queryRunner.dropIndex('CUSTOMERS', 'IDX_CUS_EMAIL');
    }
  }
}
