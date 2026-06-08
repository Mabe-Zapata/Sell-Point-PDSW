import { configuration } from './configuration';

describe('configuration() — cookie block', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    delete process.env.NODE_ENV;
    delete process.env.APP_MODE;
    delete process.env.COOKIE_DOMAIN;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns a cookie block with the expected defaults in local mode', () => {
    process.env.APP_MODE = 'local';
    const config = configuration() as { cookie: { name: string; path: string; maxAge: number; rememberMeMaxAge: number; sameSite: string; secure: boolean; domain?: string } };

    expect(config.cookie).toBeDefined();
    expect(config.cookie.name).toBe('refreshToken');
    expect(config.cookie.path).toBe('/');
    expect(config.cookie.maxAge).toBe(604800);
    expect(config.cookie.rememberMeMaxAge).toBe(2592000);
    expect(config.cookie.sameSite).toBe('strict');
    expect(config.cookie.secure).toBe(false);
    expect(config.cookie.domain).toBeUndefined();
  });

  it('derives secure=true when APP_MODE=production', () => {
    process.env.APP_MODE = 'production';
    const config = configuration() as { cookie: { secure: boolean } };

    expect(config.cookie.secure).toBe(true);
  });

  it('honors COOKIE_DOMAIN env var when set', () => {
    process.env.APP_MODE = 'local';
    process.env.COOKIE_DOMAIN = 'sellpoint.com';
    const config = configuration() as { cookie: { domain?: string } };

    expect(config.cookie.domain).toBe('sellpoint.com');
  });
});
