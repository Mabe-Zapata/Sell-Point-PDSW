import {
  ProductFilters,
} from '../../../../../domain/repositories/product.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListProductsQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: ProductFilters = {},
  ) {}
}
