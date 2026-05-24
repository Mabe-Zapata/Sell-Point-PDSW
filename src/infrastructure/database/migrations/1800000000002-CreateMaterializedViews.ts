import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: CreateMaterializedViews1800000000002
 *
 * Multimotor materialized views. TypeORM does not abstract CREATE MATERIALIZED VIEW,
 * so raw SQL via queryRunner.query() is used. Engine detection via
 * queryRunner.connection.options.type ('postgres' | 'oracle').
 *
 * - Postgres: CREATE MATERIALIZED VIEW IF NOT EXISTS (double-quoted identifiers)
 * - Oracle: CREATE MATERIALIZED VIEW (bare uppercase identifiers — no IF NOT EXISTS)
 *
 * Vistas: mv_monthly_sales, mv_product_stock
 */
export class CreateMaterializedViews1800000000002 implements MigrationInterface {
  name = 'CreateMaterializedViews1800000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const salesIdRef = dbType === 'oracle' ? '"id"' : 'id';

    if (dbType === 'postgres') {
      // PostgreSQL: use IF NOT EXISTS + double-quoted identifiers (case-sensitive)
      await queryRunner.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_monthly_sales AS
        SELECT
          date_trunc('month', i."CRE_AT") AS mes,
          COUNT(*) AS total_invoices,
          COALESCE(SUM(s."TOT_SAL"), 0) AS total_sales
        FROM "INVOICES" i
        INNER JOIN "SALES" s ON s.id = i."SAL_ID"
        WHERE i."STA_INV" = 'ISSUED'
        GROUP BY date_trunc('month', i."CRE_AT")
      `);

      await queryRunner.query(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_product_stock AS
        SELECT
          p."CAT_ID" AS category_id,
          COUNT(CASE WHEN p."ACT_PRO" = true THEN 1 END) AS active_count,
          SUM(p."CUR_STO_PRO") AS total_stock
        FROM "PRODUCTS" p
        GROUP BY p."CAT_ID"
      `);
    } else {
      // Oracle: no IF NOT EXISTS — use a tiny dialect shim for the case-sensitive
      // SALES primary key column created by TypeORM.
      await queryRunner.query(`
        CREATE MATERIALIZED VIEW mv_monthly_sales AS
        SELECT
          TRUNC(INVOICES.CRE_AT, 'MONTH') AS mes,
          COUNT(*) AS total_invoices,
          NVL(SUM(TOT_SAL), 0) AS total_sales
        FROM INVOICES
        INNER JOIN SALES ON SALES.${salesIdRef} = INVOICES.SAL_ID
        WHERE INVOICES.STA_INV = 'ISSUED'
        GROUP BY TRUNC(INVOICES.CRE_AT, 'MONTH')
      `);

      await queryRunner.query(`
        CREATE MATERIALIZED VIEW mv_product_stock AS
        SELECT
          CAT_ID AS category_id,
          COUNT(CASE WHEN ACT_PRO = 1 THEN 1 ELSE NULL END) AS active_count,
          SUM(CUR_STO_PRO) AS total_stock
        FROM PRODUCTS
        GROUP BY CAT_ID
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;

    if (dbType === 'postgres') {
      await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS "mv_product_stock"');
      await queryRunner.query('DROP MATERIALIZED VIEW IF EXISTS "mv_monthly_sales"');
    } else {
      await queryRunner.query('DROP MATERIALIZED VIEW mv_product_stock');
      await queryRunner.query('DROP MATERIALIZED VIEW mv_monthly_sales');
    }
  }
}
