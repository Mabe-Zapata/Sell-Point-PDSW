import {
  PaginationParams,
  CustomerFilters,
} from '../../../../../domain/repositories/customer.repository.interface';

export class ListCustomersQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly filters: CustomerFilters = {},
  ) {}
}
