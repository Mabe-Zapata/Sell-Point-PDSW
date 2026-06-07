import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { ConfigService } from '@nestjs/config';

export const getAllowedOrigins = (configService: ConfigService): string[] => {
  const configuredOrigins = configService.get<string[]>('app.allowedOrigins');

  if (!configuredOrigins || configuredOrigins.length === 0) {
    return [];
  }

  return configuredOrigins
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
};

export const buildCorsOptions = (configService: ConfigService): CorsOptions => {
  const allowedOrigins = getAllowedOrigins(configService);

  return {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  };
};
