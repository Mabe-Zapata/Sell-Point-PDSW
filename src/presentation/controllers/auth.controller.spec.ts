import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { CookieService } from '../../infrastructure/services/cookie.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';
import type { Response, Request } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    loginGoogle: jest.fn(),
    validateRefreshToken: jest.fn(),
    rotateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    revokeAllUserRefreshTokens: jest.fn(),
    generateAccessToken: jest.fn(),
    getAuthenticatedUser: jest.fn(),
    updateAuthenticatedUserProfile: jest.fn(),
    linkGoogle: jest.fn(),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

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
      imports: [
        ThrottlerModule.forRoot([
          {
            name: 'login',
            ttl: 60000,
            limit: 5,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: CookieService, useValue: mockCookieService },
        { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useValue: mockPasswordResetTokenRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return { accessToken, expiresIn: 900 } on success and set the refresh cookie', async () => {
      const mockTokens = {
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-uuid',
        expiresIn: 900,
      };
      mockAuthService.login.mockResolvedValue(mockTokens);
      const res = buildResponse();

      const result = await controller.login(
        { email: 'admin@test.com', password: 'password123', rememberMe: false } as never,
        res,
      );

      expect(result).toEqual({ accessToken: 'access-token-abc', expiresIn: 900 });
      expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
      expect(mockAuthService.login).toHaveBeenCalledWith('admin@test.com', 'password123', false);
      expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
        res,
        'refresh-token-uuid',
        false,
      );
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.login.mockResolvedValue(null);
      const res = buildResponse();

      await expect(
        controller.login(
          { email: 'admin@test.com', password: 'wrong-password', rememberMe: false } as never,
          res,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with INVALID_CREDENTIALS code on bad credentials', async () => {
      mockAuthService.login.mockResolvedValue(null);
      const res = buildResponse();

      await expect(
        controller.login(
          { email: 'admin@test.com', password: 'wrong-password', rememberMe: false } as never,
          res,
        ),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_CREDENTIALS',
          message: 'auth.errors.invalid_credentials',
        },
      });
    });

    it('should throw UnauthorizedException when employee does not exist', async () => {
      mockAuthService.login.mockResolvedValue(null);
      const res = buildResponse();

      await expect(
        controller.login(
          { email: 'unknown@test.com', password: 'any-password', rememberMe: false } as never,
          res,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-uuid',
      expiresIn: 900,
    };

    it('should return { accessToken, expiresIn: 900 } after rotating the refresh cookie', async () => {
      mockCookieService.readRefreshTokenCookie.mockReturnValue('valid-uuid');
      mockAuthService.rotateRefreshToken.mockResolvedValue(mockTokens);
      const res = buildResponse();
      const req = buildRequest({ refreshToken: 'valid-uuid' });

      const result = await controller.refresh(req, res);

      expect(result).toEqual({ accessToken: 'new-access-token', expiresIn: 900 });
      expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
      expect(mockAuthService.rotateRefreshToken).toHaveBeenCalledWith('valid-uuid');
      expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
        res,
        'new-refresh-uuid',
        false,
      );
    });

    it('should throw UnauthorizedException when no cookie is present', async () => {
      mockCookieService.readRefreshTokenCookie.mockReturnValue(undefined);
      const res = buildResponse();
      const req = buildRequest({});

      await expect(controller.refresh(req, res)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException with INVALID_CREDENTIALS code when cookie is invalid', async () => {
      mockCookieService.readRefreshTokenCookie.mockReturnValue('invalid-uuid');
      mockAuthService.rotateRefreshToken.mockResolvedValue(null);
      const res = buildResponse();
      const req = buildRequest({ refreshToken: 'invalid-uuid' });

      await expect(controller.refresh(req, res)).rejects.toMatchObject({
        response: {
          code: 'INVALID_CREDENTIALS',
          message: 'auth.errors.invalid_credentials',
        },
      });
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token and clear the cookie (204)', async () => {
      mockCookieService.readRefreshTokenCookie.mockReturnValue('uuid-to-revoke');
      const res = buildResponse();
      const req = buildRequest({ refreshToken: 'uuid-to-revoke' });

      const result = await controller.logout(req, res);

      expect(result).toBeUndefined();
      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith('uuid-to-revoke');
      expect(mockCookieService.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    });

    it('should be idempotent and not throw when no cookie is present', async () => {
      mockCookieService.readRefreshTokenCookie.mockReturnValue(undefined);
      const res = buildResponse();
      const req = buildRequest({});

      const result = await controller.logout(req, res);

      expect(result).toBeUndefined();
      expect(mockAuthService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(mockCookieService.clearRefreshTokenCookie).toHaveBeenCalledWith(res);
    });
  });

  describe('linkGoogle', () => {
    it('should resolve the authenticated user and call authService.linkGoogle with the token', async () => {
      const mockUser = {
        id: 'user-123',
        employeeId: 'EMP-ABCDEF1234567890',
        email: 'admin@test.com',
      };

      mockAuthService.getAuthenticatedUser.mockResolvedValue(mockUser);
      mockAuthService.linkGoogle.mockResolvedValue(undefined);

      await controller.linkGoogle(
        { idToken: 'google-id-token' },
        { user: { employeeId: 'user-123' } },
      );

      expect(mockAuthService.getAuthenticatedUser).toHaveBeenCalledWith('user-123');
      expect(mockAuthService.linkGoogle).toHaveBeenCalledWith('google-id-token', mockUser);
    });

    it('should throw UnauthorizedException when the authenticated user cannot be loaded', async () => {
      mockAuthService.getAuthenticatedUser.mockResolvedValue(null);

      await expect(
        controller.linkGoogle(
          { idToken: 'google-id-token' },
          { user: { employeeId: 'user-123' } } as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('updateMe', () => {
    it('should update the authenticated profile and return the updated user', async () => {
      const updatedUser = {
        id: 'user-123',
        employeeId: 'EMP-ABCDEF1234567890',
        username: 'admin',
        email: 'new-admin@test.com',
        firstName: 'Nuevo',
        lastName: 'Nombre',
        role: 'ADMIN',
        status: 'ACTIVE',
        isActive: true,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        googleEmail: undefined,
        googleId: undefined,
      };

      mockAuthService.updateAuthenticatedUserProfile.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(
        { user: { employeeId: 'user-123' } },
        { firstName: 'Nuevo', lastName: 'Nombre', email: 'new-admin@test.com' } as never,
      );

      expect(mockAuthService.updateAuthenticatedUserProfile).toHaveBeenCalledWith('user-123', {
        firstName: 'Nuevo',
        lastName: 'Nombre',
        email: 'new-admin@test.com',
      });
      expect(result.id).toBe('user-123');
      expect(result.email).toBe('new-admin@test.com');
      expect(result.fullName).toBe('Nuevo Nombre');
    });
  });

  describe('changeMyPassword', () => {
    it('should execute the command and revoke refresh tokens for the user', async () => {
      mockCommandBus.execute.mockResolvedValue({ id: 'user-123', employeeId: 'EMP-ABCDEF1234567890' });

      const result = await controller.changeMyPassword(
        { user: { employeeId: 'user-123' } } as any,
        {
          currentPassword: 'CurrentPass123',
          newPassword: 'NewPass123',
          confirmPassword: 'NewPass123',
        } as never,
        'test-agent',
      );

      expect(mockCommandBus.execute).toHaveBeenCalled();
      expect(mockAuthService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('EMP-ABCDEF1234567890');
      expect(result).toEqual({ success: true });
    });
  });

  describe('loginGoogle', () => {
    it('should return { accessToken, expiresIn: 900 } and set the refresh cookie', async () => {
      const mockTokens = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-uuid',
        expiresIn: 900,
      };

      mockAuthService.loginGoogle.mockResolvedValue(mockTokens);
      const res = buildResponse();

      const result = await controller.loginGoogle(
        { idToken: 'google-id-token' } as never,
        res,
      );

      expect(result).toEqual({ accessToken: 'google-access-token', expiresIn: 900 });
      expect((result as { refreshToken?: unknown }).refreshToken).toBeUndefined();
      expect(mockAuthService.loginGoogle).toHaveBeenCalledWith('google-id-token');
      expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(
        res,
        'google-refresh-uuid',
        false,
      );
    });

    it('should throw UnauthorizedException when authService.loginGoogle returns null', async () => {
      mockAuthService.loginGoogle.mockResolvedValue(null);
      const res = buildResponse();

      await expect(
        controller.loginGoogle({ idToken: 'google-id-token' } as never, res),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
