import { PaginationParams } from '../../../../../domain/repositories/pagination.types';

export class ListTransfersQuery {
  constructor(
    public readonly pagination: PaginationParams = { page: 1, limit: 20 },
    public readonly q?: string,
    public readonly fromBranchId?: string,
    public readonly toBranchId?: string,
    public readonly status?: string,
    public readonly requesterUserId?: string,
  ) {}
}