import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddGoogleEmailToUsers1800000000011 implements MigrationInterface {
  name = 'AddGoogleEmailToUsers1800000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'USERS',
      new TableColumn({
        name: 'GOOGLE_EMAIL',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('USERS', 'GOOGLE_EMAIL');
  }
}
