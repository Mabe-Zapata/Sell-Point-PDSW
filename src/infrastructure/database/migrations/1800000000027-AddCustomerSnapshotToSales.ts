import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddCustomerSnapshotToSales1800000000027 implements MigrationInterface {
  name = 'AddCustomerSnapshotToSales1800000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('SALES');
    if (!table) return;

    const columns: { name: string; length: string }[] = [
      { name: 'CUS_NAM_SAL', length: '255' },
      { name: 'CUS_APE_SAL', length: '255' },
      { name: 'CUS_CED_SAL', length: '20' },
      { name: 'CUS_EMA_SAL', length: '255' },
    ];

    for (const col of columns) {
      if (!table.columns.some((c) => c.name === col.name)) {
        await queryRunner.addColumn(
          'SALES',
          new TableColumn({
            name: col.name,
            type: 'varchar',
            length: col.length,
            isNullable: true,
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const columnNames = ['CUS_EMA_SAL', 'CUS_CED_SAL', 'CUS_APE_SAL', 'CUS_NAM_SAL'];

    for (const name of columnNames) {
      const table = await queryRunner.getTable('SALES');
      if (table?.columns.some((c) => c.name === name)) {
        await queryRunner.dropColumn('SALES', name);
      }
    }
  }
}
