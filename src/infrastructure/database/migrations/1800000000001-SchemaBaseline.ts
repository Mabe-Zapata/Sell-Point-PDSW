import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
  TableCheck,
} from 'typeorm';

/**
 * Migration: SchemaBaseline1800000000001
 *
 * Multimotor baseline using TypeORM abstraction APIs (Table, TableIndex,
 * TableCheck) + engine-aware type branching via queryRunner.connection.options.type.
 *
 * Engine-specific handling:
 * - Postgres: uuid type for ID columns
 * - Oracle: varchar2(36) for ID columns (no native UUID type)
 * - Both: number(1) for booleans, varchar2(4000) for text fields
 *
 * Tables: ROLES, USERS, USER_ROLES, USER_BRANCHES, CUSTOMERS,
 *         CATEGORIES, TAX_RATES, PRODUCTS, SALES, SALE_DETAILS,
 *         STOCK_MOVEMENTS, ERROR_LOGS, INVOICE_SERIES, INVOICES,
 *         INVOICE_ITEMS
 */
export class SchemaBaseline1800000000001 implements MigrationInterface {
  name = 'SchemaBaseline1800000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const uuidType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const uuidLength = dbType === 'postgres' ? undefined : '36';
    const boolType = dbType === 'oracle' ? 'number' : 'boolean';
    const boolDefault = dbType === 'oracle' ? 1 : true;
    const longTextType = dbType === 'oracle' ? 'varchar2' : 'text';
    const longTextOpts = dbType === 'oracle' ? { length: '4000' } : {};

    // Helper to build column definition respecting engine
    const col = (name: string, type: string, opts: Partial<TableColumn> = {}): TableColumn => {
      const column = new TableColumn({ name, type, ...opts });
      return column;
    };

