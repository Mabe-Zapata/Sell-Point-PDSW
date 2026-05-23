import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableCheck,
} from 'typeorm';

/**
 * Migration: SchemaBaseline1800000000001
 *
 * Multimotor baseline using TypeORM abstraction APIs (Table, TableIndex,
 * TableCheck) instead of raw SQL. TypeORM translates to the correct dialect
 * at runtime (PostgreSQL, Oracle, MySQL, etc.).
 *
 * Design decisions for multimotor compatibility:
 * - UUIDs generated in domain/entity layer (application), not DB
 * - CURRENT_TIMESTAMP instead of NOW() (ANSI SQL standard)
 * - No gen_random_uuid() defaults — Oracle incompatible
 *
 * Tables: ROLES, USERS, USER_ROLES, USER_BRANCHES, CUSTOMERS,
 *         CATEGORIES, TAX_RATES, PRODUCTS, SALES, SALE_DETAILS,
 *         STOCK_MOVEMENTS, ERROR_LOGS, INVOICE_SERIES, INVOICES,
 *         INVOICE_ITEMS
 *
 * Previous MySQL migrations (1776824191160, 1776900000000, 0001) deleted.
 */
export class SchemaBaseline1800000000001 implements MigrationInterface {
  name = 'SchemaBaseline1800000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ROLES
    await queryRunner.createTable(
      new Table({
        name: 'ROLES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'NAM_ROL', type: 'varchar', length: '50' },
          { name: 'DES_ROL', type: 'varchar', length: '255', isNullable: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'ROLES',
      new TableIndex({ name: 'IDX_ROLE_NAME', columnNames: ['NAM_ROL'], isUnique: true }),
    );

    // USERS
    await queryRunner.createTable(
      new Table({
        name: 'USERS',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'FIR_NAM_USR', type: 'varchar', length: '100', isNullable: true },
          { name: 'LAS_NAM_USR', type: 'varchar', length: '100', isNullable: true },
          { name: 'CED_USR', type: 'varchar', length: '20', isNullable: true },
          { name: 'ACT_USR', type: 'boolean', default: true },
          { name: 'ROL_USR', type: 'varchar', length: '50', isNullable: true },
          { name: 'EMP_ID', type: 'varchar', length: '50' },
          { name: 'USR_USR', type: 'varchar', length: '100' },
          { name: 'EMA_USR', type: 'varchar', length: '255' },
          { name: 'PAS_HASH', type: 'varchar', length: '255' },
          { name: 'STA_USR', type: 'varchar', length: '30', default: "'ACTIVE'" },
          { name: 'DEF_BRA_ID', type: 'uuid', isNullable: true },
          { name: 'failed_attempts', type: 'integer', default: 0 },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'USERS',
      new TableIndex({ name: 'IDX_USR_USERNAME', columnNames: ['USR_USR'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'USERS',
      new TableIndex({ name: 'IDX_USR_EMAIL', columnNames: ['EMA_USR'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'USERS',
      new TableIndex({ name: 'IDX_USR_EMP_ID', columnNames: ['EMP_ID'], isUnique: true }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 3. USER_ROLES (composite PK — no auto PK column)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'USER_ROLES',
        columns: [
          { name: 'USR_ID', type: 'uuid' },
          { name: 'ROL_ID', type: 'uuid' },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true, // ifExist: false — fresh table
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 4. USER_BRANCHES (composite PK — no auto PK column)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'USER_BRANCHES',
        columns: [
          { name: 'USR_ID', type: 'uuid' },
          { name: 'BRA_ID', type: 'uuid' },
        ],
      }),
      true,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 5. CUSTOMERS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'CUSTOMERS',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'CED_CUS', type: 'varchar', length: '20', isNullable: true },
          { name: 'NOM_CUS', type: 'varchar', length: '100' },
          { name: 'APE_CUS', type: 'varchar', length: '100', isNullable: true },
          { name: 'EMA_CUS', type: 'varchar', length: '255', isNullable: true },
          { name: 'PHO_CUS', type: 'varchar', length: '20', isNullable: true },
          { name: 'ADD_CUS', type: 'varchar', length: '255', isNullable: true },
          { name: 'ACT_CUS', type: 'boolean', default: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'CUSTOMERS',
      new TableIndex({ name: 'IDX_CUS_CEDULA', columnNames: ['CED_CUS'], isUnique: true }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CATEGORIES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'CATEGORIES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'NAM_CAT', type: 'varchar', length: '100' },
          { name: 'DES_CAT', type: 'varchar', length: '255', isNullable: true },
          { name: 'ACT_CAT', type: 'boolean', default: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 7. TAX_RATES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'TAX_RATES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'NAM_TAX', type: 'varchar', length: '100' },
          { name: 'PCT_TAX', type: 'decimal', precision: 5, scale: 2 },
          { name: 'ACT_TAX', type: 'boolean', default: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'TAX_RATES',
      new TableIndex({ name: 'IDX_TAX_ACT', columnNames: ['ACT_TAX'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 8. PRODUCTS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'PRODUCTS',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'CAT_ID', type: 'uuid' },
          { name: 'COD_PRO', type: 'varchar', length: '50' },
          { name: 'NAM_PRO', type: 'varchar', length: '255' },
          { name: 'DES_PRO', type: 'text', isNullable: true },
          { name: 'SAL_PRI_PRO', type: 'decimal', precision: 12, scale: 2 },
          { name: 'COS_PRI_PRO', type: 'decimal', precision: 12, scale: 2 },
          { name: 'ACT_PRO', type: 'boolean', default: true },
          { name: 'CUR_STO_PRO', type: 'integer', default: 0 },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'PRODUCTS',
      new TableIndex({ name: 'IDX_PRO_CODE', columnNames: ['COD_PRO'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'PRODUCTS',
      new TableIndex({ name: 'IDX_PRO_ACT', columnNames: ['ACT_PRO'] }),
    );
    await queryRunner.createIndex(
      'PRODUCTS',
      new TableIndex({ name: 'IDX_PRO_CAT', columnNames: ['CAT_ID'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 9. SALES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'SALES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'BRA_ID', type: 'uuid' },
          { name: 'CUS_ID', type: 'uuid' },
          { name: 'CAS_USR_ID', type: 'uuid' },
          { name: 'TAX_RAT_ID', type: 'uuid' },
          { name: 'SAL_NUM', type: 'varchar', length: '50' },
          { name: 'STA_SAL', type: 'varchar', length: '30', default: "'DRAFT'" },
          { name: 'SUB_SAL', type: 'decimal', precision: 12, scale: 2 },
          { name: 'TAX_AMO_SAL', type: 'decimal', precision: 12, scale: 2 },
          { name: 'DIS_AMO_SAL', type: 'decimal', precision: 12, scale: 2, default: 0 },
          { name: 'TOT_SAL', type: 'decimal', precision: 12, scale: 2 },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'SALES',
      new TableIndex({ name: 'IDX_SAL_NUM', columnNames: ['SAL_NUM'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'SALES',
      new TableIndex({ name: 'IDX_SAL_STA', columnNames: ['STA_SAL'] }),
    );
    await queryRunner.createIndex(
      'SALES',
      new TableIndex({ name: 'IDX_SAL_CREATED_AT', columnNames: ['CRE_AT'] }),
    );
    await queryRunner.createIndex(
      'SALES',
      new TableIndex({ name: 'IDX_SAL_BRA_STA_CRE', columnNames: ['BRA_ID', 'STA_SAL', 'CRE_AT'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 10. SALE_DETAILS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'SALE_DETAILS',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'identity' },
          { name: 'SAL_ID', type: 'uuid' },
          { name: 'PRO_ID', type: 'uuid' },
          { name: 'PRO_NAM_SAL', type: 'varchar', length: '255' },
          { name: 'PRO_COD_SAL', type: 'varchar', length: '50' },
          { name: 'QTY_SAL_DET', type: 'decimal', precision: 10, scale: 3 },
          { name: 'UNT_PRI_SAL', type: 'decimal', precision: 12, scale: 2 },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'SALE_DETAILS',
      new TableIndex({ name: 'IDX_SAL_DET_SAL_ID', columnNames: ['SAL_ID'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 11. STOCK_MOVEMENTS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'STOCK_MOVEMENTS',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'identity' },
          { name: 'PRO_ID', type: 'uuid' },
          { name: 'TYP_MOV', type: 'varchar', length: '30' },
          { name: 'QTY_MOV', type: 'decimal', precision: 10, scale: 3 },
          { name: 'PRE_STO_MOV', type: 'int' },
          { name: 'NEW_STO_MOV', type: 'int' },
          { name: 'USR_ID', type: 'uuid', isNullable: true },
          { name: 'REF_TYP', type: 'varchar', length: '50', isNullable: true },
          { name: 'REF_ID', type: 'uuid', isNullable: true },
          { name: 'DES_MOV', type: 'text', isNullable: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'STOCK_MOVEMENTS',
      new TableIndex({ name: 'IDX_STR_MOV_CREATED_AT', columnNames: ['CRE_AT'] }),
    );
    await queryRunner.createIndex(
      'STOCK_MOVEMENTS',
      new TableIndex({ name: 'IDX_STR_MOV_PRO_CRE', columnNames: ['PRO_ID', 'CRE_AT'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 12. ERROR_LOGS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'ERROR_LOGS',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'identity' },
          { name: 'EXC_TYP', type: 'varchar', length: '30' },
          { name: 'MES_ERR', type: 'text' },
          { name: 'STA_TRA', type: 'text', isNullable: true },
          { name: 'SRC_ERR', type: 'varchar', length: '100', isNullable: true },
          { name: 'SRC_SCR_ERR', type: 'varchar', length: '100', isNullable: true },
          { name: 'SRC_EVT_ERR', type: 'varchar', length: '100', isNullable: true },
          { name: 'USR_ID', type: 'uuid', isNullable: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'ERROR_LOGS',
      new TableIndex({ name: 'IDX_ERR_LOG_CREATED_AT', columnNames: ['CRE_AT'] }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 13. INVOICE_SERIES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'INVOICE_SERIES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'BRA_ID', type: 'uuid' },
          { name: 'EST_CODE', type: 'varchar', length: '10' },
          { name: 'EMI_PNT', type: 'varchar', length: '10' },
          { name: 'SEQ_NUM', type: 'int' },
          { name: 'CUR_SEQ', type: 'int', default: 0 },
          { name: 'ACT_INV_SER', type: 'boolean', default: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
          { name: 'UPD_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 14. INVOICES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'INVOICES',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'SAL_ID', type: 'uuid' },
          { name: 'SER_ID', type: 'uuid' },
          { name: 'INV_NUM', type: 'varchar', length: '50' },
          { name: 'AUTH_NUM', type: 'varchar', length: '100', isNullable: true },
          { name: 'ISS_DAT', type: 'timestamp' },
          { name: 'STA_INV', type: 'varchar', length: '30', default: "'ISSUED'" },
          { name: 'CAN_DAT', type: 'timestamp', isNullable: true },
          { name: 'CRE_AT', type: 'timestamp', precision: 6, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
    );
    await queryRunner.createIndex(
      'INVOICES',
      new TableIndex({ name: 'IDX_INV_NUM', columnNames: ['INV_NUM'], isUnique: true }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 15. INVOICE_ITEMS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'INVOICE_ITEMS',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'ID_INV_DET', type: 'uuid' },
          { name: 'ID_PRO_DET', type: 'uuid' },
          { name: 'CAN_VEN', type: 'int' },
          { name: 'PRI_UNI_VEN', type: 'decimal', precision: 10, scale: 2 },
        ],
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 16. CHECK CONSTRAINTS (via TypeORM TableCheck — dialect-agnostic)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createCheckConstraint(
      'USERS',
      new TableCheck({
        name: 'CK_USR_STA',
        expression: `"STA_USR" IN ('ACTIVE', 'INACTIVE', 'BLOCKED')`,
      }),
    );

    await queryRunner.createCheckConstraint(
      'SALES',
      new TableCheck({
        name: 'CK_SAL_STA',
        expression: `"STA_SAL" IN ('DRAFT', 'CONFIRMED', 'CANCELLED')`,
      }),
    );

    await queryRunner.createCheckConstraint(
      'INVOICES',
      new TableCheck({
        name: 'CK_INV_STA',
        expression: `"STA_INV" IN ('ISSUED', 'CANCELLED')`,
      }),
    );

    await queryRunner.createCheckConstraint(
      'STOCK_MOVEMENTS',
      new TableCheck({
        name: 'CK_STR_TYP',
        expression: `"TYP_MOV" IN ('IN', 'OUT', 'SALE', 'ADJUSTMENT')`,
      }),
    );

    await queryRunner.createCheckConstraint(
      'ERROR_LOGS',
      new TableCheck({
        name: 'CK_ERR_TYP',
        expression: `"EXC_TYP" IN (
          'VALIDATION_ERROR', 'DATABASE_ERROR', 'AUTHENTICATION_ERROR',
          'AUTHORIZATION_ERROR', 'BUSINESS_RULE_ERROR',
          'EXTERNAL_SERVICE_ERROR', 'UNEXPECTED_ERROR'
        )`,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop CHECK constraints first
    await queryRunner.dropCheckConstraint('USERS', 'CK_USR_STA');
    await queryRunner.dropCheckConstraint('SALES', 'CK_SAL_STA');
    await queryRunner.dropCheckConstraint('INVOICES', 'CK_INV_STA');
    await queryRunner.dropCheckConstraint('STOCK_MOVEMENTS', 'CK_STR_TYP');
    await queryRunner.dropCheckConstraint('ERROR_LOGS', 'CK_ERR_TYP');

    // Drop tables in reverse dependency order
    await queryRunner.dropTable('INVOICE_ITEMS');
    await queryRunner.dropTable('INVOICES');
    await queryRunner.dropTable('INVOICE_SERIES');
    await queryRunner.dropTable('ERROR_LOGS');
    await queryRunner.dropTable('STOCK_MOVEMENTS');
    await queryRunner.dropTable('SALE_DETAILS');
    await queryRunner.dropTable('SALES');
    await queryRunner.dropTable('PRODUCTS');
    await queryRunner.dropTable('TAX_RATES');
    await queryRunner.dropTable('CATEGORIES');
    await queryRunner.dropTable('CUSTOMERS');
    await queryRunner.dropTable('USER_BRANCHES');
    await queryRunner.dropTable('USER_ROLES');
    await queryRunner.dropTable('USERS');
    await queryRunner.dropTable('ROLES');
  }
}