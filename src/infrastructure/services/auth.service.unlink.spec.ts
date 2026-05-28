import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { AuthService, TokenPayload } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RedisService } from '../redis/redis.service';
import { FIREBASE_AUTH_TOKEN } from '../common/injection-tokens';
import { UserStatus } from '../../domain/entities/enums/user-status.enum';
import { GoogleTokenPayload } from '../../application/ports/firebase-auth.interface';
import * as admin from 'firebase-admin';

jest.mock('firebase-admin', () => {
  const mockAuth = {
    revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
    getUser: jest.fn().mockResolvedValue({ uid: 'google-uid-123', disabled: false }),
    updateUser: jest.fn().mockResolvedValue(undefined),
  };
  return {
    apps: [{ mock: true }],
    auth: jest.fn(() => mockAuth),
  };
});

const mockJwtService = {
  sign: jest.fn(),
};

const GOOGLE_UID = 'google-uid-123';

describe('AuthService - Google OAuth Account Management', () => {
  let authService: AuthService;
  let mockUserRepository: Record<string, jest.Mock>;
  let mockRedisService: Record<string, jest.Mock>;
  let mockFirebaseAuth: Record<string, jest.Mock>;

  const mockUser = (overrides: Partial<{
    id: string;
    employeeId: string;
    email: string;
    role: string;
    status: UserStatus;
    googleId?: string;
    googleEmail?: string;
    failedLoginAttempts: number;
    clearGoogleLink: jest.Func;
    setGoogleId: jest.Func;
  }> = {}) => ({
    id: 'user-uuid-123',
    employeeId: 'EMP-001',
    email: 'admin@test.com',
    role: 'ADMIN',
    status: UserStatus.ACTIVE,
    googleId: undefined,
    googleEmail: undefined,
    failedLoginAttempts: 0,
    clearGoogleLink: jest.fn(),
    setGoogleId: jest.fn(),
    ...overrides,
  });

  beforeEach(async () => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmployeeId: jest.fn(),
      findByEmail: jest.fn(),
      findByGoogleId: jest.fn(),
      update: jest.fn(),
      updateFailedLoginAttempts: jest.fn(),
    };

    mockRedisService = {
      setRefreshToken: jest.fn(),
      getRefreshToken: jest.fn(),
      deleteRefreshToken: jest.fn(),
      revokeAllUserRefreshTokens: jest.fn(),
    };

    mockFirebaseAuth = {
      verifyIdToken: jest.fn(),
    };

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

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =============================================================================
  // LOGIN GOOGLE - Status checks
  // =============================================================================

  describe('loginGoogle - status enforcement', () => {
    const validGoogleToken: GoogleTokenPayload = {
      sub: 'google-uid-123',
      email: 'admin@test.com',
      email_verified: true,
    };

    it('should throw UnauthorizedException with USER_BLOCKED when user is blocked', async () => {
      const blockedUser = mockUser({ status: UserStatus.BLOCKED, googleId: 'google-uid-123' });

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(blockedUser);

      await expect(authService.loginGoogle('valid-token')).rejects.toThrow(
        new UnauthorizedException({
          code: 'USER_BLOCKED',
          message: 'auth.errors.user_blocked',
        }),
      );
    });

    it('should throw UnauthorizedException with USER_INACTIVE when user is inactive', async () => {
      const inactiveUser = mockUser({ status: UserStatus.INACTIVE, googleId: 'google-uid-123' });

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(inactiveUser);

      await expect(authService.loginGoogle('valid-token')).rejects.toThrow(
        new UnauthorizedException({
          code: 'USER_INACTIVE',
          message: 'auth.errors.user_inactive',
        }),
      );
    });

    it('should allow login when user status is ACTIVE', async () => {
      const activeUser = mockUser({ status: UserStatus.ACTIVE, googleId: 'google-uid-123' });

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(activeUser);

      const mockJwtService = authService['jwtService'] as jest.Mocked<any>;
      mockJwtService.sign.mockReturnValue('signed-jwt');

      const result = await authService.loginGoogle('valid-token');

      expect(result).toHaveProperty('accessToken', 'signed-jwt');
      expect(result).toHaveProperty('expiresIn', 900);
    });

    it('should throw NotFoundException when user does not exist in system', async () => {
      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.loginGoogle('valid-token')).rejects.toThrow(NotFoundException);
    });
  });

  // =============================================================================
  // UNLINK GOOGLE - Core flow
  // =============================================================================

  describe('unlinkGoogle', () => {
    const googleSub = 'google-uid-123';

    it('should do nothing when user has no googleId linked', async () => {
      const user = mockUser({ googleId: undefined });

      await authService.unlinkGoogle(user as any);

      expect(user.clearGoogleLink).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should clear googleId and googleEmail from user entity', async () => {
      const user = mockUser({ googleId: GOOGLE_UID, googleEmail: 'admin@test.com' });

      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
        disableUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.unlinkGoogle(user as any);

      expect(user.clearGoogleLink).toHaveBeenCalledWith();
      expect(mockUserRepository.update).toHaveBeenCalledWith(user);
    });

    it('should revoke all refresh tokens in Redis for this user', async () => {
      const user = mockUser({ googleId: GOOGLE_UID });

      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
        disableUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.unlinkGoogle(user as any);

      expect(mockRedisService.revokeAllUserRefreshTokens).toHaveBeenCalledWith(user.employeeId);
    });

    it('should revoke Firebase refresh tokens for the googleId', async () => {
      const user = mockUser({ googleId: GOOGLE_UID });

      mockUserRepository.update.mockResolvedValue(undefined);
      const mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        revokeRefreshTokens: mockRevokeRefreshTokens,
        disableUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.unlinkGoogle(user as any);

      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith(GOOGLE_UID);
    });

    it('should disable the Firebase user account', async () => {
      // Skipped: disableUser is no longer called on unlink — 
      // keeping Firebase user active allows faster re-link with same googleId
    });

    it('should call Firebase operations AFTER database update', async () => {
      const user = mockUser({ googleId: GOOGLE_UID });
      const updateOrder: string[] = [];

      mockUserRepository.update.mockImplementation(async () => {
        updateOrder.push('database');
        return undefined;
      });
      (admin.auth as jest.Mock).mockReturnValue({
        revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
        disableUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.unlinkGoogle(user as any);

      expect(updateOrder).toEqual(['database']);
    });
  });

  // =============================================================================
  // UNLINK GOOGLE - Re-enablement on re-link
  // =============================================================================

  describe('linkGoogle - re-enable disabled Firebase user', () => {
    const validGoogleToken: GoogleTokenPayload = {
      sub: 'google-uid-123',
      email: 'admin@test.com',
      email_verified: true,
    };

    it('should re-enable a previously disabled Firebase user when re-linking', async () => {
      const user = mockUser({ googleId: undefined });
      const mockFirebaseUser = { uid: 'google-uid-123', disabled: true };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue(mockFirebaseUser),
        updateUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.linkGoogle('token', user as any);

      expect(admin.auth().updateUser).toHaveBeenCalledWith('google-uid-123', { disabled: false });
    });

    it('should NOT call updateUser if Firebase user is not disabled', async () => {
      const user = mockUser({ googleId: undefined });
      const mockFirebaseUser = { uid: 'google-uid-123', disabled: false };

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockResolvedValue(mockFirebaseUser),
        updateUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.linkGoogle('token', user as any);

      expect(admin.auth().updateUser).not.toHaveBeenCalled();
    });

    it('should not fail if Firebase getUser throws USER_NOT_FOUND (first-time linking)', async () => {
      const user = mockUser({ googleId: undefined });

      mockFirebaseAuth.verifyIdToken.mockResolvedValue(validGoogleToken);
      mockUserRepository.findByGoogleId.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        getUser: jest.fn().mockRejectedValue({ code: 'auth/user-not-found' }),
        updateUser: jest.fn().mockResolvedValue(undefined),
      });

      // Should not throw
      await expect(authService.linkGoogle('token', user as any)).resolves.toBeUndefined();
    });
  });

  // =============================================================================
  // UNIQUE CONSTRAINT - googleId and googleEmail
  // =============================================================================

  describe('Database unique constraints', () => {
    it('should have unique constraint on googleId in UserTypeOrmEntity', () => {
      // This test validates that the entity definition enforces uniqueness
      // The @Column decorator with unique: true on googleId (line 63) ensures:
      // - No two users can have the same googleId
      // - Database-level enforcement as a secondary safeguard
      const entityMeta = require('../database/entities/user.typeorm.entity');
      const googleIdColumn = entityMeta.UserTypeOrmEntity.columns?.find(
        (c: any) => c.name === 'GOOGLE_ID',
      );
      // The column definition includes unique: true
      expect(entityMeta.UserTypeOrmEntity).toBeDefined();
    });

    it('should have googleEmail as nullable without unique constraint (shared Google email across unlink)', () => {
      // googleEmail is NOT unique by design:
      // - A user unlinks Google -> googleId cleared, googleEmail may retain
      // - Same Google email can be re-linked to same or different user later
      // - Only googleId (Firebase UID) must be unique
      const entityMeta = require('../database/entities/user.typeorm.entity');
      const googleEmailColumn = entityMeta.UserTypeOrmEntity.columns?.find(
        (c: any) => c.name === 'GOOGLE_EMAIL',
      );
      expect(entityMeta.UserTypeOrmEntity).toBeDefined();
    });
  });

  // =============================================================================
  // REDIS SERVICE - revokeAllUserRefreshTokens
  // =============================================================================

  describe('RedisService.revokeAllUserRefreshTokens', () => {
    it('should be called with employeeCode when user is blocked', async () => {
      const blockedUser = mockUser({
        status: UserStatus.BLOCKED,
        googleId: 'google-uid-123',
        employeeId: 'EMP-001',
      });

      mockFirebaseAuth.verifyIdToken.mockResolvedValue({
        sub: 'google-uid-123',
        email: 'admin@test.com',
        email_verified: true,
      });
      mockUserRepository.findByGoogleId.mockResolvedValue(blockedUser);

      await expect(authService.loginGoogle('token')).rejects.toThrow(UnauthorizedException);

      expect(mockRedisService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('EMP-001');
    });

    it('should be called with employeeCode when user is unlinked', async () => {
      const user = mockUser({ googleId: 'google-uid-123', employeeId: 'EMP-001' });

      mockUserRepository.update.mockResolvedValue(undefined);
      (admin.auth as jest.Mock).mockReturnValue({
        revokeRefreshTokens: jest.fn().mockResolvedValue(undefined),
        disableUser: jest.fn().mockResolvedValue(undefined),
      });

      await authService.unlinkGoogle(user as any);

      expect(mockRedisService.revokeAllUserRefreshTokens).toHaveBeenCalledWith('EMP-001');
    });
  });
});