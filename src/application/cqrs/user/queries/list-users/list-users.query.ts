import { PaginationParams } from '../../../../../domain/repositories/pagination.types';
import { UserFilters } from '../../../../../domain/repositories/user.repository.interface';

export class ListUsersQuery {
  constructor(
    public readonly pagination: PaginationParams,
    public readonly filters: UserFilters,
  ) {}
}