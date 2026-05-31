import { Logger, QueryRunner } from 'typeorm';

export class TypeormQueryLogger implements Logger {
  constructor(private readonly dbLabel: string) {}

  private formatParams(parameters?: unknown[]): string {
    if (!parameters || parameters.length === 0) return '[]';

    try {
      return JSON.stringify(parameters, null, 2);
    } catch {
      return '[unserializable parameters]';
    }
  }

  private printBlock(title: string, query: string, parameters?: unknown[], extra?: string): void {
    const suffix = extra ? ` ${extra}` : '';
    // eslint-disable-next-line no-console
    console.log(`\n[TYPEORM][${this.dbLabel}] ${title}${suffix}`);
    // eslint-disable-next-line no-console
    console.log('SQL>');
    // eslint-disable-next-line no-console
    console.log(query);
    // eslint-disable-next-line no-console
    console.log('PARAMS>');
    // eslint-disable-next-line no-console
    console.log(this.formatParams(parameters));
  }

  logQuery(query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    void query;
    void parameters;
  }

  logQueryError(error: string | Error, query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    const detail = error instanceof Error ? error.message : error;
    this.printBlock('QUERY ERROR', query, parameters, `| ${detail}`);
  }

  logQuerySlow(time: number, query: string, parameters?: unknown[], _queryRunner?: QueryRunner): void {
    this.printBlock('QUERY TIME', query, parameters, `| ${time} ms`);
  }

  logSchemaBuild(message: string, _queryRunner?: QueryRunner): void {
    // eslint-disable-next-line no-console
    console.log(`[TYPEORM][${this.dbLabel}] SCHEMA ${message}`);
  }

  logMigration(message: string, _queryRunner?: QueryRunner): void {
    // eslint-disable-next-line no-console
    console.log(`[TYPEORM][${this.dbLabel}] MIGRATION ${message}`);
  }

  log(level: 'log' | 'info' | 'warn', message: unknown, _queryRunner?: QueryRunner): void {
    // eslint-disable-next-line no-console
    console[level](`[TYPEORM][${this.dbLabel}] ${String(message)}`);
  }
}
