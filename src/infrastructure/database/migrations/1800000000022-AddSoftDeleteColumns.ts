import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSoftDeleteColumns1800000000022 implements MigrationInterface {
  name = 'AddSoftDeleteColumns1800000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const q = (identifier: string): string =>
      dbType === 'postgres' ? `"${identifier}"` : identifier;

    const targets = [
      { tableName: 'PRODUCTS',   indexName: 'IDX_PRO_DEL_AT' },
      { tableName: 'CUSTOMERS',  indexName: 'IDX_CUS_DEL_AT' },
      { tableName: 'CATEGORIES', indexName: 'IDX_CAT_DEL_AT' },
      { tableName: 'USERS',      indexName: 'IDX_USR_DEL_AT' },
    ];

    for (const { tableName, indexName } of targets) {
      const table = await queryRunner.getTable(tableName);
      if (!table) continue;

      const hasColumn = table.columns.some((col) => col.name === 'DEL_AT');
      if (!hasColumn) {
        await queryRunner.addColumn(
          tableName,
          new TableColumn({
            name: 'DEL_AT',
            type: 'timestamp',
            precision: 6,
            isNullable: true,
          }),
        );
      }

      const refreshed = await queryRunner.getTable(tableName);
      const hasIndex = refreshed?.indices.some((idx) => idx.name === indexName) ?? false;
      if (!hasIndex) {
        await queryRunner.query(
          `CREATE INDEX ${q(indexName)} ON ${q(tableName)} (${q('DEL_AT')})`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const dbType = queryRunner.connection.options.type as string;
    const q = (identifier: string): string =>
      dbType === 'postgres' ? `"${identifier}"` : identifier;

    const targets = [
      { tableName: 'USERS',      indexName: 'IDX_USR_DEL_AT' },
      { tableName: 'CATEGORIES', indexName: 'IDX_CAT_DEL_AT' },
      { tableName: 'CUSTOMERS',  indexName: 'IDX_CUS_DEL_AT' },
      { tableName: 'PRODUCTS',   indexName: 'IDX_PRO_DEL_AT' },
    ];

    for (const { tableName, indexName } of targets) {
      const table = await queryRunner.getTable(tableName);
      if (!table) continue;

      const hasIndex = table.indices.some((idx) => idx.name === indexName);
      if (hasIndex) {
        await queryRunner.query(`DROP INDEX ${q(indexName)}`);
      }

      const hasColumn = table.columns.some((col) => col.name === 'DEL_AT');
      if (hasColumn) {
        await queryRunner.dropColumn(tableName, 'DEL_AT');
      }
    }
  }
}
