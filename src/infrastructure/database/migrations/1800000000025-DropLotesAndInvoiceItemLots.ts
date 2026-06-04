import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableCheck,
  TableColumn,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class DropLotesAndInvoiceItemLots1800000000025 implements MigrationInterface {
  name = 'DropLotesAndInvoiceItemLots1800000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop in dependency order: column -> INVOICE_ITEM_LOTS -> LOTS
    // (INVOICE_ITEM_LOTS has an FK pointing at LOTS, so LOTS must be dropped last.)
    const invoices = await queryRunner.getTable('INVOICES');
    if (invoices?.columns.some((column) => column.name === 'PRO_TOT_INV')) {
      await queryRunner.dropColumn('INVOICES', 'PRO_TOT_INV');
    }

    const invoiceItemLots = await queryRunner.getTable('INVOICE_ITEM_LOTS');
    if (invoiceItemLots) {
      await queryRunner.dropTable('INVOICE_ITEM_LOTS', true, true, true);
    }

    const lots = await queryRunner.getTable('LOTS');
    if (lots) {
      await queryRunner.dropTable('LOTS', true, true, true);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate in inverse order: LOTS -> INVOICE_ITEM_LOTS -> PRO_TOT_INV.
    // Mirrors 0023's up() byte-for-byte so a revert reproduces the exact same schema.
    const dbType = queryRunner.connection.options.type as string;
    const uuidType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const uuidLength = dbType === 'postgres' ? undefined : '36';

    if (!(await queryRunner.getTable('LOTS'))) {
      await queryRunner.createTable(
        new Table({
          name: 'LOTS',
          columns: [
            { name: 'id', type: uuidType, length: uuidLength, isPrimary: true },
            { name: 'PRO_ID', type: uuidType, length: uuidLength },
            { name: 'LOT_COD', type: 'varchar', length: '80' },
            { name: 'QTY_ING', type: 'decimal', precision: 12, scale: 3 },
            { name: 'QTY_AVL', type: 'decimal', precision: 12, scale: 3 },
            { name: 'COS_UNI_LOT', type: 'decimal', precision: 12, scale: 2 },
            { name: 'EST_UNI_PRO', type: 'decimal', precision: 12, scale: 2 },
            { name: 'ING_DAT', type: 'timestamp', precision: 6 },
            { name: 'EXP_DAT', type: 'timestamp', precision: 6, isNullable: true },
            { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
            { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
            { name: 'DEL_AT', type: 'timestamp', precision: 6, isNullable: true },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'LOTS',
        new TableForeignKey({
          name: 'FK_LOTS_PRODUCTS',
          columnNames: ['PRO_ID'],
          referencedTableName: 'PRODUCTS',
          referencedColumnNames: ['id'],
        }),
      );
      await queryRunner.createIndex('LOTS', new TableIndex({ name: 'IDX_LOTS_FIFO', columnNames: ['PRO_ID', 'ING_DAT', 'DEL_AT'] }));
      await queryRunner.createIndex('LOTS', new TableIndex({ name: 'IDX_LOTS_CODE', columnNames: ['LOT_COD'] }));
      await queryRunner.createCheckConstraint('LOTS', new TableCheck({ name: 'CK_LOTS_QTY_ING_POS', expression: '"QTY_ING" > 0' }));
      await queryRunner.createCheckConstraint('LOTS', new TableCheck({ name: 'CK_LOTS_QTY_AVL_NONNEG', expression: '"QTY_AVL" >= 0' }));
      await queryRunner.createCheckConstraint('LOTS', new TableCheck({ name: 'CK_LOTS_UNIT_COST_POS', expression: '"COS_UNI_LOT" > 0' }));
    }

    if (!(await queryRunner.getTable('INVOICE_ITEM_LOTS'))) {
      await queryRunner.createTable(
        new Table({
          name: 'INVOICE_ITEM_LOTS',
          columns: [
            { name: 'id', type: uuidType, length: uuidLength, isPrimary: true },
            { name: 'INV_ITEM_ID', type: uuidType, length: uuidLength },
            { name: 'LOT_ID', type: uuidType, length: uuidLength },
            { name: 'QTY_USD', type: 'decimal', precision: 12, scale: 3 },
            { name: 'COS_UNI_LOT', type: 'decimal', precision: 12, scale: 2 },
            { name: 'PRO_AMO', type: 'decimal', precision: 12, scale: 2 },
            { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          ],
        }),
        true,
      );

      await queryRunner.createForeignKey(
        'INVOICE_ITEM_LOTS',
        new TableForeignKey({
          name: 'FK_INV_ITEM_LOTS_ITEM',
          columnNames: ['INV_ITEM_ID'],
          referencedTableName: 'INVOICE_ITEMS',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );
      await queryRunner.createForeignKey(
        'INVOICE_ITEM_LOTS',
        new TableForeignKey({
          name: 'FK_INV_ITEM_LOTS_LOT',
          columnNames: ['LOT_ID'],
          referencedTableName: 'LOTS',
          referencedColumnNames: ['id'],
        }),
      );
      await queryRunner.createIndex('INVOICE_ITEM_LOTS', new TableIndex({ name: 'IDX_INV_ITEM_LOTS_ITEM', columnNames: ['INV_ITEM_ID'] }));
      await queryRunner.createIndex('INVOICE_ITEM_LOTS', new TableIndex({ name: 'IDX_INV_ITEM_LOTS_LOT', columnNames: ['LOT_ID'] }));
      await queryRunner.createCheckConstraint('INVOICE_ITEM_LOTS', new TableCheck({ name: 'CK_INV_ITEM_LOTS_QTY_POS', expression: '"QTY_USD" > 0' }));
    }

    const invoices = await queryRunner.getTable('INVOICES');
    if (invoices && !invoices.columns.some((column) => column.name === 'PRO_TOT_INV')) {
      await queryRunner.addColumn(
        'INVOICES',
        new TableColumn({
          name: 'PRO_TOT_INV',
          type: 'decimal',
          precision: 12,
          scale: 2,
          isNullable: true,
        }),
      );
    }
  }
}
