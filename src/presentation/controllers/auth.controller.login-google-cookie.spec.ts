import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { Response } from 'express';

describe('AuthController - loginGoogle cookie contract (T8)', () => {
  let controller: AuthController;
  const mockAuthService = {
    loginGoogle: jest.fn(),
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

  it('returns { accessToken, expiresIn: 900 } and sets the refresh-token cookie', async () => {
    mockAuthService.loginGoogle.mockResolvedValue({
      accessToken: 'google-access-jwt',
      refreshToken: 'google-uuid',
      expiresIn: 900,
    });
    const res = buildResponse();

    const result = await controller.loginGoogle({ idToken: 'google-id-token' } as never, res);

    expect(result).toEqual({ accessToken: 'google-access-jwt', expiresIn: 900 });
    expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
      res,
      'google-uuid',
      false,
    );
  });
});
