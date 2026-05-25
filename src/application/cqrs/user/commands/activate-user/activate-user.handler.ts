import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ActivateUserCommand } from './activate-user.command';
import { ActivateUserValidator } from './activate-user.validator';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    private readonly validator: ActivateUserValidator,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ActivateUserCommand): Promise<User> {
    this.validator.validate(command.userId);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.activate();
    return this.userRepository.update(user);
  }
}