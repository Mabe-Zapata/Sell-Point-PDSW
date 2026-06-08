import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, TokenPayload } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RedisService } from '../redis/redis.service';
import { IFirebaseAuth } from '../../application/ports/firebase-auth.interface';
import { FIREBASE_AUTH_TOKEN } from '../common/injection-tokens';

describe('AuthService.rotateRefreshToken', () => {
  let authService: AuthService;
  const mockUserRepository = { findByEmail: jest.fn() };
  const mockJwtService = { sign: jest.fn() };
  const mockRedisService = {
    getRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
    setRefreshToken: jest.fn(),
  };
  const mockFirebaseAuth: IFirebaseAuth = { verifyIdToken: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(5) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: FIREBASE_AUTH_TOKEN, useValue: mockFirebaseAuth },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  const validPayload: TokenPayload = {
    employeeId: 'user-uuid-1',
    employeeCode: 'EMP-001',
    role: 'ADMIN',
  };

  it('returns null when the old token is not in Redis (unknown)', async () => {
    mockRedisService.getRefreshToken.mockResolvedValue(null);

    const result = await authService.rotateRefreshToken('unknown-uuid');

    expect(result).toBeNull();
    expect(mockRedisService.deleteRefreshToken).not.toHaveBeenCalled();
    expect(mockRedisService.setRefreshToken).not.toHaveBeenCalled();
  });

  it('returns { accessToken, refreshToken, expiresIn: 900 } with a NEW refresh token on success', async () => {
    mockRedisService.getRefreshToken.mockResolvedValue({
      employeeId: 'user-uuid-1',
      employeeCode: 'EMP-001',
      role: 'ADMIN',
      createdAt: '2026-06-08T00:00:00.000Z',
    });
    mockRedisService.deleteRefreshToken.mockResolvedValue(undefined);
    mockRedisService.setRefreshToken.mockResolvedValue(undefined);
    mockJwtService.sign.mockReturnValue('new-access-jwt');

    const result = await authService.rotateRefreshToken('old-uuid');

    expect(result).not.toBeNull();
    expect(result?.accessToken).toBe('new-access-jwt');
    expect(result?.expiresIn).toBe(900);
    expect(result?.refreshToken).toEqual(expect.any(String));
    expect(result?.refreshToken).not.toBe('old-uuid');
    expect(result?.refreshToken.length).toBe(36);
  });

  it('revokes the old token in Redis before issuing the new one (rotation invariant)', async () => {
    mockRedisService.getRefreshToken.mockResolvedValue({
      employeeId: 'user-uuid-1',
      employeeCode: 'EMP-001',
      role: 'ADMIN',
      createdAt: '2026-06-08T00:00:00.000Z',
    });
    mockJwtService.sign.mockReturnValue('new-access-jwt');

    const callOrder: string[] = [];
    mockRedisService.deleteRefreshToken.mockImplementation(async () => {
      callOrder.push('delete');
    });
    mockRedisService.setRefreshToken.mockImplementation(async () => {
      callOrder.push('set');
    });

    await authService.rotateRefreshToken('old-uuid');

    expect(callOrder).toEqual(['delete', 'set']);
    expect(mockRedisService.deleteRefreshToken).toHaveBeenCalledWith('old-uuid');
    expect(mockRedisService.setRefreshToken).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ employeeId: 'user-uuid-1' }),
      604800,
    );
  });

  it('signs the new access token with the stored payload data', async () => {
    mockRedisService.getRefreshToken.mockResolvedValue({
      employeeId: 'user-uuid-9',
      employeeCode: 'EMP-009',
      role: 'CASHIER',
      createdAt: '2026-06-08T00:00:00.000Z',
    });
    mockJwtService.sign.mockReturnValue('access-jwt');

    await authService.rotateRefreshToken('old-uuid');

    expect(mockJwtService.sign).toHaveBeenCalledWith(
      { employeeId: 'user-uuid-9', employeeCode: 'EMP-009', role: 'CASHIER' },
      { expiresIn: 900 },
    );
  });
});
