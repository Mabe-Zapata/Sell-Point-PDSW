import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListWarehousesQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly branchId?: string,
    public readonly isActive?: boolean,
    public readonly isMain?: boolean,
  ) {}
}