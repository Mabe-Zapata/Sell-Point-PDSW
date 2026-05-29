import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  IdempotencyEntryStatus,
  IdempotencyEntryTypeOrmEntity,
} from '../database/entities/idempotency-entry.typeorm.entity';

export type IdempotencyBeginResult =
  | { status: 'STARTED' }
  | { status: 'COMPLETED'; response: unknown }
  | { status: 'IN_PROGRESS' }
  | { status: 'PAYLOAD_MISMATCH' };

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly TTL_MS = 3600000; // 1 hour

  constructor(
    @InjectRepository(IdempotencyEntryTypeOrmEntity)
    private readonly repo: Repository<IdempotencyEntryTypeOrmEntity>,
  ) {}

  async begin(key: string, requestHash: string): Promise<IdempotencyBeginResult> {
    try {
      await this.repo.insert(
        this.repo.create({
          key,
          requestHash,
          status: IdempotencyEntryStatus.IN_PROGRESS,
          updatedAt: new Date(),
        }),
      );
      return { status: 'STARTED' };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) {
        throw error;
      }

      const existing = await this.repo.findOne({ where: { key } });
      if (!existing) {
        throw error;
      }

      return this.resolveExisting(existing, requestHash);
    }
  }

  async complete(key: string, response: unknown): Promise<void> {
    const existing = await this.repo.findOne({ where: { key } });
    if (!existing) {
      return;
    }

    existing.response = JSON.stringify(response);
    existing.status = IdempotencyEntryStatus.COMPLETED;
    existing.updatedAt = new Date();
    await this.repo.save(existing);
    this.logger.log(`Idempotency response saved: ${key}`);
  }

  async fail(key: string): Promise<void> {
    const existing = await this.repo.findOne({ where: { key } });
    if (!existing) {
      return;
    }

    existing.response = undefined;
    existing.status = IdempotencyEntryStatus.FAILED;
    existing.updatedAt = new Date();
    await this.repo.save(existing);
    this.logger.warn(`Idempotency key marked as failed: ${key}`);
  }

  async cleanup(): Promise<void> {
    const cutoff = new Date(Date.now() - this.TTL_MS);
    const result = await this.repo.delete({ createdAt: LessThan(cutoff) });

    if (result.affected && result.affected > 0) {
      this.logger.log(`Cleaned ${result.affected} expired idempotency entries`);
    }
  }

  private async resolveExisting(
    existing: IdempotencyEntryTypeOrmEntity,
    requestHash: string,
  ): Promise<IdempotencyBeginResult> {
    if (this.isExpired(existing)) {
      await this.repo.remove(existing);
      this.logger.log(`Idempotency key expired: ${existing.key}`);
      return this.begin(existing.key, requestHash);
    }

    if (existing.requestHash && existing.requestHash !== requestHash) {
      return { status: 'PAYLOAD_MISMATCH' };
    }

    if (existing.status === IdempotencyEntryStatus.COMPLETED) {
      return {
        status: 'COMPLETED',
        response: existing.response ? JSON.parse(existing.response) : undefined,
      };
    }

    if (existing.status === IdempotencyEntryStatus.FAILED) {
      existing.status = IdempotencyEntryStatus.IN_PROGRESS;
      existing.requestHash = requestHash;
      existing.response = undefined;
      existing.updatedAt = new Date();
      await this.repo.save(existing);
      return { status: 'STARTED' };
    }

    return { status: 'IN_PROGRESS' };
  }

  private isExpired(entry: IdempotencyEntryTypeOrmEntity): boolean {
    return Date.now() - entry.createdAt.getTime() > this.TTL_MS;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    const dbError = error as Error & { code?: string; message?: string };
    return Boolean(
      dbError.code === '23505'
      || dbError.message?.includes('ORA-00001')
      || dbError.message?.toLowerCase().includes('duplicate'),
    );
  }
}
