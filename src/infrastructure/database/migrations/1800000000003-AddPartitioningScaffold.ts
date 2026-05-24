import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: AddPartitioningScaffold1800000000003
 *
 * Multimotor partitioning migration. TypeORM does not abstract partition DDL,
 * so raw SQL via queryRunner.query() is used. Engine detection via
 * queryRunner.connection.options.type ('postgres' | 'oracle').
 *
 * - Postgres: rebuild SALES as HASH partitioned by id
 * - Oracle: rebuild SALES as HASH partitioned by id
 * - Other engines: no-op
 */
export class AddPartitioningScaffold1800000000003 implements MigrationInterface {
  name = 'AddPartitioningScaffold1800000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;

    if (dbType !== 'postgres' && dbType !== 'oracle') {
      console.log(`[PartitioningScaffold] ${dbType} partitioning skipped.`);
      return;
    }

    const salesDdl =
      dbType === 'postgres'
        ? [
            'CREATE TABLE "SALES" (',
            '  "id" uuid NOT NULL,',
            '  "BRA_ID" uuid NOT NULL,',
            '  "CUS_ID" uuid NOT NULL,',
            '  "CAS_USR_ID" uuid NOT NULL,',
            '  "TAX_RAT_ID" uuid NOT NULL,',
            '  "SAL_NUM" varchar(50) NOT NULL,',
            "  \"STA_SAL\" varchar(30) NOT NULL DEFAULT 'DRAFT',",
            '  "SUB_SAL" decimal(12,2) NOT NULL,',
            '  "TAX_AMO_SAL" decimal(12,2) NOT NULL,',
            '  "DIS_AMO_SAL" decimal(12,2) NOT NULL DEFAULT 0,',
            '  "TOT_SAL" decimal(12,2) NOT NULL,',
            '  "CRE_AT" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,',
            '  "UPD_AT" timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,',
            '  CONSTRAINT "PK_SALES" PRIMARY KEY ("id")',
            ') PARTITION BY HASH ("id");',
            'CREATE TABLE "SALES_P0" PARTITION OF "SALES" FOR VALUES WITH (MODULUS 4, REMAINDER 0);',
            'CREATE TABLE "SALES_P1" PARTITION OF "SALES" FOR VALUES WITH (MODULUS 4, REMAINDER 1);',
            'CREATE TABLE "SALES_P2" PARTITION OF "SALES" FOR VALUES WITH (MODULUS 4, REMAINDER 2);',
            'CREATE TABLE "SALES_P3" PARTITION OF "SALES" FOR VALUES WITH (MODULUS 4, REMAINDER 3);',
          ].join('\n')
        : [
            'CREATE TABLE SALES (',
            '  id varchar2(36) NOT NULL,',
            '  BRA_ID varchar2(36) NOT NULL,',
            '  CUS_ID varchar2(36) NOT NULL,',
            '  CAS_USR_ID varchar2(36) NOT NULL,',
            '  TAX_RAT_ID varchar2(36) NOT NULL,',
            '  SAL_NUM varchar2(50) NOT NULL,',
            "  STA_SAL varchar2(30) DEFAULT 'DRAFT' NOT NULL,",
            '  SUB_SAL number(12,2) NOT NULL,',
            '  TAX_AMO_SAL number(12,2) NOT NULL,',
            '  DIS_AMO_SAL number(12,2) DEFAULT 0 NOT NULL,',
            '  TOT_SAL number(12,2) NOT NULL,',
            '  CRE_AT timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,',
            '  UPD_AT timestamp(6) DEFAULT CURRENT_TIMESTAMP NOT NULL,',
            '  CONSTRAINT PK_SALES PRIMARY KEY (id)',
            ') PARTITION BY HASH (id) PARTITIONS 4',
          ].join('\n');

    const dropSales = dbType === 'postgres' ? 'DROP TABLE IF EXISTS "SALES" CASCADE;' : 'DROP TABLE SALES CASCADE CONSTRAINTS PURGE';

    await queryRunner.query(dropSales);
    await queryRunner.query(salesDdl);

    if (dbType === 'postgres') {
      await queryRunner.query('CREATE INDEX "IDX_SAL_NUM" ON "SALES" ("SAL_NUM")');
      await queryRunner.query('CREATE INDEX "IDX_SAL_STA" ON "SALES" ("STA_SAL")');
      await queryRunner.query('CREATE INDEX "IDX_SAL_CREATED_AT" ON "SALES" ("CRE_AT")');
      await queryRunner.query('CREATE INDEX "IDX_SAL_BRA_STA_CRE" ON "SALES" ("BRA_ID", "STA_SAL", "CRE_AT")');
      await queryRunner.query('ALTER TABLE "SALES" ADD CONSTRAINT "CK_SAL_STA" CHECK ("STA_SAL" IN (\'DRAFT\', \'CONFIRMED\', \'CANCELLED\'))');
    } else {
      await queryRunner.query('CREATE INDEX IDX_SAL_NUM ON SALES (SAL_NUM)');
      await queryRunner.query('CREATE INDEX IDX_SAL_STA ON SALES (STA_SAL)');
      await queryRunner.query('CREATE INDEX IDX_SAL_CREATED_AT ON SALES (CRE_AT)');
      await queryRunner.query('CREATE INDEX IDX_SAL_BRA_STA_CRE ON SALES (BRA_ID, STA_SAL, CRE_AT)');
      await queryRunner.query("ALTER TABLE SALES ADD CONSTRAINT CK_SAL_STA CHECK (STA_SAL IN ('DRAFT', 'CONFIRMED', 'CANCELLED'))");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;

    if (dbType !== 'postgres' && dbType !== 'oracle') {
      console.log(`[PartitioningScaffold] ${dbType} rollback skipped.`);
      return;
    }

    if (dbType === 'postgres') {
      await queryRunner.query('DROP TABLE IF EXISTS "SALES" CASCADE;');
    } else {
      await queryRunner.query('DROP TABLE SALES CASCADE CONSTRAINTS PURGE');
    }
  }
}
