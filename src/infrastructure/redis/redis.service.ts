import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { configuration } from '../../config/configuration';

export interface RefreshTokenPayload {
  employeeId: string;
  employeeCode: string;
  role: string;
  createdAt: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  private refreshTokenKey(uuid: string): string {
    return `refresh_token:${uuid}`;
  }

  private refreshTokenByEmployeeCodeKey(employeeCode: string): string {
    return `refresh_token_user:${employeeCode}`;
  }

  constructor() {
    const redis = configuration().redis;

    if (redis.url) {
      this.redis = new Redis(redis.url);
    } else {
      this.redis = new Redis({
        host: redis.host,
        port: redis.port,
        password: redis.password,
      });
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  async setRefreshToken(
    uuid: string,
    payload: RefreshTokenPayload,
    ttlSeconds: number,
  ): Promise<void> {
    const tokenKey = this.refreshTokenKey(uuid);
    const userKey = this.refreshTokenByEmployeeCodeKey(payload.employeeCode);

    const existingUuid = await this.redis.get(userKey);
    if (existingUuid && existingUuid !== uuid) {
      await this.redis.del(this.refreshTokenKey(existingUuid));
    }

    await this.redis.set(tokenKey, JSON.stringify(payload), 'EX', ttlSeconds);
    await this.redis.set(userKey, uuid, 'EX', ttlSeconds);
  }

  async getRefreshToken(uuid: string): Promise<RefreshTokenPayload | null> {
    const data = await this.redis.get(this.refreshTokenKey(uuid));
    if (!data) return null;
    return JSON.parse(data) as RefreshTokenPayload;
  }

  async deleteRefreshToken(uuid: string): Promise<void> {
    const key = this.refreshTokenKey(uuid);
    const data = await this.redis.get(key);
    if (data) {
      const payload = JSON.parse(data) as RefreshTokenPayload;
      await this.redis.del(this.refreshTokenByEmployeeCodeKey(payload.employeeCode));
    }

    await this.redis.del(key);
  }

  async revokeAllUserRefreshTokens(employeeCode: string): Promise<void> {
    const userKey = this.refreshTokenByEmployeeCodeKey(employeeCode);
    const uuid = await this.redis.get(userKey);
    if (uuid) {
      await this.redis.del(this.refreshTokenKey(uuid));
      await this.redis.del(userKey);
    }
  }
}
