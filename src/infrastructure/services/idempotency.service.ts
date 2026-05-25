import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { IdempotencyEntryTypeOrmEntity } from '../database/entities/idempotency-entry.typeorm.entity';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly TTL_MS = 3600000; // 1 hora

  constructor(
    @InjectRepository(IdempotencyEntryTypeOrmEntity)
    private readonly repo: Repository<IdempotencyEntryTypeOrmEntity>,
  ) {}

  async checkAndMark(key: string): Promise<{ isDuplicate: boolean; previousResponse?: unknown }> {
    const existing = await this.repo.findOne({ where: { key } });

    if (existing) {
      const isExpired = Date.now() - existing.createdAt.getTime() > this.TTL_MS;

      if (isExpired) {
        await this.repo.remove(existing);
        this.logger.log(`Idempotency key expired: ${key}`);

        await this.repo.save(this.repo.create({ key }));
        return { isDuplicate: false };
      }

      this.logger.log(`Duplicate request detected: ${key}`);
      const previousResponse = existing.response ? JSON.parse(existing.response) : undefined;
      return { isDuplicate: true, previousResponse };
    }

    await this.repo.save(this.repo.create({ key }));
    return { isDuplicate: false };
  }

  async saveResponse(key: string, response: unknown): Promise<void> {
    const existing = await this.repo.findOne({ where: { key } });

    if (existing) {
      existing.response = JSON.stringify(response);
      await this.repo.save(existing);
      this.logger.log(`Idempotency response saved: ${key}`);
    }
  }

  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - this.TTL_MS);
    const result = await this.repo.delete({ createdAt: LessThan(cutoff) });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned ${result.affected} expired idempotency entries`);
    }
  }
}
