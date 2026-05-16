import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1776824191160 implements MigrationInterface {
    name = 'InitialMigration1776824191160'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`PRODUCTS\` (\`id\` varchar(36) NOT NULL, \`COD_PRO\` varchar(50) NOT NULL, \`NAM_PRO\` varchar(255) NOT NULL, \`DES_PRO\` text NULL, \`PRI_UNI_PRO\` decimal(10,2) NOT NULL, \`QTY_DIS_PRO\` int NOT NULL, \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DEL_AT\` datetime(6) NULL, UNIQUE INDEX \`IDX_5b6dc0d0f43e56843c7049091c\` (\`COD_PRO\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`CUSTOMERS\` (\`id\` varchar(36) NOT NULL, \`NAM_CUS\` varchar(100) NOT NULL, \`LAS_NAM_CUS\` varchar(100) NOT NULL, \`ID_CUS\` varchar(20) NOT NULL, \`EMA_CUS\` varchar(255) NULL, \`PHO_CUS\` varchar(20) NULL, \`ADD_CUS\` varchar(255) NULL, \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DEL_AT\` datetime(6) NULL, UNIQUE INDEX \`IDX_9c711a3973b65c96daba11c7be\` (\`ID_CUS\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`INVOICE_ITEMS\` (\`id\` varchar(36) NOT NULL, \`ID_INV_DET\` varchar(255) NOT NULL, \`ID_PRO_DET\` varchar(255) NOT NULL, \`CAN_VEN\` int NOT NULL, \`PRI_UNI_VEN\` decimal(10,2) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`INVOICES\` (\`id\` varchar(36) NOT NULL, \`NUM_INV\` varchar(20) NOT NULL, \`FEC_INV\` timestamp NOT NULL, \`ID_CUS_INV\` varchar(255) NOT NULL, \`SUB_TOT\` decimal(12,2) NOT NULL, \`IVA_TOT\` decimal(12,2) NOT NULL, \`TOT_INV\` decimal(12,2) NOT NULL, \`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`DEL_AT\` datetime(6) NULL, UNIQUE INDEX \`IDX_3cd5487836f15b75f179f12ad2\` (\`NUM_INV\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`INVOICE_ITEMS\` ADD CONSTRAINT \`FK_d63fd44056931a37eb3bfe2b3fe\` FOREIGN KEY (\`ID_INV_DET\`) REFERENCES \`INVOICES\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`INVOICE_ITEMS\` ADD CONSTRAINT \`FK_24bbb98d5e7f08f49659bb6cd2a\` FOREIGN KEY (\`ID_PRO_DET\`) REFERENCES \`PRODUCTS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`INVOICES\` ADD CONSTRAINT \`FK_09d5a30006de3e76563b9a980ce\` FOREIGN KEY (\`ID_CUS_INV\`) REFERENCES \`CUSTOMERS\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`INVOICES\` DROP FOREIGN KEY \`FK_09d5a30006de3e76563b9a980ce\``);
        await queryRunner.query(`ALTER TABLE \`INVOICE_ITEMS\` DROP FOREIGN KEY \`FK_24bbb98d5e7f08f49659bb6cd2a\``);
        await queryRunner.query(`ALTER TABLE \`INVOICE_ITEMS\` DROP FOREIGN KEY \`FK_d63fd44056931a37eb3bfe2b3fe\``);
        await queryRunner.query(`DROP INDEX \`IDX_3cd5487836f15b75f179f12ad2\` ON \`INVOICES\``);
        await queryRunner.query(`DROP TABLE \`INVOICES\``);
        await queryRunner.query(`DROP TABLE \`INVOICE_ITEMS\``);
        await queryRunner.query(`DROP INDEX \`IDX_9c711a3973b65c96daba11c7be\` ON \`CUSTOMERS\``);
        await queryRunner.query(`DROP TABLE \`CUSTOMERS\``);
        await queryRunner.query(`DROP INDEX \`IDX_5b6dc0d0f43e56843c7049091c\` ON \`PRODUCTS\``);
        await queryRunner.query(`DROP TABLE \`PRODUCTS\``);
    }

}
