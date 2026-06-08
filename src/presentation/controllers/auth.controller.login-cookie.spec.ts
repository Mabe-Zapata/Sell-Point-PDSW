import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { Response } from 'express';

describe('AuthController - login cookie contract (T4)', () => {
  let controller: AuthController;
  const mockAuthService = {
    login: jest.fn(),
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

  it('returns { accessToken, expiresIn: 900 } with no refreshToken in the body on success', async () => {
    mockAuthService.login.mockResolvedValue({
      accessToken: 'access-jwt-abc',
      refreshToken: 'should-not-leak',
      expiresIn: 900,
    });
    const res = buildResponse();

    const result = await controller.login(
      { email: 'admin@test.com', password: 'pw', rememberMe: false } as never,
      res,
    );

    expect(result).toEqual({ accessToken: 'access-jwt-abc', expiresIn: 900 });
    expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
  });

  it('sets the refresh-token cookie via CookieService with the new refresh token', async () => {
    mockAuthService.login.mockResolvedValue({
      accessToken: 'access-jwt-abc',
      refreshToken: 'uuid-cookie-value',
      expiresIn: 900,
    });
    const res = buildResponse();

    await controller.login(
      { email: 'admin@test.com', password: 'pw', rememberMe: false } as never,
      res,
    );

    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledTimes(1);
    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
      res,
      'uuid-cookie-value',
      false,
    );
  });

  it('forwards the rememberMe flag to CookieService.setRefreshTokenCookie', async () => {
    mockAuthService.login.mockResolvedValue({
      accessToken: 'access-jwt',
      refreshToken: 'uuid-remember',
      expiresIn: 900,
    });
    const res = buildResponse();

    await controller.login(
      { email: 'admin@test.com', password: 'pw', rememberMe: true } as never,
      res,
    );

    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
      res,
      'uuid-remember',
      true,
    );
  });

  it('does NOT set the cookie when login returns null (unauthorized credentials)', async () => {
    mockAuthService.login.mockResolvedValue(null);
    const res = buildResponse();

    await expect(
      controller.login(
        { email: 'x@y.com', password: 'bad', rememberMe: false } as never,
        res,
      ),
    ).rejects.toThrow(UnauthorizedException);
    expect(mockCookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
  });
});
