import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateUserCommand } from './update-user.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { CedulaAlreadyExistsException } from '../../../../exceptions/cedula-already-exists.exception';
import { EmailAlreadyExistsException } from '../../../../exceptions/email-already-exists.exception';
import { DuplicateUserFieldsException } from '../../../../../domain/exceptions';

export class UpdateUserHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly roleRepository: IRoleRepository,
  ) {}

  async execute(command: UpdateUserCommand): Promise<User> {
    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new NotFoundException(`User ${command.userId} not found`);
    }

    if (command.payload.email && command.payload.email !== user.email) {
      const existing = await this.userRepository.findByEmail(command.payload.email);
      if (existing) {
        const duplicateErrors: { email?: string; cedula?: string } = {
          email: new EmailAlreadyExistsException(command.payload.email).message,
        };

        if (command.payload.cedula && command.payload.cedula !== user.cedula) {
          const existingCedula = await this.userRepository.findByCedula(command.payload.cedula);
          if (existingCedula) {
            duplicateErrors.cedula = new CedulaAlreadyExistsException(command.payload.cedula).message;
          }
        }

        throw new DuplicateUserFieldsException(duplicateErrors);
      }
    }

    if (command.payload.cedula && command.payload.cedula !== user.cedula) {
      const existing = await this.userRepository.findByCedula(command.payload.cedula);
      if (existing) {
        throw new CedulaAlreadyExistsException(command.payload.cedula);
      }
    }

    let role = user.role;
    if (command.payload.role !== undefined) {
      const nextRoleName = command.payload.role.trim();
      if (!nextRoleName) {
        throw new BadRequestException('Role cannot be empty');
      }

      const resolvedRole = await this.roleRepository.findByName(nextRoleName);
      if (!resolvedRole) {
        throw new BadRequestException(`Role ${nextRoleName} does not exist`);
      }

      role = resolvedRole.name;
    }

    const updated = new User({
      id: user.id,
      employeeId: user.employeeId,
      username: user.username,
      email: command.payload.email ?? user.email,
      passwordHash: user.passwordHash,
      role,
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
