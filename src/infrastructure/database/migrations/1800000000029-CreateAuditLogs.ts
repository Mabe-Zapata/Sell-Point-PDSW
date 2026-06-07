import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAuditLogs1800000000029 implements MigrationInterface {
  name = 'CreateAuditLogs1800000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;

    if (dbType !== 'postgres') {
      throw new Error('CreateAuditLogs1800000000029 supports PostgreSQL only because it requires JSONB columns.');
    }

    const hasTable = await queryRunner.hasTable('audit_logs');
    if (hasTable) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
          },
          {
            name: 'table_name',
            type: 'varchar',
            length: '128',
          },
          {
            name: 'record_id',
            type: 'uuid',
          },
          {
            name: 'action',
            type: 'enum',
            enum: ['INSERT', 'UPDATE', 'DELETE'],
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'rol',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'changed_columns',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'old_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'new_values',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'ip',
            type: 'varchar',
            length: '45',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'varchar',
            length: '512',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            precision: 6,
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        foreignKeys: [
          new TableForeignKey({
            name: 'FK_AUDIT_LOGS_USER_ID',
            columnNames: ['user_id'],
            referencedTableName: 'USERS',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          }),
        ],
      }),
      true,
    );

    await queryRunner.createIndices('audit_logs', [
      new TableIndex({ name: 'IDX_AUDIT_LOGS_TABLE_NAME', columnNames: ['table_name'] }),
      new TableIndex({ name: 'IDX_AUDIT_LOGS_RECORD_ID', columnNames: ['record_id'] }),
      new TableIndex({ name: 'IDX_AUDIT_LOGS_USER_ID', columnNames: ['user_id'] }),
      new TableIndex({ name: 'IDX_AUDIT_LOGS_CREATED_AT', columnNames: ['created_at'] }),
      new TableIndex({ name: 'IDX_AUDIT_LOGS_ACTION', columnNames: ['action'] }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('audit_logs');
    if (!hasTable) {
      return;
    }

    await queryRunner.dropTable('audit_logs', true);

    const hasEnum = await queryRunner.query(`
      SELECT 1
      FROM pg_type
      WHERE typname = 'audit_logs_action_enum'
      LIMIT 1
    `);

    if (Array.isArray(hasEnum) && hasEnum.length > 0) {
      await queryRunner.query('DROP TYPE "audit_logs_action_enum"');
    }
  }
}
