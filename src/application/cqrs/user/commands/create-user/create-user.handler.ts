import { BadRequestException, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateUserCommand } from './create-user.command';
import { AuthService } from '../../../../../infrastructure/services/auth.service';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { UserStatus } from '../../../../../domain/entities/enums';
import { CedulaAlreadyExistsException } from '../../../../exceptions/cedula-already-exists.exception';
import { UsernameAlreadyExistsException } from '../../../../exceptions/username-already-exists.exception';
import { EmailAlreadyExistsException } from '../../../../exceptions/email-already-exists.exception';
import { DuplicateUserFieldsException } from '../../../../../domain/exceptions';

export class CreateUserHandler {
  constructor(
    protected readonly authService: AuthService,
    protected readonly userRepository: IUserRepository,
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const roleName = command.payload.role?.trim();
    if (!roleName) {
      throw new BadRequestException('Role is required');
    }

    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new BadRequestException(`Role ${roleName} does not exist`);
    }

    const existingByEmployeeId = await this.userRepository.findByEmployeeId(command.payload.employeeId);
    if (existingByEmployeeId) {
      throw new ConflictException('Employee ID already exists');
    }

    const existingByEmail = await this.userRepository.findByEmail(command.payload.email);
    const duplicateErrors: { email?: string; username?: string; cedula?: string } = {};
    if (existingByEmail) duplicateErrors.email = new EmailAlreadyExistsException(command.payload.email).message;

    const existingByUsername = await this.userRepository.findByUsername(command.payload.username);
    if (existingByUsername) duplicateErrors.username = new UsernameAlreadyExistsException(command.payload.username).message;

    if (command.payload.cedula) {
      const existingByCedula = await this.userRepository.findByCedula(command.payload.cedula);
      if (existingByCedula) duplicateErrors.cedula = new CedulaAlreadyExistsException(command.payload.cedula).message;
    }

    if (Object.keys(duplicateErrors).length > 0) {
      throw new DuplicateUserFieldsException(duplicateErrors);
    }

    const passwordHash = await this.authService.hashPassword(command.payload.password);

    // TODO: inject IUuidGenerator once ports are wired.
    const user = new User({
      id: randomUUID(),
      employeeId: command.payload.employeeId,
      username: command.payload.username,
      email: command.payload.email,
      passwordHash,
      role: role.name,
      firstName: command.payload.firstName,
      lastName: command.payload.lastName,
      cedula: command.payload.cedula,
      status: UserStatus.ACTIVE,
      failedLoginAttempts: 0,
    });

    return this.userRepository.create(user);
  }
}
