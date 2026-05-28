import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

const MAX_LIMIT = 200;

export class ListProductsWithStockValidator {
  static validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const rawLimit = pagination.limit > 0 ? pagination.limit : 20;
    const limit = rawLimit > MAX_LIMIT ? MAX_LIMIT : rawLimit;
    return { page, limit };
  }
}