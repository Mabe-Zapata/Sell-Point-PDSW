import { PaginationParams } from '../../../../../domain/repositories/pagination.types';export class GetMovementsHistoryValidator {
  static validate(pagination: PaginationParams): PaginationParams {
    const page = pagination.page > 0 ? pagination.page : 1;
    const limit = pagination.limit > 0 ? pagination.limit : 50;
    return { page, limit };
  }
}