import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class DropInvoiceSeriesSequenceNumber1800000000012 implements MigrationInterface {
  name = 'DropInvoiceSeriesSequenceNumber1800000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICE_SERIES');
    if (!table) {
      return;
    }

    const hasColumn = table.columns.some((column) => column.name === 'SEQ_NUM');
    if (!hasColumn) {
      return;
    }

    await queryRunner.dropColumn('INVOICE_SERIES', 'SEQ_NUM');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICE_SERIES');
    if (!table) {
      return;
    }

    const hasColumn = table.columns.some((column) => column.name === 'SEQ_NUM');
    if (hasColumn) {
      return;
    }

    await queryRunner.addColumn(
      'INVOICE_SERIES',
      new TableColumn({
        name: 'SEQ_NUM',
        type: 'int',
        isNullable: false,
        default: 0,
      }),
    );
  }
}
