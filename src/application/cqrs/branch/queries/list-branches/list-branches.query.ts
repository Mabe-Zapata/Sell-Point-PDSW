import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListBranchesQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly isActive?: boolean,
  ) {}
}