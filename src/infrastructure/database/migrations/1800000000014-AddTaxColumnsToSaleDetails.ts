import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTaxColumnsToSaleDetails1800000000014 implements MigrationInterface {
  name = 'AddTaxColumnsToSaleDetails1800000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const taxRateIdType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const taxRateIdLength = dbType === 'postgres' ? undefined : '36';

    const table = await queryRunner.getTable('SALE_DETAILS');
    if (!table) return;

    const hasTaxRateId = table.columns.some((col) => col.name === 'TAX_RAT_ID');
    if (!hasTaxRateId) {
      await queryRunner.addColumn(
        'SALE_DETAILS',
        new TableColumn({
          name: 'TAX_RAT_ID',
          type: taxRateIdType,
          length: taxRateIdLength,
          isNullable: true,
        }),
      );
    }

    const hasTaxPct = table.columns.some((col) => col.name === 'TAX_PCT_SAL');
    if (!hasTaxPct) {
      await queryRunner.addColumn(
        'SALE_DETAILS',
        new TableColumn({
          name: 'TAX_PCT_SAL',
          type: 'decimal',
          precision: 5,
          scale: 2,
          default: 0,
        }),
      );
    }

    const hasTaxAmount = table.columns.some((col) => col.name === 'TAX_AMO_SAL');
    if (!hasTaxAmount) {
      await queryRunner.addColumn(
        'SALE_DETAILS',
        new TableColumn({
          name: 'TAX_AMO_SAL',
          type: 'decimal',
          precision: 12,
          scale: 2,
          default: 0,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('SALE_DETAILS');
    if (!table) return;

    const cols = ['TAX_AMO_SAL', 'TAX_PCT_SAL', 'TAX_RAT_ID'];
    for (const colName of cols) {
      const hasColumn = table.columns.some((col) => col.name === colName);
      if (hasColumn) {
        await queryRunner.dropColumn('SALE_DETAILS', colName);
      }
    }
  }
}
