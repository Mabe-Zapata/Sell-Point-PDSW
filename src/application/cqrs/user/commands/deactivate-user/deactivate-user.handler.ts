import { NotFoundException } from '@nestjs/common';
import { DeactivateUserCommand } from './deactivate-user.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

export class DeactivateUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(command: DeactivateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.deactivate();
    return this.userRepository.update(user);
  }
}
