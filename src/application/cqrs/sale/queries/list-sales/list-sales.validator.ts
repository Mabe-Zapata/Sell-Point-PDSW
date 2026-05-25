import { PaginationParams } from '../../../../../domain/repositories/pagination.types';export class ListSalesValidator {
  static validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 20;
    return { page, limit };
  }
}