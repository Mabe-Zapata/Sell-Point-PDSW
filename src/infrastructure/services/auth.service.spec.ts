import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService, TokenPayload } from './auth.service';
import { UserRepository } from '../repositories/user.repository';
import { RedisService } from '../redis/redis.service';

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
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockRedisService = {
    setRefreshToken: jest.fn(),
    getRefreshToken: jest.fn(),
    deleteRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisService, useValue: mockRedisService },
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
      mockUserRepository.findByEmployeeId.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('EMP-001', 'password123', false);

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
      mockUserRepository.findByEmployeeId.mockResolvedValue(null);

      const result = await authService.login('INVALID-EMP', 'password123', false);

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      mockUserRepository.findByEmployeeId.mockResolvedValue(mockUser);

      const result = await authService.login('EMP-001', 'wrong-password', false);

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
      mockUserRepository.findByEmployeeId.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('EMP-001', 'password123', false);

      if (!result) {
        throw new Error('Expected login result to be defined');
      }
      expect(result.expiresIn).toBe(900);
    });

    it('should set expiresIn to 900 regardless of rememberMe flag (true)', async () => {
      mockUserRepository.findByEmployeeId.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('signed-jwt-token');
      mockRedisService.setRefreshToken.mockResolvedValue(undefined);

      const result = await authService.login('EMP-001', 'password123', true);

      if (!result) {
        throw new Error('Expected login result to be defined');
      }
      expect(result.expiresIn).toBe(900);
    });
  });
});
