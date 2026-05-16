import {
  ProductFilters,
  PaginatedResult,
} from '../../../../../domain/repositories/product.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/customer.repository.interface';

export class ListProductsQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: ProductFilters = {},
  ) {}
}
