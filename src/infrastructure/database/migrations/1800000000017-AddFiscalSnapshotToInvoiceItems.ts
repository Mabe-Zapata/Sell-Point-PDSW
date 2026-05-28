import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddFiscalSnapshotToInvoiceItems1800000000017 implements MigrationInterface {
  name = 'AddFiscalSnapshotToInvoiceItems1800000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICE_ITEMS');
    if (!table) return;

    const ensureColumn = async (column: TableColumn): Promise<void> => {
      const exists = table.columns.some((col) => col.name === column.name);
      if (!exists) {
        await queryRunner.addColumn('INVOICE_ITEMS', column);
      }
    };

    await ensureColumn(new TableColumn({
      name: 'PRO_NAM_INV',
      type: 'varchar',
      length: '255',
      isNullable: true,
    }));

    await ensureColumn(new TableColumn({
      name: 'TAX_RAT_ID',
      type: 'varchar',
      length: '36',
      isNullable: true,
    }));

    await ensureColumn(new TableColumn({
      name: 'TAX_PCT_INV',
      type: 'decimal',
      precision: 5,
      scale: 2,
      isNullable: true,
    }));

    await ensureColumn(new TableColumn({
      name: 'TAX_AMO_INV',
      type: 'decimal',
      precision: 12,
      scale: 2,
      isNullable: true,
      default: 0,
    }));

    const quantityColumn = table.findColumnByName('CAN_VEN');
    if (quantityColumn && (quantityColumn.type !== 'decimal' || quantityColumn.scale !== 3)) {
      await queryRunner.changeColumn(
        'INVOICE_ITEMS',
        'CAN_VEN',
        new TableColumn({
          name: 'CAN_VEN',
          type: 'decimal',
          precision: 10,
          scale: 3,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICE_ITEMS');
    if (!table) return;

    const quantityColumn = table.findColumnByName('CAN_VEN');
    if (quantityColumn && quantityColumn.type === 'decimal') {
      await queryRunner.changeColumn(
        'INVOICE_ITEMS',
        'CAN_VEN',
        new TableColumn({
          name: 'CAN_VEN',
          type: 'int',
        }),
      );
    }

    for (const colName of ['TAX_AMO_INV', 'TAX_PCT_INV', 'TAX_RAT_ID', 'PRO_NAM_INV']) {
      const exists = table.columns.some((col) => col.name === colName);
      if (exists) {
        await queryRunner.dropColumn('INVOICE_ITEMS', colName);
      }
    }
  }
}
