import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, ForbiddenException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService, TokenPayload, FIREBASE_AUTH_TOKEN } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RedisService } from '../redis/redis.service';
import { IFirebaseAuth } from '../../application/ports/firebase-auth.interface';

describe('AuthService', () => {
  let authService: AuthService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let jwtService: JwtService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let userRepository: UserRepository;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let redisService: RedisService;

  const mockUserRepository = {
    findByEmployeeId: jest.fn(),
    findByEmail: jest.fn(),
    findByGoogleId: jest.fn(),
    updateFailedLoginAttempts: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockRedisService = {
    setRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
  };

  const mockFirebaseAuth = {
    verifyIdToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: FIREBASE_AUTH_TOKEN, useValue: mockFirebaseAuth },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get<UserRepository>(UserRepository);
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should generate a JWT with correct payload and 900s exp', () => {
      const payload: TokenPayload = {
        employeeId: 'user-uuid-123',
        employeeCode: 'EMP-001',
        role: 'ADMIN',
      };

      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      const result = authService.generateAccessToken(payload);

      expect(mockJwtService.sign).toHaveBeenCalledWith(payload, { expiresIn: 900 });
      expect(result).toBe('signed-jwt-token');
    });

    it('should include correct payload fields in JWT', () => {
      const payload: TokenPayload = {
        employeeId: 'user-uuid-456',
        employeeCode: 'EMP-002',
        role: 'CASHIER',
      };

      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      authService.generateAccessToken(payload);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: 'user-uuid-456',
          employeeCode: 'EMP-002',
          role: 'CASHIER',
        }),
        { expiresIn: 900 },
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate UUID and store in Redis with 7d TTL when rememberMe is false', async () => {
      const payload: TokenPayload = {
        employeeId: 'user-uuid-123',
        employeeCode: 'EMP-001',
        role: 'ADMIN',
      };

      mockRedisService.setRefreshToken.mockResolvedValue(undefined);
      const result = await authService.generateRefreshToken(payload, false);

      expect(result).toBeDefined();
      expect(result.length).toBe(36); // UUID v4 format
      expect(mockRedisService.setRefreshToken).toHaveBeenCalledWith(
        result,
        expect.objectContaining({
          employeeId: 'user-uuid-123',
          employeeCode: 'EMP-001',
          role: 'ADMIN',
        }),
        604800,
      );
    });

    it('should store in Redis with 30d TTL when rememberMe is true', async () => {
      const payload: TokenPayload = {
        employeeId: 'user-uuid-456',
        employeeCode: 'EMP-002',
        role: 'CASHIER',
      };

      mockRedisService.setRefreshToken.mockResolvedValue(undefined);
      const result = await authService.generateRefreshToken(payload, true);

      expect(result).toBeDefined();
      expect(result.length).toBe(36);
      expect(mockRedisService.setRefreshToken).toHaveBeenCalledWith(
        result,
        expect.objectContaining({
          employeeId: 'user-uuid-456',
          employeeCode: 'EMP-002',
          role: 'CASHIER',
        }),
        2592000,
      );
    });
  });

  describe('validateRefreshToken', () => {
    it('should return TokenPayload when Redis returns valid payload', async () => {
      const storedPayload = {
        employeeId: 'user-uuid-123',
        employeeCode: 'EMP-001',
        role: 'ADMIN',
        createdAt: '2024-01-01T00:00:00.000Z',
      };

      mockRedisService.getRefreshToken.mockResolvedValue(storedPayload);
      const result = await authService.validateRefreshToken('some-uuid');

      expect(result).toEqual({
        employeeId: 'user-uuid-123',
        employeeCode: 'EMP-001',
        role: 'ADMIN',
      });
    });

    it('should return null when Redis returns null', async () => {
      mockRedisService.getRefreshToken.mockResolvedValue(null);
      const result = await authService.validateRefreshToken('invalid-uuid');

      expect(result).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('should call deleteRefreshToken with the correct UUID', async () => {
      mockRedisService.deleteRefreshToken.mockResolvedValue(undefined);
      await authService.revokeRefreshToken('test-uuid-123');

      expect(mockRedisService.deleteRefreshToken).toHaveBeenCalledWith('test-uuid-123');
    });
  });

  describe('login', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const mockUser = {
      id: 'user-uuid-123',
      employeeId: 'EMP-001',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      email: 'admin@test.com',
    };

    it('should return AuthTokens with accessToken, refreshToken, and expiresIn: 900', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('admin@test.com', 'password123', false);

      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        refreshToken: expect.any(String),
        expiresIn: 900,
      });
      if (!result) {
        throw new Error('Expected login result to be defined');
      }
      expect(result.refreshToken).toHaveLength(36); // UUID format
    });

    it('should return null when user does not exist', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await authService.login('unknown@test.com', 'password123', false);

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await authService.login('admin@test.com', 'wrong-password', false);

      expect(result).toBeNull();
    });
  });

  describe('rememberMe does not affect access token TTL', () => {
    const hashedPassword = bcrypt.hashSync('password123', 10);
    const mockUser = {
      id: 'user-uuid-123',
      employeeId: 'EMP-001',
      passwordHash: hashedPassword,
      role: 'ADMIN',
      email: 'admin@test.com',
    };

    it('should set expiresIn to 900 regardless of rememberMe flag (false)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('admin@test.com', 'password123', false);

      if (!result) {
        throw new Error('Expected login result to be defined');
      }
      expect(result.expiresIn).toBe(900);
    });

    it('should set expiresIn to 900 regardless of rememberMe flag (true)', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('admin@test.com', 'password123', true);

      if (!result) {
        throw new Error('Expected login result to be defined');
      }
      expect(result.expiresIn).toBe(900);
    });
  });

  describe('linkGoogle', () => {
    const mockUser = {
      id: 'user-uuid-123',
      employeeId: 'EMP-001',
      role: 'ADMIN',
      email: 'admin@test.com',
      googleId: undefined,
      setGoogleId: function(googleId: string) { this.googleId = googleId; },
    };

    it('should throw UnauthorizedException (401) when email_verified is false', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: false,
      });

      await expect(authService.linkGoogle('invalid-token', mockUser as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ForbiddenException (403) when Google email does not match user email', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'wrong@test.com',
        email_verified: true,
      });

      await expect(authService.linkGoogle('token', mockUser as any)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException (409) when Google account is already linked to another user', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue({
        id: 'another-user-uuid',
        email: 'admin@test.com',
      });

      await expect(authService.linkGoogle('token', mockUser as any)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should succeed and update user with googleId when re-linking same account (idempotent)', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      const userWithGoogleId = { ...mockUser, googleId: 'google-uid-123' };
      mockUserRepository.findByGoogleId.mockResolvedValue(userWithGoogleId);

      await authService.linkGoogle('token', userWithGoogleId as any);

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should succeed and update user with googleId on successful link', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue({ ...mockUser, googleId: 'google-uid-123' });

      await authService.linkGoogle('token', mockUser as any);

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({ googleId: 'google-uid-123' }),
      );
    });
  });

  describe('loginGoogle', () => {
    const mockUser = {
      id: 'user-uuid-123',
      employeeId: 'EMP-001',
      role: 'ADMIN',
      email: 'admin@test.com',
      googleId: 'google-uid-123',
    };

    it('should throw UnauthorizedException (401) when token is invalid', async () => {
      mockFirebaseAuth.verifyIdToken.mockRejectedValue(new Error('invalid token'));

      await expect(authService.loginGoogle('invalid-token')).rejects.toThrow();
    });

    it('should throw UnauthorizedException (401) when email_verified is false', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: false,
      });

      await expect(authService.loginGoogle('unverified-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw NotFoundException (404) when no account found for Google user', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginGoogle('token')).rejects.toThrow(NotFoundException);
    });

    it('should return AuthTokens when valid token and account exists', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.loginGoogle('token');

      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        refreshToken: expect.any(String),
        expiresIn: 900,
      });
    });

    it('should fallback to findByEmail when findByGoogleId returns null', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.loginGoogle('token');

      expect(result).toEqual({
        accessToken: 'signed-jwt-token',
        refreshToken: expect.any(String),
        expiresIn: 900,
      });
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('admin@test.com');
    });
  });
});
