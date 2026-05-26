import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
} from 'typeorm';

/**
 * Migration: AddRequestFieldsToPasswordResetTokens
 *
 * Adds REQUEST_IP and REQUEST_USER_AGENT columns to PASSWORD_RESET_TOKENS
 * to track where password reset requests originate from.
 * This information is shown in password change notification emails.
 */
export class AddRequestFieldsToPasswordResetTokens1800000000006 implements MigrationInterface {
  name = 'AddRequestFieldsToPasswordResetTokens1800000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'PASSWORD_RESET_TOKENS',
      new TableColumn({
        name: 'REQUEST_IP',
        type: 'varchar',
        length: '45',
        isNullable: true,
        default: null,
      }),
    );

    await queryRunner.addColumn(
      'PASSWORD_RESET_TOKENS',
      new TableColumn({
        name: 'REQUEST_USER_AGENT',
        type: 'varchar',
        length: '512',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('PASSWORD_RESET_TOKENS', 'REQUEST_USER_AGENT');
    await queryRunner.dropColumn('PASSWORD_RESET_TOKENS', 'REQUEST_IP');
  }
}