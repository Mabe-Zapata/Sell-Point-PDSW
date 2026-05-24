import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/entities/user.entity';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';
import { UserFilters } from '../../domain/repositories/user.repository.interface';
import { UserRepository } from '../repositories/user.repository';
import { RedisService, RefreshTokenPayload } from '../redis/redis.service';

export interface TokenPayload {
  employeeId: string;
  employeeCode: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: 900;
}

export interface SessionPayload {
  id: string;
  employeeId: string;
  role: string;
  email?: string;
}

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 10;
  private static readonly ACCESS_TOKEN_TTL = 900;
  private static readonly REFRESH_TOKEN_TTL_DEFAULT = 604800;
  private static readonly REFRESH_TOKEN_TTL_REMEMBER = 2592000;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Hash a plain-text password using bcrypt (salt is embedded in the hash).
   * Use this when creating or updating a user's password.
   */
  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.SALT_ROUNDS);
  }

  /**
   * Verify a plain-text password against a bcrypt hash stored in PAS_HASH.
   */
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  /**
   * Authenticate a user by EMP_ID + password.
   * Returns a session payload on success, null on failure.
   */
  async login(
    employeeId: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthTokens | null> {
    const user = await this.userRepository.findByEmployeeId(employeeId);
    if (!user) return null;

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) return null;

    const payload: TokenPayload = {
      employeeId: user.id,
      employeeCode: user.employeeId,
      role: user.role ?? '',
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload, rememberMe);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }

  generateAccessToken(payload: TokenPayload): string {
    return this.jwtService.sign(payload, {
      expiresIn: AuthService.ACCESS_TOKEN_TTL,
    });
  }

  async generateRefreshToken(payload: TokenPayload, rememberMe: boolean): Promise<string> {
    const uuid = uuidv4();
    const ttl = rememberMe
      ? AuthService.REFRESH_TOKEN_TTL_REMEMBER
      : AuthService.REFRESH_TOKEN_TTL_DEFAULT;

    const redisPayload: RefreshTokenPayload = {
      employeeId: payload.employeeId,
      employeeCode: payload.employeeCode,
      role: payload.role,
      createdAt: new Date().toISOString(),
    };

    await this.redisService.setRefreshToken(uuid, redisPayload, ttl);
    return uuid;
  }

  async validateRefreshToken(uuid: string): Promise<TokenPayload | null> {
    const payload = await this.redisService.getRefreshToken(uuid);
    if (!payload) return null;
    return {
      employeeId: payload.employeeId,
      employeeCode: payload.employeeCode,
      role: payload.role,
    };
  }

  async revokeRefreshToken(uuid: string): Promise<void> {
    await this.redisService.deleteRefreshToken(uuid);
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      return this.jwtService.verify<TokenPayload>(token);
    } catch {
      return null;
    }
  }

  async getAuthenticatedUser(employeeId: string): Promise<User | null> {
    return this.userRepository.findById(employeeId);
  }

  async listUsers(
    pagination: PaginationParams,
    filters: UserFilters,
  ): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(pagination, filters);
  }
}