    // ─────────────────────────────────────────────────────────────────────────
    // 1. ROLES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'ROLES',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('NAM_ROL', 'varchar', { length: '50' }),
          col('DES_ROL', 'varchar', { length: '255', isNullable: true }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex(
      'ROLES',
      new TableIndex({ name: 'IDX_ROLE_NAME', columnNames: ['NAM_ROL'], isUnique: true }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 2. USERS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'USERS',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('FIR_NAM_USR', 'varchar', { length: '100', isNullable: true }),
          col('LAS_NAM_USR', 'varchar', { length: '100', isNullable: true }),
          col('CED_USR', 'varchar', { length: '20', isNullable: true }),
          col('ACT_USR', boolType, { default: boolDefault }),
          col('ROL_USR', 'varchar', { length: '50', isNullable: true }),
          col('EMP_ID', 'varchar', { length: '50' }),
          col('USR_USR', 'varchar', { length: '100' }),
          col('EMA_USR', 'varchar', { length: '255' }),
          col('PAS_HASH', 'varchar', { length: '255' }),
          col('STA_USR', 'varchar', { length: '30', default: "'ACTIVE'" }),
          col('DEF_BRA_ID', uuidType, { isNullable: true, length: uuidLength }),
          col('FAILED_ATTEMPTS', 'integer', { default: 0 }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('USERS', new TableIndex({ name: 'IDX_USR_USERNAME', columnNames: ['USR_USR'], isUnique: true }));
    await queryRunner.createIndex('USERS', new TableIndex({ name: 'IDX_USR_EMAIL', columnNames: ['EMA_USR'], isUnique: true }));
    await queryRunner.createIndex('USERS', new TableIndex({ name: 'IDX_USR_EMP_ID', columnNames: ['EMP_ID'], isUnique: true }));

    // ─────────────────────────────────────────────────────────────────────────
    // 3. USER_ROLES (composite PK)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'USER_ROLES',
        columns: [
          col('USR_ID', uuidType, { length: uuidLength }),
          col('ROL_ID', uuidType, { length: uuidLength }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
      true,
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 4. USER_BRANCHES (composite PK)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'USER_BRANCHES',
        columns: [
          col('USR_ID', uuidType, { length: uuidLength }),
          col('BRA_ID', uuidType, { length: uuidLength }),
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
          col('id', uuidType, { isPrimary: true }),
          col('CED_CUS', 'varchar', { length: '20', isNullable: true }),
          col('NOM_CUS', 'varchar', { length: '100' }),
          col('APE_CUS', 'varchar', { length: '100', isNullable: true }),
          col('EMA_CUS', 'varchar', { length: '255', isNullable: true }),
          col('PHO_CUS', 'varchar', { length: '20', isNullable: true }),
          col('ADD_CUS', 'varchar', { length: '255', isNullable: true }),
          col('ACT_CUS', boolType, { default: boolDefault }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('CUSTOMERS', new TableIndex({ name: 'IDX_CUS_CEDULA', columnNames: ['CED_CUS'], isUnique: true }));

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CATEGORIES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'CATEGORIES',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('NAM_CAT', 'varchar', { length: '100' }),
          col('DES_CAT', 'varchar', { length: '255', isNullable: true }),
          col('ACT_CAT', boolType, { default: boolDefault }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
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
          col('id', uuidType, { isPrimary: true }),
          col('NAM_TAX', 'varchar', { length: '100' }),
          col('PCT_TAX', 'decimal', { precision: 5, scale: 2 }),
          col('ACT_TAX', boolType, { default: boolDefault }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('TAX_RATES', new TableIndex({ name: 'IDX_TAX_ACT', columnNames: ['ACT_TAX'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 8. PRODUCTS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'PRODUCTS',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('CAT_ID', uuidType, { length: uuidLength }),
          col('COD_PRO', 'varchar', { length: '50' }),
          col('NAM_PRO', 'varchar', { length: '255' }),
          col('DES_PRO', longTextType, { ...longTextOpts, isNullable: true }),
          col('SAL_PRI_PRO', 'decimal', { precision: 12, scale: 2 }),
          col('COS_PRI_PRO', 'decimal', { precision: 12, scale: 2 }),
          col('ACT_PRO', boolType, { default: boolDefault }),
          col('CUR_STO_PRO', 'integer', { default: 0 }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('PRODUCTS', new TableIndex({ name: 'IDX_PRO_CODE', columnNames: ['COD_PRO'], isUnique: true }));
    await queryRunner.createIndex('PRODUCTS', new TableIndex({ name: 'IDX_PRO_ACT', columnNames: ['ACT_PRO'] }));
    await queryRunner.createIndex('PRODUCTS', new TableIndex({ name: 'IDX_PRO_CAT', columnNames: ['CAT_ID'] }));
    await queryRunner.createIndex('PRODUCTS', new TableIndex({ name: 'IDX_PRO_CREATED_AT', columnNames: ['CRE_AT'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 9. SALES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'SALES',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('BRA_ID', uuidType, { length: uuidLength }),
          col('CUS_ID', uuidType, { length: uuidLength }),
          col('CAS_USR_ID', uuidType, { length: uuidLength }),
          col('TAX_RAT_ID', uuidType, { length: uuidLength }),
          col('SAL_NUM', 'varchar', { length: '50' }),
          col('STA_SAL', 'varchar', { length: '30', default: "'DRAFT'" }),
          col('SUB_SAL', 'decimal', { precision: 12, scale: 2 }),
          col('TAX_AMO_SAL', 'decimal', { precision: 12, scale: 2 }),
          col('DIS_AMO_SAL', 'decimal', { precision: 12, scale: 2, default: 0 }),
          col('TOT_SAL', 'decimal', { precision: 12, scale: 2 }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('SALES', new TableIndex({ name: 'IDX_SAL_NUM', columnNames: ['SAL_NUM'], isUnique: true }));
    await queryRunner.createIndex('SALES', new TableIndex({ name: 'IDX_SAL_STA', columnNames: ['STA_SAL'] }));
    await queryRunner.createIndex('SALES', new TableIndex({ name: 'IDX_SAL_CREATED_AT', columnNames: ['CRE_AT'] }));
    await queryRunner.createIndex('SALES', new TableIndex({ name: 'IDX_SAL_BRA_STA_CRE', columnNames: ['BRA_ID', 'STA_SAL', 'CRE_AT'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 10. SALE_DETAILS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'SALE_DETAILS',
        columns: [
          col('id', 'int', { isPrimary: true, isGenerated: true, generationStrategy: dbType === 'oracle' ? 'increment' : 'identity' }),
          col('SAL_ID', uuidType, { length: uuidLength }),
          col('PRO_ID', uuidType, { length: uuidLength }),
          col('PRO_NAM_SAL', 'varchar', { length: '255' }),
          col('PRO_COD_SAL', 'varchar', { length: '50' }),
          col('QTY_SAL_DET', 'decimal', { precision: 10, scale: 3 }),
          col('UNT_PRI_SAL', 'decimal', { precision: 12, scale: 2 }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('SALE_DETAILS', new TableIndex({ name: 'IDX_SAL_DET_SAL_ID', columnNames: ['SAL_ID'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 11. STOCK_MOVEMENTS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'STOCK_MOVEMENTS',
        columns: [
          col('id', 'int', { isPrimary: true, isGenerated: true, generationStrategy: dbType === 'oracle' ? 'increment' : 'identity' }),
          col('PRO_ID', uuidType, { length: uuidLength }),
          col('TYP_MOV', 'varchar', { length: '30' }),
          col('QTY_MOV', 'decimal', { precision: 10, scale: 3 }),
          col('PRE_STO_MOV', 'int'),
          col('NEW_STO_MOV', 'int'),
          col('USR_ID', uuidType, { isNullable: true, length: uuidLength }),
          col('REF_TYP', 'varchar', { length: '50', isNullable: true }),
          col('REF_ID', uuidType, { isNullable: true, length: uuidLength }),
          col('DES_MOV', longTextType, { ...longTextOpts, isNullable: true }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('STOCK_MOVEMENTS', new TableIndex({ name: 'IDX_STR_MOV_CREATED_AT', columnNames: ['CRE_AT'] }));
    await queryRunner.createIndex('STOCK_MOVEMENTS', new TableIndex({ name: 'IDX_STR_MOV_PRO_CRE', columnNames: ['PRO_ID', 'CRE_AT'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 12. ERROR_LOGS (increment PK via IDENTITY)
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'ERROR_LOGS',
        columns: [
          col('id', 'int', { isPrimary: true, isGenerated: true, generationStrategy: dbType === 'oracle' ? 'increment' : 'identity' }),
          col('EXC_TYP', 'varchar', { length: '30' }),
          col('MES_ERR', longTextType, { ...longTextOpts }),
          col('STA_TRA', longTextType, { ...longTextOpts, isNullable: true }),
          col('SRC_ERR', 'varchar', { length: '100', isNullable: true }),
          col('SRC_SCR_ERR', 'varchar', { length: '100', isNullable: true }),
          col('SRC_EVT_ERR', 'varchar', { length: '100', isNullable: true }),
          col('USR_ID', uuidType, { isNullable: true, length: uuidLength }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('ERROR_LOGS', new TableIndex({ name: 'IDX_ERR_LOG_CREATED_AT', columnNames: ['CRE_AT'] }));

    // ─────────────────────────────────────────────────────────────────────────
    // 13. INVOICE_SERIES
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'INVOICE_SERIES',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('BRA_ID', uuidType, { length: uuidLength }),
          col('EST_CODE', 'varchar', { length: '10' }),
          col('EMI_PNT', 'varchar', { length: '10' }),
          col('SEQ_NUM', 'int'),
          col('CUR_SEQ', 'int', { default: 0 }),
          col('ACT_INV_SER', boolType, { default: boolDefault }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
          col('UPD_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
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
          col('id', uuidType, { isPrimary: true }),
          col('SAL_ID', uuidType, { length: uuidLength }),
          col('SER_ID', uuidType, { length: uuidLength }),
          col('INV_NUM', 'varchar', { length: '50' }),
          col('AUTH_NUM', 'varchar', { length: '100', isNullable: true }),
          col('ISS_DAT', 'timestamp'),
          col('STA_INV', 'varchar', { length: '30', default: "'ISSUED'" }),
          col('CAN_DAT', 'timestamp', { isNullable: true }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );
    await queryRunner.createIndex('INVOICES', new TableIndex({ name: 'IDX_INV_NUM', columnNames: ['INV_NUM'], isUnique: true }));

    // ─────────────────────────────────────────────────────────────────────────
    // 15. INVOICE_ITEMS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createTable(
      new Table({
        name: 'INVOICE_ITEMS',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('ID_INV_DET', uuidType, { length: uuidLength }),
          col('ID_PRO_DET', uuidType, { length: uuidLength }),
          col('CAN_VEN', 'int'),
          col('PRI_UNI_VEN', 'decimal', { precision: 10, scale: 2 }),
        ],
      }),
    );

    // ─────────────────────────────────────────────────────────────────────────
    // 16. CHECK CONSTRAINTS
    // ─────────────────────────────────────────────────────────────────────────
    await queryRunner.createCheckConstraint('USERS', new TableCheck({ name: 'CK_USR_STA', expression: `"STA_USR" IN ('ACTIVE', 'INACTIVE', 'BLOCKED')` }));
    await queryRunner.createCheckConstraint('SALES', new TableCheck({ name: 'CK_SAL_STA', expression: `"STA_SAL" IN ('DRAFT', 'CONFIRMED', 'CANCELLED')` }));
    await queryRunner.createCheckConstraint('INVOICES', new TableCheck({ name: 'CK_INV_STA', expression: `"STA_INV" IN ('ISSUED', 'CANCELLED')` }));
    await queryRunner.createCheckConstraint('STOCK_MOVEMENTS', new TableCheck({ name: 'CK_STR_TYP', expression: `"TYP_MOV" IN ('IN', 'OUT', 'SALE', 'ADJUSTMENT')` }));
    await queryRunner.createCheckConstraint('ERROR_LOGS', new TableCheck({ name: 'CK_ERR_TYP', expression: `"EXC_TYP" IN ('VALIDATION_ERROR', 'DATABASE_ERROR', 'AUTHENTICATION_ERROR', 'AUTHORIZATION_ERROR', 'BUSINESS_RULE_ERROR', 'EXTERNAL_SERVICE_ERROR', 'UNEXPECTED_ERROR')` }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropCheckConstraint('USERS', 'CK_USR_STA');
    await queryRunner.dropCheckConstraint('SALES', 'CK_SAL_STA');
    await queryRunner.dropCheckConstraint('INVOICES', 'CK_INV_STA');
    await queryRunner.dropCheckConstraint('STOCK_MOVEMENTS', 'CK_STR_TYP');
    await queryRunner.dropCheckConstraint('ERROR_LOGS', 'CK_ERR_TYP');

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
