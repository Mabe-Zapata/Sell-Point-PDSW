import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';
export class AddPasswordFieldsToUser1800000000005 implements MigrationInterface {
  name = 'AddPasswordFieldsToUser1800000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const boolType = dbType === 'postgres' ? 'boolean' : 'number';
    const boolDefault = dbType === 'postgres' ? 'true' : '1';

    // Add CURRENT_PAS_HASH (previous password hash for history)
    await queryRunner.addColumn(
      'USERS',
      new TableColumn({
        name: 'CURRENT_PAS_HASH',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // Add PAS_EXPIRED (boolean flag)
    await queryRunner.addColumn(
      'USERS',
      new TableColumn({
        name: 'PAS_EXPIRED',
        type: boolType,
        default: boolDefault,
      }),
    );

    // PAS_EXPIRED and CURRENT_PAS_HASH added above, FAILED_ATTEMPTS already exists in baseline
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('USERS', 'PAS_EXPIRED');
    await queryRunner.dropColumn('USERS', 'CURRENT_PAS_HASH');
  }
}
