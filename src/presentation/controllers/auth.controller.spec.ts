import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../infrastructure/services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    validateRefreshToken: jest.fn(),
    revokeRefreshToken: jest.fn(),
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
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
        employeeCode: 'EMP-001',
        password: 'password123',
        rememberMe: false,
      });

      expect(result).toEqual(mockTokens);
      expect(mockAuthService.login).toHaveBeenCalledWith('EMP-001', 'password123', false);
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.login.mockResolvedValue(null);

      await expect(
        controller.login({
          employeeCode: 'EMP-001',
          password: 'wrong-password',
          rememberMe: false,
        }),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        controller.login({
          employeeCode: 'EMP-001',
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
          employeeCode: 'UNKNOWN-EMP',
          password: 'any-password',
          rememberMe: false,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const mockPayload = {
      employeeId: 'user-uuid-123',
      employeeCode: 'EMP-001',
      role: 'ADMIN' as const,
    };

    it('should return new access token and refresh token on valid refresh', async () => {
      mockAuthService.validateRefreshToken.mockResolvedValue(mockPayload);
      mockAuthService.revokeRefreshToken.mockResolvedValue(undefined);
      mockAuthService.generateAccessToken.mockReturnValue('new-access-token');
      mockAuthService.generateRefreshToken.mockResolvedValue('new-refresh-token-uuid');

      const result = await controller.refresh({ refreshToken: 'valid-uuid' });

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token-uuid',
        expiresIn: 900,
      });
      expect(mockAuthService.validateRefreshToken).toHaveBeenCalledWith('valid-uuid');
      expect(mockAuthService.revokeRefreshToken).toHaveBeenCalledWith('valid-uuid');
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
});