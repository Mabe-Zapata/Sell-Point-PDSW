import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginatedResult } from '../../domain/repositories/customer.repository.interface';

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

@Injectable()
export class PaginationInterceptor<T> implements NestInterceptor<
  PaginatedResult<T>,
  PaginatedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<PaginatedResponse<T>> {
    return next.handle().pipe(
      map((result: PaginatedResult<T>) => {
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
