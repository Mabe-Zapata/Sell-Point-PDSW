import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetBranchQuery } from './get-branch.query';
import { GetBranchValidator } from './get-branch.validator';
import { BRANCH_REPOSITORY } from '../../../../tokens';
import type { IBranchRepository } from '../../../../../domain/repositories';
import { Branch } from '../../../../../domain/entities';

@QueryHandler(GetBranchQuery)
export class GetBranchHandler implements IQueryHandler<GetBranchQuery> {
  constructor(
    private readonly validator: GetBranchValidator,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(query: GetBranchQuery): Promise<Branch | null> {
    this.validator.validate(query.id);
    return this.branchRepository.findById(query.id);
  }
}