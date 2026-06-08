import { Inject, Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../../domain/entities';
import type { PaginationParams, PaginatedResult, UserFilters } from '../../domain/repositories';
import { UserStatus } from '../../domain/entities/enums/user-status.enum';
import { UserRepository } from '../repositories/user.repository';
import { RedisService, RefreshTokenPayload } from '../redis/redis.service';
import type { IFirebaseAuth } from '../../application/ports/firebase-auth.interface';
import { FIREBASE_AUTH_TOKEN } from '../common/injection-tokens';

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

  private readonly maxFailedAttempts: number;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
    @Inject(FIREBASE_AUTH_TOKEN) private readonly firebaseAuth: IFirebaseAuth,
  ) {
    this.maxFailedAttempts = this.configService.get<number>('auth.maxFailedAttempts') ?? 5;
  }

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

      if (newAttempts >= this.maxFailedAttempts) {
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

  async rotateRefreshToken(oldToken: string): Promise<AuthTokens | null> {
    const existing = await this.redisService.getRefreshToken(oldToken);
    if (!existing) return null;

    await this.redisService.deleteRefreshToken(oldToken);

    const payload: TokenPayload = {
      employeeId: existing.employeeId,
      employeeCode: existing.employeeCode,
      role: existing.role,
    };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload, false);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
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
    await this.userRepository.updateFailedLoginAttempts(user.id, 0);
  }

  async listUsers(
    pagination: PaginationParams,
    filters: UserFilters,
  ): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(pagination, filters);
  }

  async linkGoogle(idToken: string, user: User): Promise<void> {
    const token = await this.firebaseAuth.verifyIdToken(idToken);

    if (!token.email_verified) {
      throw new UnauthorizedException({
        code: 'GOOGLE_TOKEN_INVALID',
        message: 'Google token email is not verified',
      });
    }

if (user.googleId && user.googleId === token.sub) {
      return;
    }

    if (user.googleEmail && user.googleEmail !== token.email) {
      throw new ConflictException({
        code: 'GOOGLE_EMAIL_MISMATCH',
        message: 'Google account email does not match linked email',
      });
    }

    const existingGoogleUser = await this.userRepository.findByGoogleId(token.sub);
    if (existingGoogleUser && existingGoogleUser.id !== user.id) {
      throw new ConflictException({
        code: 'GOOGLE_DUPLICATE_LINK',
        message: 'Google account already linked to another user',
      });
    }

    if (admin.apps.length > 0) {
      try {
        const firebaseUser = await admin.auth().getUser(token.sub);
        if (firebaseUser.disabled) {
          await admin.auth().updateUser(token.sub, { disabled: false });
        }
      } catch (err) {
        // Firebase user doesn't exist yet — normal for first-time link, ignore error
      }
    }

    user.setGoogleId(token.sub, token.email);
    await this.userRepository.update(user);
  }

async unlinkGoogle(user: User): Promise<void> {
    if (!user.googleId) return;

    const googleId = user.googleId;

    user.clearGoogleLink();
    await this.userRepository.update(user);

    await this.redisService.revokeAllUserRefreshTokens(user.employeeId);

    if (admin.apps.length > 0) {
      await admin.auth().revokeRefreshTokens(googleId);
    }
  }

  async loginGoogle(idToken: string): Promise<AuthTokens | null> {
    const token = await this.firebaseAuth.verifyIdToken(idToken);

    if (!token.email_verified) {
      throw new UnauthorizedException({
        code: 'GOOGLE_TOKEN_INVALID',
        message: 'Google token email is not verified',
      });
    }

    let user = await this.userRepository.findByGoogleId(token.sub);
    let linkedByEmail = false;

    if (!user) {
      user = await this.userRepository.findByEmail(token.email);
      linkedByEmail = true;
    }

    if (!user) {
      throw new NotFoundException({
        code: 'GOOGLE_NO_ACCOUNT',
        message: 'No account found for Google user',
      });
    }

    if (user.status === UserStatus.BLOCKED) {
      await this.redisService.revokeAllUserRefreshTokens(user.employeeId);
      throw new UnauthorizedException({
        code: 'USER_BLOCKED',
        message: 'auth.errors.user_blocked',
      });
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException({
        code: 'USER_INACTIVE',
        message: 'auth.errors.user_inactive',
      });
    }

    // If found by email (not googleId yet), set googleId and googleEmail
    if (linkedByEmail) {
      user.setGoogleId(token.sub, token.email);
      await this.userRepository.update(user);
    }

    const payload: TokenPayload = {
      employeeId: user.id,
      employeeCode: user.employeeId,
      role: user.role ?? '',
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(payload, false);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  }
}
