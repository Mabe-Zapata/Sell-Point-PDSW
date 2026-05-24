import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLogTypeOrmEntity } from '../database/entities/error-log.typeorm.entity';
import { ErrorLog } from '../../domain/entities/error-log.entity';
import { ExceptionTypeMapper } from '../database/entities/enums/exception-type.db-enum';
import { IErrorLogRepository, ErrorLogFilters } from '../../domain/repositories/error-log.repository.interface';
import { PaginationParams, PaginatedResult } from '../../domain/repositories/pagination.types';

@Injectable()
export class ErrorLogRepository implements IErrorLogRepository {
  constructor(
    @InjectRepository(ErrorLogTypeOrmEntity)
    private readonly repo: Repository<ErrorLogTypeOrmEntity>,
  ) {}

  private mapToDomain(entity: ErrorLogTypeOrmEntity): ErrorLog {
    return new ErrorLog({
      id: entity.id,
      exceptionType: ExceptionTypeMapper.toDomain(entity.exceptionType),
      message: entity.message,
      stackTrace: entity.stackTrace,
      source: entity.source,
      userId: entity.userId,
      createdAt: entity.createdAt,
    });
  }

  private mapToEntity(errorLog: ErrorLog): Partial<ErrorLogTypeOrmEntity> {
    return {
      exceptionType: ExceptionTypeMapper.toDb(errorLog.exceptionType),
      message: errorLog.message,
      stackTrace: errorLog.stackTrace,
      source: errorLog.source,
      userId: errorLog.userId,
    };
  }

  async findById(id: number): Promise<ErrorLog | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? this.mapToDomain(entity) : null;
  }

  async findAll(
    pagination: PaginationParams = { page: 1, limit: 20 },
    filters: ErrorLogFilters = {},
  ): Promise<PaginatedResult<ErrorLog>> {
    const { page, limit } = pagination;
    const { q, exceptionType, userId } = filters;

    const queryBuilder = this.repo.createQueryBuilder('errorLog');

    if (q) {
      queryBuilder.where('errorLog.message ILIKE :q', { q: `%${q}%` });
    }
    if (exceptionType) {
      queryBuilder.andWhere('errorLog.exceptionType = :exceptionType', { exceptionType });
    }
    if (userId) {
      queryBuilder.andWhere('errorLog.userId = :userId', { userId });
    }

    const total = await queryBuilder.getCount();
    queryBuilder.skip((page - 1) * limit).take(limit);
    queryBuilder.orderBy('errorLog.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();

    return {
      data: entities.map((e) => this.mapToDomain(e)),
      total,
      page,
      limit,
    };
  }

  async create(errorLog: ErrorLog): Promise<ErrorLog> {
    const entity = this.repo.create(this.mapToEntity(errorLog) as ErrorLogTypeOrmEntity);
    const saved = await this.repo.save(entity);
    return this.mapToDomain(saved);
  }
}