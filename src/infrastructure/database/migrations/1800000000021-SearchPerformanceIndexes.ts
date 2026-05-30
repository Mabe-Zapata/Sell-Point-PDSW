import { MigrationInterface, QueryRunner } from 'typeorm';

export class SearchPerformanceIndexes1800000000021 implements MigrationInterface {
  name = 'SearchPerformanceIndexes1800000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);
    const table = (name: string) => quote(name);

    await queryRunner.query(`
      CREATE INDEX idx_products_name_search
      ON ${table('PRODUCTS')} (UPPER(${quote('NAM_PRO')}))
    `);

    await queryRunner.query(`
      CREATE INDEX idx_products_code_search
      ON ${table('PRODUCTS')} (UPPER(${quote('COD_PRO')}))
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoices_number_search
      ON ${table('INVOICES')} (UPPER(${quote('INV_NUM')}))
    `);

    await queryRunner.query(`
      CREATE INDEX idx_invoice_series_branch
      ON ${table('INVOICE_SERIES')} (${quote('BRA_ID')})
    `);

    await queryRunner.query(`
      CREATE INDEX idx_sales_customer
      ON ${table('SALES')} (${quote('CUS_ID')})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);

    await queryRunner.query(`DROP INDEX ${quote('idx_sales_customer')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_invoice_series_branch')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_invoices_number_search')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_products_code_search')}`);
    await queryRunner.query(`DROP INDEX ${quote('idx_products_name_search')}`);
  }
}
