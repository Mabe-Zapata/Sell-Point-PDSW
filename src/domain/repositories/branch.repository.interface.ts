import { Branch } from '../entities';
import { PaginationParams, PaginatedResult } from './pagination.types';

export interface BranchFilters {
  q?: string;
  isActive?: boolean;
}

export interface IBranchRepository {
  findById(id: string): Promise<Branch | null>;
  findByName(name: string): Promise<Branch | null>;
  findAll(
    pagination?: PaginationParams,
    filters?: BranchFilters,
  ): Promise<PaginatedResult<Branch>>;
  create(branch: Branch): Promise<Branch>;
  update(branch: Branch): Promise<Branch>;
}
