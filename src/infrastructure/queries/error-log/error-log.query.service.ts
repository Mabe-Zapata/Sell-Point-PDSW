 
 
 
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ErrorLogListItem,
  IErrorLogQueryService,
} from '../../../domain/query-services/error-log.query-service.interface';
import { ErrorLogTypeOrmEntity } from '../../database/entities/error-log.typeorm.entity';
import { UserTypeOrmEntity } from '../../database/entities/user.typeorm.entity';

@Injectable()
export class ErrorLogQueryService implements IErrorLogQueryService {
  constructor(
    @InjectRepository(ErrorLogTypeOrmEntity)
    private readonly errorLogRepository: Repository<ErrorLogTypeOrmEntity>,
  ) {}

  private buildQuery() {
    return this.errorLogRepository
      .createQueryBuilder('el')
      .leftJoin(UserTypeOrmEntity, 'usr', 'usr.id = el.userId');
  }

  private buildFilterQuery() {
    return this.errorLogRepository.createQueryBuilder('el');
  }

  async listErrorLogs(params: {
    page: number;
    limit: number;
    exceptionType?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{ data: ErrorLogListItem[]; total: number; page: number; limit: number }> {
    const { page, limit, exceptionType, userId, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    const filterQuery = this.buildFilterQuery()
      .where(exceptionType ? 'el.exceptionType = :exceptionType' : '1=1', { exceptionType })
      .andWhere(userId ? 'el.userId = :userId' : '1=1', { userId })
      .andWhere(startDate ? 'el.createdAt >= :startDate' : '1=1', { startDate })
      .andWhere(endDate ? 'el.createdAt <= :endDate' : '1=1', { endDate });

    const total = await filterQuery.clone().getCount();
    const pagedIds = await filterQuery
      .clone()
      .select('el.id', 'id')
      .orderBy('el.createdAt', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany<{ id: string }>();

    const ids = pagedIds.map((row) => String(row.id));

    if (!ids.length) {
      return {
        data: [],
        total,
        page,
        limit,
      };
    }

    const rows = await this.buildQuery()
      .clone()
      .select([
        'el.id AS "id"',
        'el.exceptionType AS "exceptionType"',
        'el.message AS "message"',
        'el.stackTrace AS "stackTrace"',
        'el.source AS "source"',
        'el.userId AS "userId"',
        'el.createdAt AS "createdAt"',
        'usr.username AS "userUsername"',
      ])
      .where('el.id IN (:...ids)', { ids })
      .getRawMany<ErrorLogListItem>();

    const rowsById = new Map(rows.map((row) => [String(row.id), row]));
    const orderedRows = ids
      .map((id) => rowsById.get(id))
      .filter((row): row is ErrorLogListItem => Boolean(row));

    return {
      data: orderedRows.map((row) => ({
        ...row,
        source: row.source ?? '',
      })),
      total,
      page,
      limit,
    };
  }

  async getErrorLogById(id: string): Promise<ErrorLogListItem | null> {
    const row = await this.buildQuery()
      .where('el.id = :id', { id: Number(id) })
      .select([
        'el.id AS "id"',
        'el.exceptionType AS "exceptionType"',
        'el.message AS "message"',
        'el.stackTrace AS "stackTrace"',
        'el.source AS "source"',
        'el.userId AS "userId"',
        'el.createdAt AS "createdAt"',
        'usr.username AS "userUsername"',
      ])
      .getRawOne<ErrorLogListItem>();

    if (!row) {
      return null;
    }

    return {
      ...row,
      source: row.source ?? '',
    };
  }
}
