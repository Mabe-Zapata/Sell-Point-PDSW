import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { Request, Response } from 'express';

describe('AuthController - refresh cookie contract (T5)', () => {
  let controller: AuthController;
  const mockAuthService = {
    rotateRefreshToken: jest.fn(),
    validateRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
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

  it('reads the refresh token from req.cookies via CookieService (ignores any body field)', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-from-cookie');
    mockAuthService.rotateRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-uuid',
      expiresIn: 900,
    });
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid-from-cookie' });

    await controller.refresh(req, res);

    expect(mockCookieService.readRefreshTokenCookie).toHaveBeenCalledWith(req);
  });

  it('calls authService.rotateRefreshToken with the cookie token', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-from-cookie');
    mockAuthService.rotateRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'new-uuid',
      expiresIn: 900,
    });
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid-from-cookie' });

    await controller.refresh(req, res);

    expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith('uuid-from-cookie');
  });

  it('sets a new refresh-token cookie with the new token via CookieService', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('old-uuid');
    mockAuthService.rotateRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'rotated-uuid',
      expiresIn: 900,
    });
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'old-uuid' });

    await controller.refresh(req, res);

    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
      res,
      'rotated-uuid',
      false,
    );
  });

  it('returns { accessToken, expiresIn: 900 } with no refreshToken in the body', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid');
    mockAuthService.rotateRefreshToken.mockResolvedValue({
      accessToken: 'new-access',
      refreshToken: 'rotated-uuid',
      expiresIn: 900,
    });
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'uuid' });

    const result = await controller.refresh(req, res);

    expect(result).toEqual({ accessToken: 'new-access', expiresIn: 900 });
    expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
  });

  it('throws UnauthorizedException when no cookie is present', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue(undefined);
    const res = buildResponse();
    const req = buildRequest({});

    await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    expect(mockAuthService.rotateRefreshToken).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedException when rotateRefreshToken returns null (expired/revoked cookie)', async () => {
    mockCookieService.readRefreshTokenCookie.mockReturnValue('old-uuid');
    mockAuthService.rotateRefreshToken.mockResolvedValue(null);
    const res = buildResponse();
    const req = buildRequest({ refreshToken: 'old-uuid' });

    await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    expect(mockCookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
  });
});
