import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { DeactivateUserCommand } from './deactivate-user.command';
import { DeactivateUserValidator } from './deactivate-user.validator';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  constructor(
    private readonly validator: DeactivateUserValidator,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: DeactivateUserCommand): Promise<User> {
    this.validator.validate(command.userId);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.deactivate();
    return this.userRepository.update(user);
  }
}