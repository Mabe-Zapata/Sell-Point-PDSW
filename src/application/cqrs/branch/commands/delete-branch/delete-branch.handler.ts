import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteBranchCommand } from './delete-branch.command';
import { DeleteBranchValidator } from './delete-branch.validator';
import { BRANCH_REPOSITORY } from '../../../../tokens';
import type { IBranchRepository } from '../../../../../domain/repositories';

@CommandHandler(DeleteBranchCommand)
export class DeleteBranchHandler implements ICommandHandler<DeleteBranchCommand> {
  constructor(
    private readonly validator: DeleteBranchValidator,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(command: DeleteBranchCommand): Promise<void> {
    this.validator.validate(command.id);

    const existing = await this.branchRepository.findById(command.id);
    if (!existing) {
      throw new Error(`Branch with ID '${command.id}' not found`);
    }

    // Soft delete by deactivating
    const deactivated = { ...existing, isActive: false };
    await this.branchRepository.update(existing);
  }
}