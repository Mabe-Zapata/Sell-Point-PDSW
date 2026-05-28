import { MigrationInterface, QueryRunner, TableIndex } from 'typeorm';

export class AddUniqueInvoicePerSale1800000000011 implements MigrationInterface {
  name = 'AddUniqueInvoicePerSale1800000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICES');
    if (!table) {
      return;
    }

    const hasIndex = table.indices.some((index) => index.name === 'UQ_INVOICES_SALE_ID');
    if (hasIndex) {
      return;
    }

    await queryRunner.createIndex(
      'INVOICES',
      new TableIndex({
        name: 'UQ_INVOICES_SALE_ID',
        columnNames: ['SAL_ID'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICES');
    if (!table) {
      return;
    }

    const hasIndex = table.indices.some((index) => index.name === 'UQ_INVOICES_SALE_ID');
    if (!hasIndex) {
      return;
    }

    await queryRunner.dropIndex('INVOICES', 'UQ_INVOICES_SALE_ID');
  }
}
