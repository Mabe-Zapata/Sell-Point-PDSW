import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../../domain/repositories/pagination.types';

export interface PaginationMetadata {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

function isPaginatedResult(result: any): result is PaginatedResult<any> {
  return (
    result !== null &&
    typeof result === 'object' &&
    Array.isArray(result.data) &&
    typeof result.total === 'number' &&
    typeof result.limit === 'number'
  );
}

@Injectable()
export class PaginationInterceptor<T> implements NestInterceptor<
  PaginatedResult<T>,
  PaginatedResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResponse<T> | T> {
    return next.handle().pipe(
      map((result: any) => {
        if (!isPaginatedResult(result)) {
          // No es un resultado paginado — devolver tal cual
          return result;
        }

        const totalPages = Math.ceil(result.total / result.limit);

        return {
          data: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages,
          },
        };
      }),
    );
  }
}
