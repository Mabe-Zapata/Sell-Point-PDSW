import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateBranchCommand } from './create-branch.command';
import { CreateBranchValidator } from './create-branch.validator';
import { BRANCH_REPOSITORY } from '../../../../tokens';
import type { IBranchRepository } from '../../../../../domain/repositories';
import { Branch } from '../../../../../domain/entities';

@CommandHandler(CreateBranchCommand)
export class CreateBranchHandler implements ICommandHandler<CreateBranchCommand> {
  constructor(
    private readonly validator: CreateBranchValidator,
    @Inject(BRANCH_REPOSITORY) private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(command: CreateBranchCommand): Promise<Branch> {
    this.validator.validate(command.payload);

    const existing = await this.branchRepository.findByName(command.payload.name);
    if (existing) {
      throw new Error(`Branch with name '${command.payload.name}' already exists`);
    }

    const branch = new Branch({
      name: command.payload.name,
      city: command.payload.city,
      address: command.payload.address,
      phone: command.payload.phone,
      isActive: true,
    });

    return this.branchRepository.create(branch);
  }
}