import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersTable1776900000000 implements MigrationInterface {
  name = 'AddUsersTable1776900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`USERS\` (` +
        `\`id\` varchar(36) NOT NULL, ` +
        `\`EMP_ID\` varchar(50) NOT NULL, ` +
        `\`EMA_USR\` varchar(255) NULL, ` +
        `\`PAS_HASH\` varchar(255) NOT NULL, ` +
        `\`ROL_USR\` varchar(30) NOT NULL DEFAULT 'ADMIN', ` +
        `\`ACT_USR\` tinyint NOT NULL DEFAULT 1, ` +
        `\`CRE_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), ` +
        `\`UPD_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), ` +
        `\`DEL_AT\` datetime(6) NULL, ` +
        `PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`USERS\``);
  }
}
