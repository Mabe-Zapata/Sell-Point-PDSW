import { Injectable } from '@nestjs/common';
import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

@Injectable()
export class GetMovementsHistoryValidator {
  validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 50;
    return { page, limit };
  }
}