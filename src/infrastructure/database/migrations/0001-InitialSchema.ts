import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema0001 implements MigrationInterface {
  name = 'InitialSchema0001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. ROLES
    await queryRunner.query(
      `CREATE TABLE \`ROLES\` (
        \`id\` varchar(36) NOT NULL,
        \`NAM_ROL\` varchar(50) NOT NULL,
        \`DES_ROL\` varchar(255) NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_ROLE_NAME\` (\`NAM_ROL\`)
      ) ENGINE=InnoDB`,
    );

    // 2. USERS
    await queryRunner.query(
      `CREATE TABLE \`USERS\` (
        \`id\` varchar(36) NOT NULL,
        \`USR_USR\` varchar(100) NOT NULL,
        \`PAS_HASH\` varchar(255) NOT NULL,
        \`EMA_USR\` varchar(255) NULL,
        \`FUL_NAM_USR\` varchar(255) NULL,
        \`STA_USR\` enum('ACTIVE','INACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
        \`FAI_LOG_ATT\` int NOT NULL DEFAULT 0,
        \`DEF_BRA_ID\` varchar(36) NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_USR_USERNAME\` (\`USR_USR\`),
        UNIQUE INDEX \`IDX_USR_EMAIL\` (\`EMA_USR\`)
      ) ENGINE=InnoDB`,
    );

    // 3. USER_ROLES
    await queryRunner.query(
      `CREATE TABLE \`USER_ROLES\` (
        \`id\` varchar(36) NOT NULL,
        \`USR_ID\` varchar(36) NOT NULL,
        \`ROL_ID\` varchar(36) NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_UR_USR_ID\` (\`USR_ID\`),
        INDEX \`IDX_UR_ROL_ID\` (\`ROL_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 4. BRANCHES
    await queryRunner.query(
      `CREATE TABLE \`BRANCHES\` (
        \`id\` varchar(36) NOT NULL,
        \`NAM_BRA\` varchar(100) NOT NULL,
        \`CIT_BRA\` varchar(100) NULL,
        \`ADD_BRA\` varchar(255) NULL,
        \`PHO_BRA\` varchar(20) NULL,
        \`ACT_BRA\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // 5. USER_BRANCHES
    await queryRunner.query(
      `CREATE TABLE \`USER_BRANCHES\` (
        \`id\` varchar(36) NOT NULL,
        \`USR_ID\` varchar(36) NOT NULL,
        \`BRA_ID\` varchar(36) NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_UB_USR_ID\` (\`USR_ID\`),
        INDEX \`IDX_UB_BRA_ID\` (\`BRA_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 6. ERROR_LOGS
    await queryRunner.query(
      `CREATE TABLE \`ERROR_LOGS\` (
        \`id\` varchar(36) NOT NULL,
        \`EXC_TYP\` enum('VALIDATION','NOT_FOUND','UNAUTHORIZED','FORBIDDEN','CONFLICT','INTERNAL','DATABASE') NOT NULL,
        \`MES_ERR\` text NOT NULL,
        \`STA_TRA\` text NULL,
        \`SRC_ERR\` varchar(100) NULL,
        \`USR_ID\` varchar(36) NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_ERR_LOG_CREATED_AT\` (\`CRE_AT\`)
      ) ENGINE=InnoDB`,
    );

    // 7. WAREHOUSES
    await queryRunner.query(
      `CREATE TABLE \`WAREHOUSES\` (
        \`id\` varchar(36) NOT NULL,
        \`BRA_ID\` varchar(36) NOT NULL,
        \`NAM_WAR\` varchar(100) NOT NULL,
        \`DES_WAR\` varchar(255) NULL,
        \`IS_MAI_WAR\` tinyint(1) NOT NULL DEFAULT 0,
        \`ACT_WAR\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_WAR_BRA_ID\` (\`BRA_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 8. CUSTOMERS
    await queryRunner.query(
      `CREATE TABLE \`CUSTOMERS\` (
        \`id\` varchar(36) NOT NULL,
        \`IDT_TYP\` enum('RUC','CEDULA','PASAPORTE','FOREIGN_ID','CONSUMIDOR_FINAL') NOT NULL,
        \`IDT_NUM\` varchar(20) NOT NULL,
        \`NAM_CUS\` varchar(255) NOT NULL,
        \`EMA_CUS\` varchar(255) NULL,
        \`PHO_CUS\` varchar(20) NULL,
        \`ADD_CUS\` varchar(255) NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_CUS_IDT_NUM\` (\`IDT_NUM\`)
      ) ENGINE=InnoDB`,
    );

    // 9. CATEGORIES
    await queryRunner.query(
      `CREATE TABLE \`CATEGORIES\` (
        \`id\` varchar(36) NOT NULL,
        \`NAM_CAT\` varchar(100) NOT NULL,
        \`DES_CAT\` varchar(255) NULL,
        \`ACT_CAT\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    // 10. TAX_RATES
    await queryRunner.query(
      `CREATE TABLE \`TAX_RATES\` (
        \`id\` varchar(36) NOT NULL,
        \`NAM_TAX\` varchar(100) NOT NULL,
        \`PCT_TAX\` decimal(5,2) NOT NULL,
        \`ACT_TAX\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_TAX_ACT\` (\`ACT_TAX\`)
      ) ENGINE=InnoDB`,
    );

    // 11. PRODUCTS
    await queryRunner.query(
      `CREATE TABLE \`PRODUCTS\` (
        \`id\` varchar(36) NOT NULL,
        \`CAT_ID\` varchar(36) NOT NULL,
        \`COD_PRO\` varchar(50) NOT NULL,
        \`NAM_PRO\` varchar(255) NOT NULL,
        \`DES_PRO\` text NULL,
        \`COS_PRI_PRO\` decimal(12,2) NOT NULL,
        \`SAL_PRI_PRO\` decimal(12,2) NOT NULL,
        \`ACT_PRO\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_PRO_CODE\` (\`COD_PRO\`),
        INDEX \`IDX_PRO_ACT\` (\`ACT_PRO\`),
        INDEX \`IDX_PRO_CAT_ID\` (\`CAT_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 12. INVENTORIES
    await queryRunner.query(
      `CREATE TABLE \`INVENTORIES\` (
        \`id\` varchar(36) NOT NULL,
        \`WAR_ID\` varchar(36) NOT NULL,
        \`PRO_ID\` varchar(36) NOT NULL,
        \`CUR_STO\` int NOT NULL DEFAULT 0,
        \`MIN_STO\` int NOT NULL DEFAULT 0,
        \`MAX_STO\` int NOT NULL DEFAULT 0,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_INV_WAR_PRO\` (\`WAR_ID\`, \`PRO_ID\`),
        INDEX \`IDX_INV_PRO_ID\` (\`PRO_ID\`),
        INDEX \`IDX_INV_CUR_STO\` (\`CUR_STO\`)
      ) ENGINE=InnoDB`,
    );

    // 13. STOCK_MOVEMENTS
    await queryRunner.query(
      `CREATE TABLE \`STOCK_MOVEMENTS\` (
        \`id\` varchar(36) NOT NULL,
        \`WAR_ID\` varchar(36) NOT NULL,
        \`PRO_ID\` varchar(36) NOT NULL,
        \`USR_ID\` varchar(36) NULL,
        \`TYP_MOV\` enum('IN','OUT','TRANSFER_IN','TRANSFER_OUT','SALE','ADJUSTMENT') NOT NULL,
        \`QTY_MOV\` decimal(10,3) NOT NULL,
        \`REF_TYP\` varchar(50) NULL,
        \`REF_ID\` varchar(36) NULL,
        \`DES_MOV\` text NULL,
        \`STO_BEF\` int NOT NULL,
        \`STO_AFT\` int NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_STR_MOV_CREATED_AT\` (\`CRE_AT\`),
        INDEX \`IDX_STR_MOV_TYP\` (\`TYP_MOV\`)
      ) ENGINE=InnoDB`,
    );

    // 14. STOCK_TRANSFERS
    await queryRunner.query(
      `CREATE TABLE \`STOCK_TRANSFERS\` (
        \`id\` varchar(36) NOT NULL,
        \`FROM_BRA_ID\` varchar(36) NOT NULL,
        \`TO_BRA_ID\` varchar(36) NOT NULL,
        \`REQ_USR_ID\` varchar(36) NOT NULL,
        \`APP_USR_ID\` varchar(36) NULL,
        \`STA_TRA\` enum('REQUESTED','APPROVED','SENT','RECEIVED','CANCELLED') NOT NULL DEFAULT 'REQUESTED',
        \`NOT_TRA\` text NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_STR_TRA_STA\` (\`STA_TRA\`)
      ) ENGINE=InnoDB`,
    );

    // 15. STOCK_TRANSFER_DETAILS
    await queryRunner.query(
      `CREATE TABLE \`STOCK_TRANSFER_DETAILS\` (
        \`id\` varchar(36) NOT NULL,
        \`STR_TRA_ID\` varchar(36) NOT NULL,
        \`PRO_ID\` varchar(36) NOT NULL,
        \`QTY_TRA\` decimal(10,3) NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_STD_STR_TRA_ID\` (\`STR_TRA_ID\`),
        INDEX \`IDX_STD_PRO_ID\` (\`PRO_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 16. SALES
    await queryRunner.query(
      `CREATE TABLE \`SALES\` (
        \`id\` varchar(36) NOT NULL,
        \`BRA_ID\` varchar(36) NOT NULL,
        \`CUS_ID\` varchar(36) NOT NULL,
        \`CAS_USR_ID\` varchar(36) NOT NULL,
        \`TAX_RAT_ID\` varchar(36) NOT NULL,
        \`SAL_NUM\` varchar(50) NOT NULL,
        \`SUB_SAL\` decimal(12,2) NOT NULL,
        \`TAX_AMO_SAL\` decimal(12,2) NOT NULL,
        \`DIS_AMO_SAL\` decimal(12,2) NOT NULL DEFAULT 0,
        \`TOT_SAL\` decimal(12,2) NOT NULL,
        \`STA_SAL\` enum('DRAFT','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_SAL_NUM\` (\`SAL_NUM\`),
        INDEX \`IDX_SAL_STA\` (\`STA_SAL\`),
        INDEX \`IDX_SAL_CREATED_AT\` (\`CRE_AT\`)
      ) ENGINE=InnoDB`,
    );

    // 17. SALE_DETAILS
    await queryRunner.query(
      `CREATE TABLE \`SALE_DETAILS\` (
        \`id\` varchar(36) NOT NULL,
        \`SAL_ID\` varchar(36) NOT NULL,
        \`PRO_ID\` varchar(36) NOT NULL,
        \`PRO_NAM_SAL\` varchar(255) NOT NULL,
        \`PRO_COD_SAL\` varchar(50) NOT NULL,
        \`QTY_SAL_DET\` decimal(10,3) NOT NULL,
        \`UNT_PRI_SAL\` decimal(12,2) NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_SD_SAL_PRO\` (\`SAL_ID\`, \`PRO_ID\`),
        INDEX \`IDX_SAL_DET_SAL_ID\` (\`SAL_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 18. SALES_HISTORY
    await queryRunner.query(
      `CREATE TABLE \`SALES_HISTORY\` (
        \`id\` varchar(36) NOT NULL,
        \`SAL_ID\` varchar(36) NOT NULL,
        \`BRA_ID\` varchar(36) NOT NULL,
        \`CUS_ID\` varchar(36) NOT NULL,
        \`CAS_USR_ID\` varchar(36) NOT NULL,
        \`TAX_RAT_ID\` varchar(36) NOT NULL,
        \`SAL_NUM\` varchar(50) NOT NULL,
        \`SUB_SAL\` decimal(12,2) NOT NULL,
        \`TAX_AMO_SAL\` decimal(12,2) NOT NULL,
        \`DIS_AMO_SAL\` decimal(12,2) NOT NULL DEFAULT 0,
        \`TOT_SAL\` decimal(12,2) NOT NULL,
        \`STA_SAL\` enum('DRAFT','CONFIRMED','CANCELLED') NOT NULL,
        \`ORI_CRE_AT\` timestamp NOT NULL,
        \`MOVED_AT\` timestamp NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_SH_SAL_ID\` (\`SAL_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 19. PAYMENTS
    await queryRunner.query(
      `CREATE TABLE \`PAYMENTS\` (
        \`id\` varchar(36) NOT NULL,
        \`SAL_ID\` varchar(36) NOT NULL,
        \`MET_PAY\` enum('CASH','CARD','TRANSFER') NOT NULL,
        \`AMO_PAY\` decimal(12,2) NOT NULL,
        \`REF_PAY\` varchar(100) NULL,
        \`PAI_AT\` timestamp NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_PAY_SAL_ID\` (\`SAL_ID\`),
        INDEX \`IDX_PAY_PAI_AT\` (\`PAI_AT\`)
      ) ENGINE=InnoDB`,
    );

    // 20. INVOICE_SERIES
    await queryRunner.query(
      `CREATE TABLE \`INVOICE_SERIES\` (
        \`id\` varchar(36) NOT NULL,
        \`BRA_ID\` varchar(36) NOT NULL,
        \`EST_COD_SER\` varchar(10) NOT NULL,
        \`EMI_POI_COD_SER\` varchar(10) NOT NULL,
        \`CUR_SEQ_SER\` int NOT NULL DEFAULT 0,
        \`ACT_SER\` tinyint(1) NOT NULL DEFAULT 1,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_IS_BRA_ID\` (\`BRA_ID\`)
      ) ENGINE=InnoDB`,
    );

    // 21. INVOICES
    await queryRunner.query(
      `CREATE TABLE \`INVOICES\` (
        \`id\` varchar(36) NOT NULL,
        \`SAL_ID\` varchar(36) NOT NULL,
        \`SER_ID\` varchar(36) NOT NULL,
        \`INV_NUM\` varchar(20) NOT NULL,
        \`ISS_DAT_INV\` timestamp NOT NULL,
        \`STA_INV\` enum('ISSUED','CANCELLED') NOT NULL DEFAULT 'ISSUED',
        \`SUB_TOT\` decimal(12,2) NOT NULL,
        \`TAX_AMO_INV\` decimal(12,2) NOT NULL,
        \`TOT_INV\` decimal(12,2) NOT NULL,
        \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE INDEX \`IDX_INV_NUM\` (\`INV_NUM\`),
        INDEX \`IDX_INV_STA\` (\`STA_INV\`)
      ) ENGINE=InnoDB`,
    );

    // Foreign keys (after all tables are created)
    await queryRunner.query(
      `ALTER TABLE \`USERS\` ADD CONSTRAINT \`FK_USR_DEF_BRA\` FOREIGN KEY (\`DEF_BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` ADD CONSTRAINT \`FK_UR_USR\` FOREIGN KEY (\`USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_ROLES\` ADD CONSTRAINT \`FK_UR_ROL\` FOREIGN KEY (\`ROL_ID\`) REFERENCES \`ROLES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_BRANCHES\` ADD CONSTRAINT \`FK_UB_USR\` FOREIGN KEY (\`USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`USER_BRANCHES\` ADD CONSTRAINT \`FK_UB_BRA\` FOREIGN KEY (\`BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`ERROR_LOGS\` ADD CONSTRAINT \`FK_EL_USR\` FOREIGN KEY (\`USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`WAREHOUSES\` ADD CONSTRAINT \`FK_WAR_BRA\` FOREIGN KEY (\`BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PRODUCTS\` ADD CONSTRAINT \`FK_PRO_CAT\` FOREIGN KEY (\`CAT_ID\`) REFERENCES \`CATEGORIES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`INVENTORIES\` ADD CONSTRAINT \`FK_INV_WAR\` FOREIGN KEY (\`WAR_ID\`) REFERENCES \`WAREHOUSES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`INVENTORIES\` ADD CONSTRAINT \`FK_INV_PRO\` FOREIGN KEY (\`PRO_ID\`) REFERENCES \`PRODUCTS\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_MOVEMENTS\` ADD CONSTRAINT \`FK_SM_WAR\` FOREIGN KEY (\`WAR_ID\`) REFERENCES \`WAREHOUSES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_MOVEMENTS\` ADD CONSTRAINT \`FK_SM_PRO\` FOREIGN KEY (\`PRO_ID\`) REFERENCES \`PRODUCTS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_MOVEMENTS\` ADD CONSTRAINT \`FK_SM_USR\` FOREIGN KEY (\`USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFERS\` ADD CONSTRAINT \`FK_ST_FROM_BRA\` FOREIGN KEY (\`FROM_BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFERS\` ADD CONSTRAINT \`FK_ST_TO_BRA\` FOREIGN KEY (\`TO_BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFERS\` ADD CONSTRAINT \`FK_ST_REQ_USR\` FOREIGN KEY (\`REQ_USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFERS\` ADD CONSTRAINT \`FK_ST_APP_USR\` FOREIGN KEY (\`APP_USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFER_DETAILS\` ADD CONSTRAINT \`FK_STD_STR\` FOREIGN KEY (\`STR_TRA_ID\`) REFERENCES \`STOCK_TRANSFERS\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`STOCK_TRANSFER_DETAILS\` ADD CONSTRAINT \`FK_STD_PRO\` FOREIGN KEY (\`PRO_ID\`) REFERENCES \`PRODUCTS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALES\` ADD CONSTRAINT \`FK_SAL_BRA\` FOREIGN KEY (\`BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALES\` ADD CONSTRAINT \`FK_SAL_CUS\` FOREIGN KEY (\`CUS_ID\`) REFERENCES \`CUSTOMERS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALES\` ADD CONSTRAINT \`FK_SAL_CAS_USR\` FOREIGN KEY (\`CAS_USR_ID\`) REFERENCES \`USERS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALES\` ADD CONSTRAINT \`FK_SAL_TAX\` FOREIGN KEY (\`TAX_RAT_ID\`) REFERENCES \`TAX_RATES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALE_DETAILS\` ADD CONSTRAINT \`FK_SD_SAL\` FOREIGN KEY (\`SAL_ID\`) REFERENCES \`SALES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALE_DETAILS\` ADD CONSTRAINT \`FK_SD_PRO\` FOREIGN KEY (\`PRO_ID\`) REFERENCES \`PRODUCTS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`SALES_HISTORY\` ADD CONSTRAINT \`FK_SH_SAL\` FOREIGN KEY (\`SAL_ID\`) REFERENCES \`SALES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`PAYMENTS\` ADD CONSTRAINT \`FK_PAY_SAL\` FOREIGN KEY (\`SAL_ID\`) REFERENCES \`SALES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`INVOICE_SERIES\` ADD CONSTRAINT \`FK_IS_BRA\` FOREIGN KEY (\`BRA_ID\`) REFERENCES \`BRANCHES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`INVOICES\` ADD CONSTRAINT \`FK_INV_SAL\` FOREIGN KEY (\`SAL_ID\`) REFERENCES \`SALES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`INVOICES\` ADD CONSTRAINT \`FK_INV_SER\` FOREIGN KEY (\`SER_ID\`) REFERENCES \`INVOICE_SERIES\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FKs first
    await queryRunner.query(`ALTER TABLE \`INVOICES\` DROP FOREIGN KEY \`FK_INV_SER\``);
    await queryRunner.query(`ALTER TABLE \`INVOICES\` DROP FOREIGN KEY \`FK_INV_SAL\``);
    await queryRunner.query(`ALTER TABLE \`INVOICE_SERIES\` DROP FOREIGN KEY \`FK_IS_BRA\``);
    await queryRunner.query(`ALTER TABLE \`PAYMENTS\` DROP FOREIGN KEY \`FK_PAY_SAL\``);
    await queryRunner.query(`ALTER TABLE \`SALES_HISTORY\` DROP FOREIGN KEY \`FK_SH_SAL\``);
    await queryRunner.query(`ALTER TABLE \`SALE_DETAILS\` DROP FOREIGN KEY \`FK_SD_PRO\``);
    await queryRunner.query(`ALTER TABLE \`SALE_DETAILS\` DROP FOREIGN KEY \`FK_SD_SAL\``);
    await queryRunner.query(`ALTER TABLE \`SALES\` DROP FOREIGN KEY \`FK_SAL_TAX\``);
    await queryRunner.query(`ALTER TABLE \`SALES\` DROP FOREIGN KEY \`FK_SAL_CAS_USR\``);
    await queryRunner.query(`ALTER TABLE \`SALES\` DROP FOREIGN KEY \`FK_SAL_CUS\``);
    await queryRunner.query(`ALTER TABLE \`SALES\` DROP FOREIGN KEY \`FK_SAL_BRA\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFER_DETAILS\` DROP FOREIGN KEY \`FK_STD_PRO\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFER_DETAILS\` DROP FOREIGN KEY \`FK_STD_STR\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFERS\` DROP FOREIGN KEY \`FK_ST_APP_USR\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFERS\` DROP FOREIGN KEY \`FK_ST_REQ_USR\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFERS\` DROP FOREIGN KEY \`FK_ST_TO_BRA\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_TRANSFERS\` DROP FOREIGN KEY \`FK_ST_FROM_BRA\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_MOVEMENTS\` DROP FOREIGN KEY \`FK_SM_USR\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_MOVEMENTS\` DROP FOREIGN KEY \`FK_SM_PRO\``);
    await queryRunner.query(`ALTER TABLE \`STOCK_MOVEMENTS\` DROP FOREIGN KEY \`FK_SM_WAR\``);
    await queryRunner.query(`ALTER TABLE \`INVENTORIES\` DROP FOREIGN KEY \`FK_INV_PRO\``);
    await queryRunner.query(`ALTER TABLE \`INVENTORIES\` DROP FOREIGN KEY \`FK_INV_WAR\``);
    await queryRunner.query(`ALTER TABLE \`PRODUCTS\` DROP FOREIGN KEY \`FK_PRO_CAT\``);
    await queryRunner.query(`ALTER TABLE \`WAREHOUSES\` DROP FOREIGN KEY \`FK_WAR_BRA\``);
    await queryRunner.query(`ALTER TABLE \`ERROR_LOGS\` DROP FOREIGN KEY \`FK_EL_USR\``);
    await queryRunner.query(`ALTER TABLE \`USER_BRANCHES\` DROP FOREIGN KEY \`FK_UB_BRA\``);
    await queryRunner.query(`ALTER TABLE \`USER_BRANCHES\` DROP FOREIGN KEY \`FK_UB_USR\``);
    await queryRunner.query(`ALTER TABLE \`USER_ROLES\` DROP FOREIGN KEY \`FK_UR_ROL\``);
    await queryRunner.query(`ALTER TABLE \`USER_ROLES\` DROP FOREIGN KEY \`FK_UR_USR\``);
    await queryRunner.query(`ALTER TABLE \`USERS\` DROP FOREIGN KEY \`FK_USR_DEF_BRA\``);

    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE \`INVOICES\``);
    await queryRunner.query(`DROP TABLE \`INVOICE_SERIES\``);
    await queryRunner.query(`DROP TABLE \`PAYMENTS\``);
    await queryRunner.query(`DROP TABLE \`SALES_HISTORY\``);
    await queryRunner.query(`DROP TABLE \`SALE_DETAILS\``);
    await queryRunner.query(`DROP TABLE \`SALES\``);
    await queryRunner.query(`DROP TABLE \`STOCK_TRANSFER_DETAILS\``);
    await queryRunner.query(`DROP TABLE \`STOCK_TRANSFERS\``);
    await queryRunner.query(`DROP TABLE \`STOCK_MOVEMENTS\``);
    await queryRunner.query(`DROP TABLE \`INVENTORIES\``);
    await queryRunner.query(`DROP TABLE \`PRODUCTS\``);
    await queryRunner.query(`DROP TABLE \`TAX_RATES\``);
    await queryRunner.query(`DROP TABLE \`CATEGORIES\``);
    await queryRunner.query(`DROP TABLE \`CUSTOMERS\``);
    await queryRunner.query(`DROP TABLE \`WAREHOUSES\``);
    await queryRunner.query(`DROP TABLE \`ERROR_LOGS\``);
    await queryRunner.query(`DROP TABLE \`USER_BRANCHES\``);
    await queryRunner.query(`DROP TABLE \`BRANCHES\``);
    await queryRunner.query(`DROP TABLE \`USER_ROLES\``);
    await queryRunner.query(`DROP TABLE \`USERS\``);
    await queryRunner.query(`DROP TABLE \`ROLES\``);
  }
}