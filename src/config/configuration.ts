export interface RedisConfig {
  host: string;
  port: number;
  url?: string;
  token?: string;
}

export interface JwtConfig {
  secret: string;
}

export const configuration = () => ({
  database: {
    host: process.env.DATABASE_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || process.env.POSTGRES_USER || 'sellpoint',
    password:
      process.env.DATABASE_PASSWORD !== undefined
        ? process.env.DATABASE_PASSWORD
        : process.env.POSTGRES_PASSWORD || 'sellpoint',
    name: process.env.DATABASE_NAME || process.env.POSTGRES_DB || 'sellpoint',
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
});
