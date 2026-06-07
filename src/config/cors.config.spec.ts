import type { ConfigService } from '@nestjs/config';
import { buildCorsOptions, getAllowedOrigins } from './cors.config';

describe('cors.config', () => {
  const createConfigService = (allowedOrigins: string[]): ConfigService =>
    ({
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'app.allowedOrigins') {
          return allowedOrigins;
        }

        return undefined;
      }),
    }) as unknown as ConfigService;

  it('should return configured allowed origins', () => {
    const configService = createConfigService(['http://localhost:4321', 'https://app.sellpoint.com']);

    expect(getAllowedOrigins(configService)).toEqual([
      'http://localhost:4321',
      'https://app.sellpoint.com',
    ]);
  });

  it('should allow requests without origin', () => {
    const configService = createConfigService(['http://localhost:4321']);
    const corsOptions = buildCorsOptions(configService);
    const origin = corsOptions.origin as (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;

    const callback = jest.fn();
    origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should allow whitelisted origins only', () => {
    const configService = createConfigService(['http://localhost:4321']);
    const corsOptions = buildCorsOptions(configService);
    const origin = corsOptions.origin as (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => void;

    const allowedCallback = jest.fn();
    origin('http://localhost:4321', allowedCallback);
    expect(allowedCallback).toHaveBeenCalledWith(null, true);

    const deniedCallback = jest.fn();
    origin('https://evil.com', deniedCallback);
    expect(deniedCallback).toHaveBeenCalledWith(null, false);
  });
});
