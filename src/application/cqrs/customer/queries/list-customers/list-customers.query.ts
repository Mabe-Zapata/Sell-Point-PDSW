import {
  CustomerFilters,
} from '../../../../../domain/repositories/customer.repository.interface';
import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListCustomersQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: CustomerFilters = {},
  ) {}
}
