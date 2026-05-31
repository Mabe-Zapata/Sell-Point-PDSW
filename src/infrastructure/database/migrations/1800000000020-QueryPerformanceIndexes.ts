import { MigrationInterface, QueryRunner } from 'typeorm';

export class QueryPerformanceIndexes1800000000020 implements MigrationInterface {
  name = 'QueryPerformanceIndexes1800000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);
    const table = (name: string) => quote(name);

    // Covering index for product list queries
    await queryRunner.query(`
      CREATE INDEX idx_products_perf
      ON ${table('PRODUCTS')} (${quote('CRE_AT')} DESC, ${quote('CAT_ID')}, ${quote('ACT_PRO')})
    `);

    // Index for invoice list by date + sale
    await queryRunner.query(`
      CREATE INDEX idx_invoices_perf
      ON ${table('INVOICES')} (${quote('CRE_AT')} DESC, ${quote('SAL_ID')})
    `);

    // Index for invoice items foreign key lookups
    await queryRunner.query(`
      CREATE INDEX idx_invoice_details_fk
      ON ${table('INVOICE_ITEMS')} (${quote('ID_INV_DET')})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);

    await queryRunner.query(`DROP INDEX ${quote('idx_products_perf')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_invoices_perf')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_invoice_details_fk')}`);
  }
}
