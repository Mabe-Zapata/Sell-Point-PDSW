import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';

export class AddTaxRateIdToCategories1800000000013 implements MigrationInterface {
  name = 'AddTaxRateIdToCategories1800000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const taxRateIdType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const taxRateIdLength = dbType === 'postgres' ? undefined : '36';

    const table = await queryRunner.getTable('CATEGORIES');
    if (!table) return;

    const hasColumn = table.columns.some((col) => col.name === 'TAX_RAT_ID');
    if (hasColumn) return;

    // 1. Add as nullable first
    await queryRunner.addColumn(
      'CATEGORIES',
      new TableColumn({
        name: 'TAX_RAT_ID',
        type: taxRateIdType,
        length: taxRateIdLength,
        isNullable: true,
      }),
    );

    // 2. Set default tax rate (IVA 15%) for existing rows
    const defaultTaxRateId = uuidv5('IVA 15%', UUID_NAMESPACE);
    if (dbType === 'oracle') {
      await queryRunner.query(`UPDATE "CATEGORIES" SET "TAX_RAT_ID" = '${defaultTaxRateId}' WHERE "TAX_RAT_ID" IS NULL`);
    } else {
      await queryRunner.query(`UPDATE "CATEGORIES" SET "TAX_RAT_ID" = '${defaultTaxRateId}' WHERE "TAX_RAT_ID" IS NULL`);
    }

    // 3. Make NOT NULL
    await queryRunner.changeColumn(
      'CATEGORIES',
      new TableColumn({
        name: 'TAX_RAT_ID',
        type: taxRateIdType,
        length: taxRateIdLength,
        isNullable: true,
      }),
      new TableColumn({
        name: 'TAX_RAT_ID',
        type: taxRateIdType,
        length: taxRateIdLength,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const taxRateIdType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const taxRateIdLength = dbType === 'postgres' ? undefined : '36';

    const table = await queryRunner.getTable('CATEGORIES');
    if (!table) return;

    // Make nullable first, then drop
    await queryRunner.changeColumn(
      'CATEGORIES',
      new TableColumn({
        name: 'TAX_RAT_ID',
        type: taxRateIdType,
        length: taxRateIdLength,
        isNullable: false,
      }),
      new TableColumn({
        name: 'TAX_RAT_ID',
        type: taxRateIdType,
        length: taxRateIdLength,
        isNullable: true,
      }),
    );

    const hasColumn = table.columns.some((col) => col.name === 'TAX_RAT_ID');
    if (hasColumn) {
      await queryRunner.dropColumn('CATEGORIES', 'TAX_RAT_ID');
    }
  }
}
