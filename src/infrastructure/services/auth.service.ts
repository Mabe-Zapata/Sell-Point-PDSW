import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/entities/user.entity';
import { UserStatus } from '../../domain/entities/enums/user-status.enum';
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
  private static readonly MAX_FAILED_ATTEMPTS = 3;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.SALT_ROUNDS);
  }

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async login(
    email: string,
    password: string,
    rememberMe = false,
  ): Promise<AuthTokens | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) return null;

    if (user.status === UserStatus.BLOCKED) {
      throw new UnauthorizedException({
        code: 'USER_BLOCKED',
        message: 'auth.errors.user_blocked',
      });
    }

    const valid = await this.verifyPassword(password, user.passwordHash);

    if (!valid) {
      const newAttempts = user.failedLoginAttempts + 1;
      await this.userRepository.updateFailedLoginAttempts(user.id, newAttempts);

      if (newAttempts >= AuthService.MAX_FAILED_ATTEMPTS) {
        user.block();
        await this.userRepository.update(user);
        throw new UnauthorizedException({
          code: 'USER_BLOCKED',
          message: 'auth.errors.user_blocked',
        });
      }

      return null;
    }

    await this.userRepository.updateFailedLoginAttempts(user.id, 0);

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

  verifyAccessToken(token: string): TokenPayload | null {
  try {
    return this.jwtService.verify<TokenPayload>(token);
  } catch {
    return null;
  }
}

  async getAuthenticatedUser(employeeId: string): Promise<User | null> {
    return this.userRepository.findById(employeeId);
  }

  async unlockUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) return;
    user.unlock();
    await this.userRepository.update(user);
  }

  async listUsers(
    pagination: PaginationParams,
    filters: UserFilters,
  ): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(pagination, filters);
  }
}