import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAuditSnapshotsToInvoices1800000000027 implements MigrationInterface {
  name = 'AddAuditSnapshotsToInvoices1800000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICES');
    if (!table) return;

    const ensureColumn = async (column: TableColumn): Promise<void> => {
      const exists = table.columns.some((col) => col.name === column.name);
      if (!exists) {
        await queryRunner.addColumn('INVOICES', column);
      }
    };

    await ensureColumn(new TableColumn({
      name: 'CUS_NAM_SNA',
      type: 'varchar',
      length: '255',
      isNullable: true,
      comment: 'Customer name snapshot (audit)',
    }));

    await ensureColumn(new TableColumn({
      name: 'CUS_CED_SNA',
      type: 'varchar',
      length: '20',
      isNullable: true,
      comment: 'Customer cedula snapshot (audit)',
    }));

    await ensureColumn(new TableColumn({
      name: 'CUS_EMA_SNA',
      type: 'varchar',
      length: '255',
      isNullable: true,
      comment: 'Customer email snapshot (audit)',
    }));

    await ensureColumn(new TableColumn({
      name: 'CAS_NAM_SNA',
      type: 'varchar',
      length: '255',
      isNullable: true,
      comment: 'Cashier name snapshot (audit)',
    }));

    await ensureColumn(new TableColumn({
      name: 'CAS_USR_SNA',
      type: 'varchar',
      length: '100',
      isNullable: true,
      comment: 'Cashier username snapshot (audit)',
    }));

    await ensureColumn(new TableColumn({
      name: 'CAS_EMP_SNA',
      type: 'varchar',
      length: '50',
      isNullable: true,
      comment: 'Cashier employee ID snapshot (audit)',
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('INVOICES');
    if (!table) return;

    const snapshotColumns = [
      'CUS_NAM_SNA',
      'CUS_CED_SNA',
      'CUS_EMA_SNA',
      'CAS_NAM_SNA',
      'CAS_USR_SNA',
      'CAS_EMP_SNA',
    ];

    for (const col of snapshotColumns) {
      if (table.columns.some((c) => c.name === col)) {
        await queryRunner.dropColumn('INVOICES', col);
      }
    }
  }
}
