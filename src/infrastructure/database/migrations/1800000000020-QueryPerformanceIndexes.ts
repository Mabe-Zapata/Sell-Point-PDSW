import { MigrationInterface, QueryRunner } from 'typeorm';

export class QueryPerformanceIndexes1800000000020 implements MigrationInterface {
  name = 'QueryPerformanceIndexes1800000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Covering index for product list queries
    await queryRunner.query(`
      CREATE INDEX idx_products_perf
      ON PRODUCTS (CRE_AT DESC, CAT_ID, ACT_PRO)
    `);

    // Index for invoice list by date + sale
    await queryRunner.query(`
      CREATE INDEX idx_invoices_perf
      ON INVOICES (CRE_AT DESC, SAL_ID)
    `);

    // Index for invoice items foreign key lookups
    await queryRunner.query(`
      CREATE INDEX idx_invoice_details_fk
      ON INVOICE_ITEMS (ID_INV_DET)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX idx_products_perf`);
    await queryRunner.query(`DROP INDEX idx_invoices_perf`);
    await queryRunner.query(`DROP INDEX idx_invoice_details_fk`);
  }
}
