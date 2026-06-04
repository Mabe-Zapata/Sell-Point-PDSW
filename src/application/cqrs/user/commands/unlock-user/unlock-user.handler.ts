import { NotFoundException } from '@nestjs/common';
import { UnlockUserCommand } from './unlock-user.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';

export class UnlockUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UnlockUserCommand): Promise<void> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    user.unlock();
    await this.userRepository.update(user);
    await this.userRepository.updateFailedLoginAttempts(user.id, 0);
  }
}
