import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';
import { v5 as uuidv5 } from 'uuid';

const UUID_NAMESPACE = 'f8d1f8a7-8b36-4a6f-9e9a-7d8e7a7f6c01';

export class AddTaxRateForeignKeys1800000000016 implements MigrationInterface {
  name = 'AddTaxRateForeignKeys1800000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const activeTaxValue = dbType === 'oracle' ? 1 : true;

    // Ensure default tax rates exist before creating FKs
    const iva15Id = uuidv5('IVA 15%', UUID_NAMESPACE);
    const iva0Id = uuidv5('IVA 0%', UUID_NAMESPACE);

    const existing = await queryRunner.query(
      `SELECT "id" FROM "TAX_RATES" WHERE "id" IN ('${iva15Id}','${iva0Id}')`,
    );
    const existingIds = (existing as Array<{ id: string }>).map((r) => r.id);

    if (!existingIds.includes(iva15Id)) {
      await queryRunner.query(
        `INSERT INTO "TAX_RATES" ("id","NAM_TAX","PCT_TAX","ACT_TAX","CRE_AT","UPD_AT") VALUES ('${iva15Id}','IVA 15%',15,${activeTaxValue},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      );
    }
    if (!existingIds.includes(iva0Id)) {
      await queryRunner.query(
        `INSERT INTO "TAX_RATES" ("id","NAM_TAX","PCT_TAX","ACT_TAX","CRE_AT","UPD_AT") VALUES ('${iva0Id}','IVA 0%',0,${activeTaxValue},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
      );
    }

    // FK from CATEGORIES.TAX_RAT_ID -> TAX_RATES.id
    const categoriesTable = await queryRunner.getTable('CATEGORIES');
    if (categoriesTable) {
      const hasFk = categoriesTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('TAX_RAT_ID') !== -1,
      );
      if (!hasFk) {
        await queryRunner.createForeignKey(
          'CATEGORIES',
          new TableForeignKey({
            name: 'FK_CAT_TAX_RAT',
            columnNames: ['TAX_RAT_ID'],
            referencedTableName: 'TAX_RATES',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          }),
        );
      }
    }

    // FK from SALE_DETAILS.TAX_RAT_ID -> TAX_RATES.id
    const detailsTable = await queryRunner.getTable('SALE_DETAILS');
    if (detailsTable) {
      const hasFk = detailsTable.foreignKeys.some(
        (fk) => fk.columnNames.indexOf('TAX_RAT_ID') !== -1,
      );
      if (!hasFk) {
        await queryRunner.createForeignKey(
          'SALE_DETAILS',
          new TableForeignKey({
            name: 'FK_SDET_TAX_RAT',
            columnNames: ['TAX_RAT_ID'],
            referencedTableName: 'TAX_RATES',
            referencedColumnNames: ['id'],
            onDelete: 'NO ACTION',
          }),
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const categoriesTable = await queryRunner.getTable('CATEGORIES');
    if (categoriesTable) {
      const fkCat = categoriesTable.foreignKeys.find(
        (fk) => fk.name === 'FK_CAT_TAX_RAT',
      );
      if (fkCat) {
        await queryRunner.dropForeignKey('CATEGORIES', 'FK_CAT_TAX_RAT');
      }
    }

    const detailsTable = await queryRunner.getTable('SALE_DETAILS');
    if (detailsTable) {
      const fkDet = detailsTable.foreignKeys.find(
        (fk) => fk.name === 'FK_SDET_TAX_RAT',
      );
      if (fkDet) {
        await queryRunner.dropForeignKey('SALE_DETAILS', 'FK_SDET_TAX_RAT');
      }
    }
  }
}
