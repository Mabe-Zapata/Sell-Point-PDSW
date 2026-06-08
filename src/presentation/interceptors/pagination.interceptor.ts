import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../../domain/repositories/pagination.types';

export interface FlatPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
  FlatPaginatedResponse<T> | T
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<FlatPaginatedResponse<T> | T> {
    return next.handle().pipe(
      map((result: any) => {
        if (!isPaginatedResult(result)) {
          return result;
        }

        return {
          data: result.data,
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: Math.ceil(result.total / result.limit),
        };
      }),
    );
  }
}
