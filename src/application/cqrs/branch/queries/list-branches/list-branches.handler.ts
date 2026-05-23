import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListBranchesQuery } from './list-branches.query';
import { ListBranchesValidator } from './list-branches.validator';
import { BRANCH_REPOSITORY } from '../../../../tokens';
import type { IBranchRepository } from '../../../../../domain/repositories';
import { PaginatedResult } from '../../../../../domain/repositories/pagination.types';
import { Branch } from '../../../../../domain/entities';

@QueryHandler(ListBranchesQuery)
export class ListBranchesHandler implements IQueryHandler<ListBranchesQuery> {
  constructor(
    private readonly validator: ListBranchesValidator,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(query: ListBranchesQuery): Promise<PaginatedResult<Branch>> {
    const validPagination = this.validator.validate(query.pagination);
    return this.branchRepository.findAll(validPagination, { q: query.q, isActive: query.isActive });
  }
}