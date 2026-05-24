export interface RedisConfig {
  host: string;
  port: number;
  url?: string;
  token?: string;
}

export interface JwtConfig {
  secret: string;
}

export interface DatabaseConfig {
  type: 'postgres' | 'oracle';
  host: string;
  port: number;
  username: string;
  password: string;
  name: string;
}

export const configuration = () => {
  const dbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'oracle';

  const postgresConfig = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'sellpoint',
    password: process.env.POSTGRES_PASSWORD || 'sellpoint',
    name: process.env.POSTGRES_DB || 'sellpoint',
  };

  const oracleConfig = {
    host: process.env.ORACLE_HOST || 'localhost',
    port: parseInt(process.env.ORACLE_PORT || '1521', 10),
    username: process.env.ORACLE_APP_USER || 'sell_point',
    password: process.env.ORACLE_APP_PASSWORD || process.env.ORACLE_PASSWORD || 'sellpoint123',
    name: process.env.ORACLE_DATABASE || 'FREEPDB1',
  };

  return {
    database: {
      type: dbType,
      ...(dbType === 'postgres' ? postgresConfig : oracleConfig),
    },
    tax: {
      percentage: parseFloat(process.env.IVA_PERCENTAGE || '15'),
    },
    app: {
      port: parseInt(process.env.PORT || '3000', 10),
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-min-32-chars',
    },
  };
};
