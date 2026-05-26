import { NotFoundException } from '@nestjs/common';
import { ActivateUserCommand } from './activate-user.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

export class ActivateUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ActivateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.activate();
    return this.userRepository.update(user);
  }
}
