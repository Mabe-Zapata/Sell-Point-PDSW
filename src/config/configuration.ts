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
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'root',
    password:
      process.env.DATABASE_PASSWORD !== undefined
        ? process.env.DATABASE_PASSWORD
        : 'root',
    name: process.env.DATABASE_NAME || 'sellpoint',
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
