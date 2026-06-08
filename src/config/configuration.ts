export interface RedisConfig {
  host: string;
  port: number;
  url?: string;
  password?: string;
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
  url?: string;
}

type AppMode = 'local' | 'production';

const normalizeMode = (value?: string): AppMode =>
  value?.toLowerCase() === 'production' ? 'production' : 'local';

const pick = (primary?: string, fallback?: string): string | undefined =>
  primary && primary.trim() !== '' ? primary : fallback;

const intFrom = (value: string | undefined, fallback: string): number =>
  parseInt(value || fallback, 10);

export const configuration = () => {
  const appMode = normalizeMode(process.env.APP_MODE);
  const dbType = (process.env.DB_TYPE || 'postgres') as 'postgres' | 'oracle';
  const fallbackFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || fallbackFrontendUrl)
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const postgresLocal = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: intFrom(process.env.POSTGRES_PORT, '5432'),
    username: process.env.POSTGRES_USER || 'sellpoint',
    password: process.env.POSTGRES_PASSWORD || 'sellpoint',
    name: process.env.POSTGRES_DB || 'sellpoint',
    url: pick(process.env.POSTGRES_URL, process.env.DATABASE_URL),
  };

  const postgresProduction = {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: intFrom(process.env.POSTGRES_PORT, '5432'),
    username: process.env.POSTGRES_USER || 'sellpoint',
    password: process.env.POSTGRES_PASSWORD || 'sellpoint',
    name: process.env.POSTGRES_DB || 'sellpoint',
    url: pick(process.env.POSTGRES_URL_PROD, pick(process.env.POSTGRES_CLOUD_URL, process.env.DATABASE_URL)),
  };

  const oracleConfig = {
    host: process.env.ORACLE_HOST || 'localhost',
    port: intFrom(process.env.ORACLE_PORT, '1521'),
    username: process.env.ORACLE_APP_USER || 'sell_point',
    password: process.env.ORACLE_APP_PASSWORD || process.env.ORACLE_PASSWORD || 'sellpoint123',
    name: process.env.ORACLE_DATABASE || 'FREEPDB1',
  };

  const redisLocal = {
    host: process.env.REDIS_HOST || 'localhost',
    port: intFrom(process.env.REDIS_PORT, '6379'),
    url: pick(process.env.REDIS_URL, undefined),
    password: pick(process.env.REDIS_PASSWORD, process.env.REDIS_TOKEN),
  };

  const redisProduction = {
    host: process.env.REDIS_HOST || 'localhost',
    port: intFrom(process.env.REDIS_PORT, '6379'),
    url: pick(process.env.REDIS_URL_PROD, process.env.REDIS_URL),
    password: pick(process.env.REDIS_PASSWORD, process.env.REDIS_TOKEN),
  };

  const database: DatabaseConfig =
    dbType === 'postgres'
      ? {
          type: dbType,
          ...(appMode === 'production' ? postgresProduction : postgresLocal),
        }
      : {
          type: dbType,
          ...oracleConfig,
        };

  return {
    app: {
      mode: appMode,
      port: intFrom(process.env.PORT, '3000'),
      frontendBaseUrl: fallbackFrontendUrl,
      allowedOrigins,
    },
    database,
    tax: {
      percentage: parseFloat(process.env.IVA_PERCENTAGE || '15'),
    },
    redis: {
      ...(appMode === 'production' ? redisProduction : redisLocal),
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-min-32-chars',
    },
    auth: {
      maxFailedAttempts: parseInt(process.env.AUTH_MAX_FAILED_ATTEMPTS || '5', 10),
    },
    brevo: {
      apiKey: process.env.BREVO_API_KEY || '',
      senderEmail: process.env.BREVO_SENDER_EMAIL || 'noreply@sellpoint.com',
      senderName: process.env.BREVO_SENDER_NAME || 'Sell Point',
      templates: {
        orderConfirmation: intFrom(process.env.BREVO_TEMPLATE_ORDER_CONFIRMATION_ID, '1'),
        saleCancelled: intFrom(process.env.BREVO_TEMPLATE_SALE_CANCELLED_ID, '2'),
        invoice: intFrom(process.env.BREVO_TEMPLATE_INVOICE_ID, '3'),
      },
    },
    cookie: {
      name: process.env.COOKIE_NAME || 'refreshToken',
      path: process.env.COOKIE_PATH || '/',
      maxAge: intFrom(process.env.COOKIE_MAX_AGE, '604800'),
      rememberMeMaxAge: intFrom(process.env.COOKIE_REMEMBER_ME_MAX_AGE, '2592000'),
      sameSite: (process.env.COOKIE_SAME_SITE || 'strict') as 'strict' | 'lax' | 'none',
      secure: appMode === 'production',
      domain: process.env.COOKIE_DOMAIN || undefined,
    },
  };
};
