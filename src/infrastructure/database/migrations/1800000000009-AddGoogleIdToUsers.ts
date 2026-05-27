import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleIdToUsers1800000000009 implements MigrationInterface {
  name = 'AddGoogleIdToUsers1800000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'USERS',
      new TableColumn({
        name: 'GOOGLE_ID',
        type: 'varchar',
        length: '255',
        isNullable: true,
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('USERS', 'GOOGLE_ID');
  }
}
