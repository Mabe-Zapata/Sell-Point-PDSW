import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListProductsWithStockQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly categoryId?: string,
    public readonly isActive?: boolean,
    public readonly createdFrom?: Date,
    public readonly createdTo?: Date,
  ) {}
}