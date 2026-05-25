import { NotFoundException, ConflictException } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';

export class UpdateUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    if (command.payload.email && command.payload.email !== user.email) {
      const existing = await this.userRepository.findByEmail(command.payload.email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    const updated = new User({
      id: user.id,
      employeeId: user.employeeId,
      username: user.username,
      email: command.payload.email ?? user.email,
      passwordHash: user.passwordHash,
      role: command.payload.role ?? user.role,
      firstName: command.payload.firstName ?? user.firstName,
      lastName: command.payload.lastName ?? user.lastName,
      cedula: command.payload.cedula ?? user.cedula,
      status: user.status,
      failedLoginAttempts: user.failedLoginAttempts,
      createdAt: user.createdAt,
    });

    return this.userRepository.update(updated);
  }
}
