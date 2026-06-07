import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../../infrastructure/common/injection-tokens';

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    validateRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    getAuthenticatedUser: jest.fn(),
    linkGoogle: jest.fn(),
    loginGoogle: jest.fn(),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockPasswordResetTokenRepository = {};

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
        { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useValue: mockPasswordResetTokenRepository },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return { accessToken, refreshToken, expiresIn: 900 } on success', async () => {
      const mockTokens = {
        accessToken: 'access-token-abc',
        refreshToken: 'refresh-token-uuid',
        expiresIn: 900,
      };
      mockAuthService.login.mockResolvedValue(mockTokens);

      const result = await controller.login({
        email: 'admin@test.com',
        password: 'password123',
        rememberMe: false,
      });

      expect(result).toEqual(mockTokens);
      expect(mockAuthService.login).toHaveBeenCalledWith('admin@test.com', 'password123', false);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.login.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'admin@test.com',
          password: 'wrong-password',
          rememberMe: false,
        }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        controller.login({
          email: 'admin@test.com',
          password: 'wrong-password',
          rememberMe: false,
        }),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_CREDENTIALS',
          message: 'auth.errors.invalid_credentials',
        },
      });
    });

    it('should throw UnauthorizedException when employee does not exist', async () => {
      mockAuthService.login.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'unknown@test.com',
          password: 'any-password',
          rememberMe: false,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockPayload = {
      employeeId: 'user-uuid-123',
      employeeCode: 'EMP-ABCDEF1234567890',
      role: 'ADMIN' as const,
    };

    it('should return new access token and the same refresh token on valid refresh', async () => {
      mockAuthService.validateRefreshToken.mockResolvedValue(mockPayload);
      mockAuthService.generateAccessToken.mockReturnValue('new-access-token');

      const result = await controller.refresh({ refreshToken: 'valid-uuid' });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'valid-uuid',
        expiresIn: 900,
      });
      expect(mockAuthService.validateRefreshToken).toHaveBeenCalledWith('valid-uuid');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      mockAuthService.validateRefreshToken.mockResolvedValue(null);

      await expect(
        controller.refresh({ refreshToken: 'invalid-uuid' }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        controller.refresh({ refreshToken: 'invalid-uuid' }),
      ).rejects.toMatchObject({
        response: {
          code: 'INVALID_CREDENTIALS',
          message: 'auth.errors.invalid_credentials',
        },
      });
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
        { user: { employeeId: 'user-123' } } as any,
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

  describe('loginGoogle', () => {
    it('should call authService.loginGoogle and return tokens', async () => {
      const mockTokens = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
        expiresIn: 900,
      };

      mockAuthService.loginGoogle.mockResolvedValue(mockTokens);

      const result = await controller.loginGoogle({ idToken: 'google-id-token' });

      expect(mockAuthService.loginGoogle).toHaveBeenCalledWith('google-id-token');
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException when authService.loginGoogle returns null', async () => {
      mockAuthService.loginGoogle.mockResolvedValue(null);

      await expect(
        controller.loginGoogle({ idToken: 'google-id-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
