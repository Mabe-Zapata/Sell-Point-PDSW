import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUsersCedulaIndex1800000000024 implements MigrationInterface {
  name = 'AddUsersCedulaIndex1800000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);
    const table = (name: string) => quote(name);

    await queryRunner.query(`
      CREATE INDEX idx_users_cedula_search
      ON ${table('USERS')} (${quote('CED_USR')})
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const quote = (name: string) => (dbType === 'postgres' ? `"${name}"` : name);

    await queryRunner.query(`DROP INDEX ${quote('idx_users_cedula_search')}`);
  }
}
