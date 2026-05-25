import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'typeorm';

/**
 * Migration: CreatePasswordResetTokens
 *
 * Creates PASSWORD_RESET_TOKENS table for ephemeral password reset tokens.
 * Engine-specific handling via queryRunner.connection.options.type:
 * - Postgres: uuid type for ID columns
 * - Oracle: varchar2(36) for ID columns
 */
export class CreatePasswordResetTokens1800000000004 implements MigrationInterface {
  name = 'CreatePasswordResetTokens';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type;
    const uuidType = dbType === 'postgres' ? 'uuid' : 'varchar';
    const uuidLength = dbType === 'postgres' ? undefined : '36';

    const col = (name: string, type: string, opts: Partial<TableColumn> = {}): TableColumn => {
      return new TableColumn({ name, type, ...opts });
    };

    await queryRunner.createTable(
      new Table({
        name: 'PASSWORD_RESET_TOKENS',
        columns: [
          col('id', uuidType, { isPrimary: true }),
          col('USER_ID', uuidType, { length: uuidLength }),
          col('TOKEN_HASH', 'varchar', { length: '64' }),
          col('EXPIRES_AT', 'timestamp', { precision: 6 }),
          col('USED_AT', 'timestamp', { precision: 6, isNullable: true, default: null }),
          col('CRE_AT', 'timestamp', { precision: 6, default: 'CURRENT_TIMESTAMP' }),
        ],
      }),
    );

    await queryRunner.createIndex(
      'PASSWORD_RESET_TOKENS',
      new TableIndex({ name: 'IDX_PRT_TOKEN_HASH', columnNames: ['TOKEN_HASH'], isUnique: true }),
    );
    await queryRunner.createIndex(
      'PASSWORD_RESET_TOKENS',
      new TableIndex({ name: 'IDX_PRT_USER_ID', columnNames: ['USER_ID'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('PASSWORD_RESET_TOKENS', 'IDX_PRT_USER_ID');
    await queryRunner.dropIndex('PASSWORD_RESET_TOKENS', 'IDX_PRT_TOKEN_HASH');
    await queryRunner.dropTable('PASSWORD_RESET_TOKENS');
  }
}
