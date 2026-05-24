import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UnlockUserCommand } from './unlock-user.command';
import { UnlockUserValidator } from './unlock-user.validator';
import { USER_REPOSITORY } from '../../../../tokens';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';

@CommandHandler(UnlockUserCommand)
export class UnlockUserHandler implements ICommandHandler<UnlockUserCommand> {
  constructor(
    private readonly validator: UnlockUserValidator,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UnlockUserCommand): Promise<void> {
    this.validator.validate(command.userId);

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.unlock();
    await this.userRepository.update(user);
  }
}