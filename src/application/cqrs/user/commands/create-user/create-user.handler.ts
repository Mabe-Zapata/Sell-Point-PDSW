import { ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserCommand } from './create-user.command';
import { AuthService } from '../../../../../infrastructure/services/auth.service';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { UserStatus } from '../../../../../domain/entities/enums';

export class CreateUserHandler {
  constructor(
    protected readonly authService: AuthService,
    protected readonly userRepository: IUserRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const existingByEmployeeId = await this.userRepository.findByEmployeeId(command.payload.employeeId);
    if (existingByEmployeeId) {
      throw new ConflictException('Employee ID already exists');
    }

    const existingByEmail = await this.userRepository.findByEmail(command.payload.email);
    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }

    const existingByUsername = await this.userRepository.findByUsername(command.payload.username);
    if (existingByUsername) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await this.authService.hashPassword(command.payload.password);

    // TODO: inject IUuidGenerator once ports are wired.
    const user = new User({
      id: randomUUID(),
      employeeId: command.payload.employeeId,
      username: command.payload.username,
      email: command.payload.email,
      passwordHash,
      role: command.payload.role,
      firstName: command.payload.firstName,
      lastName: command.payload.lastName,
      cedula: command.payload.cedula,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
    });

    return this.userRepository.create(user);
  }
}
