import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

export interface RefreshTokenPayload {
  employeeId: string;
  employeeCode: string;
  role: string;
  createdAt: string;
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly redis: Redis;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.redis = new Redis(redisUrl);
    } else {
      const host = process.env.REDIS_HOST || 'localhost';
      const port = parseInt(process.env.REDIS_PORT || '6379', 10);
      this.redis = new Redis({ host, port });
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
    const key = `refresh_token:${uuid}`;
    await this.redis.set(key, JSON.stringify(payload), 'EX', ttlSeconds);
  }

  async getRefreshToken(uuid: string): Promise<RefreshTokenPayload | null> {
    const key = `refresh_token:${uuid}`;
    const data = await this.redis.get(key);
    if (!data) return null;
    return JSON.parse(data) as RefreshTokenPayload;
  }

  async deleteRefreshToken(uuid: string): Promise<void> {
    const key = `refresh_token:${uuid}`;
    await this.redis.del(key);
  }
}
