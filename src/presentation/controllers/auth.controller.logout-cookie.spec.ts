import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { Request, Response } from 'express';

describe('AuthController - logout (T7)', () => {
  let controller: AuthController;
  const mockAuthService = {
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
  };
  const mockCommandBus = { execute: jest.fn() };
  const mockPasswordResetTokenRepository = {};
  const mockCookieService = {
    setRefreshTokenCookie: jest.fn(),
    clearRefreshTokenCookie: jest.fn(),
    readRefreshTokenCookie: jest.fn(),
  };

  const buildResponse = (): Response => {
    const res: Partial<Response> = {};
    res.cookie = jest.fn() as unknown as Response['cookie'];
    res.clearCookie = jest.fn() as unknown as Response['clearCookie'];
    return res as Response;
  };

  const buildRequest = (cookies: Record<string, string> = {}): Request =>
    ({ cookies }) as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'login', ttl: 60000, limit: 5 }])],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: CookieService, useValue: mockCookieService },
        { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useValue: mockPasswordResetTokenRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('returns undefined (204) and revokes the refresh token in Redis when the cookie is present', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-to-revoke');
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid-to-revoke' });

    const result = await controller.logout(req, res);

    expect(result).toBeUndefined();
    expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith('uuid-to-revoke');
  });

  it('clears the refresh-token cookie in the response', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-to-revoke');
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid-to-revoke' });

    await controller.logout(req, res);

    expect(mockCookieService.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
  });

  it('returns 204 (undefined) and does NOT call revokeRefreshToken when no cookie is present', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue(undefined);
    const res = buildResponse();
    const req = buildRequest({});

    const result = await controller.logout(req, res);

    expect(result).toBeUndefined();
    expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
    expect(mockCookieService.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
  });

  it('returns 204 (undefined) on a repeat call (idempotent) and does NOT throw when revoke returns', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-to-revoke');
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid-to-revoke' });

    await expect(controller.logout(req, res)).resolves.toBeUndefined();
    await expect(controller.logout(req, res)).resolves.toBeUndefined();
    expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledTimes(2);
  });
});
