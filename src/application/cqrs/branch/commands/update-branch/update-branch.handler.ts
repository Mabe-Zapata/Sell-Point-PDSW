import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UpdateBranchCommand } from './update-branch.command';
import { UpdateBranchValidator } from './update-branch.validator';
import { BRANCH_REPOSITORY } from '../../../../tokens';
import type { IBranchRepository } from '../../../../../domain/repositories';
import { Branch } from '../../../../../domain/entities';

@CommandHandler(UpdateBranchCommand)
export class UpdateBranchHandler implements ICommandHandler<UpdateBranchCommand> {
  constructor(
    private readonly validator: UpdateBranchValidator,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(command: UpdateBranchCommand): Promise<Branch> {
    this.validator.validate(command.id, command.payload);

    const existing = await this.branchRepository.findById(command.id);
    if (!existing) {
      throw new Error(`Branch with ID '${command.id}' not found`);
    }

    if (command.payload.name && command.payload.name !== existing.name) {
      const nameConflict = await this.branchRepository.findByName(command.payload.name);
      if (nameConflict && nameConflict.id !== command.id) {
        throw new Error(`Branch with name '${command.payload.name}' already exists`);
      }
    }

    const updated = new Branch({
      ...existing,
      ...command.payload,
    });

    return this.branchRepository.update(updated);
  }
}