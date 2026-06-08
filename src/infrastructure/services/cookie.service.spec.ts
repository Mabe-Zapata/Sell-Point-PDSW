import { ConfigService } from '@nestjs/config';
import { CookieService, CookieConfig } from './cookie.service';
import type { Response, Request } from 'express';

describe('CookieService', () => {
  const baseConfig: CookieConfig = {
    name: 'refreshToken',
    path: '/',
    maxAge: 604800,
    rememberMeMaxAge: 2592000,
    sameSite: 'strict',
    secure: false,
    domain: undefined,
  };

  const prodConfig: CookieConfig = { ...baseConfig, secure: true };

  const buildConfigService = (overrides: Partial<CookieConfig> = {}): ConfigService => {
    const cfg: CookieConfig = { ...baseConfig, ...overrides };
    return {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'cookie') return cfg;
        return undefined;
      }),
    } as unknown as ConfigService;
  };

  const buildResponse = (): Response & { _cookies: Record<string, { value: string; options: Record<string, unknown> }> } => {
    const cookies: Record<string, { value: string; options: Record<string, unknown> }> = {};
    const res = {
      cookie: jest.fn((name: string, value: string, options: Record<string, unknown>) => {
        cookies[name] = { value, options };
        return res;
      }),
      clearCookie: jest.fn((name: string, options: Record<string, unknown>) => {
        cookies[name] = { value: '', options: { ...options, maxAge: 0 } };
        return res;
      }),
      _cookies: cookies,
    };
    return res as unknown as Response & { _cookies: Record<string, { value: string; options: Record<string, unknown> }> };
  };

  describe('setRefreshTokenCookie', () => {
    it('writes the refreshToken cookie with HttpOnly, SameSite=Strict, Path=/, maxAge=604800 (7d) in dev', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const res = buildResponse();

      service.setRefreshTokenCookie(res, 'uuid-123', false);

      expect(res.cookie).toHaveBeenCalledTimes(1);
      const [name, value, options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(name).toBe('refreshToken');
      expect(value).toBe('uuid-123');
      expect(options).toEqual(
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          maxAge: 604800,
        }),
      );
      expect(options.secure).toBeUndefined();
    });

    it('includes Secure flag when cookie.secure=true (production)', () => {
      const configService = buildConfigService({ secure: true });
      const service = new CookieService(configService);
      const res = buildResponse();

      service.setRefreshTokenCookie(res, 'uuid-prod', false);

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.secure).toBe(true);
    });

    it('omits Secure flag when cookie.secure=false (dev/local)', () => {
      const configService = buildConfigService({ secure: false });
      const service = new CookieService(configService);
      const res = buildResponse();

      service.setRefreshTokenCookie(res, 'uuid-dev', false);

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.secure).toBeUndefined();
    });

    it('uses rememberMeMaxAge (30d) when rememberMe=true', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const res = buildResponse();

      service.setRefreshTokenCookie(res, 'uuid-remember', true);

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.maxAge).toBe(2592000);
    });

    it('forwards domain when configured', () => {
      const configService = buildConfigService({ domain: 'sellpoint.com' });
      const service = new CookieService(configService);
      const res = buildResponse();

      service.setRefreshTokenCookie(res, 'uuid-dom', false);

      const [, , options] = (res.cookie as jest.Mock).mock.calls[0];
      expect(options.domain).toBe('sellpoint.com');
    });
  });

  describe('clearRefreshTokenCookie', () => {
    it('clears the cookie with maxAge=0, path=/, httpOnly, sameSite=strict', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const res = buildResponse();

      service.clearRefreshTokenCookie(res);

      expect(res.clearCookie).toHaveBeenCalledTimes(1);
      const [name, options] = (res.clearCookie as jest.Mock).mock.calls[0];
      expect(name).toBe('refreshToken');
      expect(options).toEqual(
        expect.objectContaining({
          path: '/',
          httpOnly: true,
          sameSite: 'strict',
        }),
      );
      expect(options.maxAge).toBe(0);
    });

    it('includes Secure flag on clear when production', () => {
      const configService = buildConfigService({ secure: true });
      const service = new CookieService(configService);
      const res = buildResponse();

      service.clearRefreshTokenCookie(res);

      const [, options] = (res.clearCookie as jest.Mock).mock.calls[0];
      expect(options.secure).toBe(true);
    });
  });

  describe('readRefreshTokenCookie', () => {
    it('returns the cookie value when present', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const req = { cookies: { refreshToken: 'uuid-from-cookie' } } as unknown as Request;

      expect(service.readRefreshTokenCookie(req)).toBe('uuid-from-cookie');
    });

    it('returns undefined when the cookie is absent', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const req = { cookies: {} } as unknown as Request;

      expect(service.readRefreshTokenCookie(req)).toBeUndefined();
    });

    it('returns undefined when req.cookies is missing entirely', () => {
      const configService = buildConfigService();
      const service = new CookieService(configService);
      const req = {} as unknown as Request;

      expect(service.readRefreshTokenCookie(req)).toBeUndefined();
    });
  });
});
