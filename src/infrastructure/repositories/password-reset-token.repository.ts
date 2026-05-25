import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull, MoreThan } from 'typeorm';
import { PasswordResetTokenTypeOrmEntity } from '../database/entities/password-reset-token.typeorm.entity';
import { PasswordResetToken } from '../../domain/entities/password-reset-token.entity';
import type { IPasswordResetTokenRepository } from '../../domain/repositories/password-reset-token.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class PasswordResetTokenRepository implements IPasswordResetTokenRepository {
  constructor(
    @InjectRepository(PasswordResetTokenTypeOrmEntity)
    private readonly repo: Repository<PasswordResetTokenTypeOrmEntity>,
    private readonly dataSource?: DataSource,
  ) {}

  private mapToDomain(entity: PasswordResetTokenTypeOrmEntity): PasswordResetToken {
    return new PasswordResetToken({
      id: String(entity.id),
      userId: entity.userId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(token: PasswordResetToken): Partial<PasswordResetTokenTypeOrmEntity> {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt: token.usedAt,
    };
  }

  async create(token: PasswordResetToken): Promise<PasswordResetToken> {
    const entity = this.repo.create(this.mapToEntity(token) as PasswordResetTokenTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }

  async findByHash(hash: string): Promise<PasswordResetToken | null> {
    const entity = await this.repo.findOne({ where: { tokenHash: hash } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(pagination: PaginationParams, filters?: { userId?: string }): Promise<PaginatedResult<PasswordResetToken>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (filters?.userId) {
      whereClause.userId = filters.userId;
    }

    const [entities, total] = await this.repo.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async markAsUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }
}
