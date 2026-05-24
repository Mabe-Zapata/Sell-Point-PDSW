type DatabaseDialect = 'postgres' | 'oracle';

const currentDialect = (): DatabaseDialect =>
  (process.env.DB_TYPE || 'postgres') === 'oracle' ? 'oracle' : 'postgres';

export const dbBooleanColumn = (defaultValue = true) =>
  currentDialect() === 'oracle'
    ? { type: 'number' as const, default: defaultValue ? 1 : 0 }
    : { type: 'boolean' as const, default: defaultValue };

export const dbLongTextColumn = (nullable = false) =>
  currentDialect() === 'oracle'
    ? { type: 'varchar2' as const, length: 4000, nullable }
    : { type: 'text' as const, nullable };
