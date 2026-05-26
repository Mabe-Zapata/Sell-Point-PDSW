import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableIndex,
} from 'typeorm';

export class UseUserRolesAsSourceOfTruth1800000000007 implements MigrationInterface {
  name = 'UseUserRolesAsSourceOfTruth1800000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const esc = (name: string): string => queryRunner.connection.driver.escape(name);
    const usersTable = esc('USERS');
    const rolesTable = esc('ROLES');
    const userRolesTable = esc('USER_ROLES');

    await queryRunner.query(`DELETE FROM ${userRolesTable}`);
    await queryRunner.query(
      `
        INSERT INTO ${userRolesTable} (${esc('USR_ID')}, ${esc('ROL_ID')}, ${esc('CRE_AT')})
        SELECT u.${esc('id')}, r.${esc('id')}, CURRENT_TIMESTAMP
        FROM ${usersTable} u
        INNER JOIN ${rolesTable} r ON r.${esc('NAM_ROL')} = u.${esc('ROL_USR')}
        WHERE u.${esc('ROL_USR')} IS NOT NULL AND TRIM(u.${esc('ROL_USR')}) <> ''
      `,
    );

    await queryRunner.createIndex(
      'USER_ROLES',
      new TableIndex({ name: 'UX_USER_ROLES_USR_ID', columnNames: ['USR_ID'], isUnique: true }),
    );

    await queryRunner.dropColumn('USERS', 'ROL_USR');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const esc = (name: string): string => queryRunner.connection.driver.escape(name);
    const usersTable = esc('USERS');
    const rolesTable = esc('ROLES');
    const userRolesTable = esc('USER_ROLES');

    await queryRunner.addColumn(
      'USERS',
      new TableColumn({
        name: 'ROL_USR',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    await queryRunner.query(
      `
        UPDATE ${usersTable} u
        SET ${esc('ROL_USR')} = (
          SELECT r.${esc('NAM_ROL')}
          FROM ${userRolesTable} ur
          INNER JOIN ${rolesTable} r ON r.${esc('id')} = ur.${esc('ROL_ID')}
          WHERE ur.${esc('USR_ID')} = u.${esc('id')}
        )
      `,
    );

    await queryRunner.dropIndex('USER_ROLES', 'UX_USER_ROLES_USR_ID');
  }
}
