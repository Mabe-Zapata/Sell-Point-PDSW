import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class GetMovementsHistoryQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 50 },
    public readonly warehouseId?: string,
    public readonly productId?: string,
    public readonly type?: string,
    public readonly userId?: string,
    public readonly referenceType?: string,
    public readonly referenceId?: string,
  ) {}
}