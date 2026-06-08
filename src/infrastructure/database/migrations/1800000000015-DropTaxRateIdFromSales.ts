import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropTaxRateIdFromSales1800000000015 implements MigrationInterface {
  name = 'DropTaxRateIdFromSales1800000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('SALES');
    if (!table) return;

    const column = table.columns.find((col) => col.name === 'TAX_RAT_ID');
    if (column) {
      await queryRunner.dropColumn('SALES', 'TAX_RAT_ID');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const taxRateIdType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const taxRateIdLength = dbType === 'postgres' ? undefined : '36';

    const table = await queryRunner.getTable('SALES');
    if (!table) return;

    const hasColumn = table.columns.some((col) => col.name === 'TAX_RAT_ID');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'SALES',
        new TableColumn({
          name: 'TAX_RAT_ID',
          type: taxRateIdType,
          length: taxRateIdLength,
          isNullable: true,
        }),
      );
    }
  }
}
