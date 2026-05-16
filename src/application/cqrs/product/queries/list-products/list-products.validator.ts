import { Injectable } from '@nestjs/common';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

@Injectable()
export class ListProductsValidator {
  validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 20;
    return { page, limit };
  }
}
