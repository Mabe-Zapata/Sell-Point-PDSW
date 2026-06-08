 
 
 
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { RegisterEmployeeCommand } from '../../commands/register-employee/register-employee.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IRoleRepository } from '../../../../../domain/repositories/role.repository.interface';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { EmployeeCredentialsCreatedEvent } from '../../../../../domain/events/employee-credentials-created.event';
import { EmailAlreadyExistsException } from '../../../../exceptions/email-already-exists.exception';
import { UsernameAlreadyExistsException } from '../../../../exceptions/username-already-exists.exception';
import { CedulaAlreadyExistsException } from '../../../../exceptions/cedula-already-exists.exception';
import { DuplicateUserFieldsException } from '../../../../../domain/exceptions';

export class RegisterEmployeeHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly roleRepository: IRoleRepository,
    protected readonly uow: IUnitOfWork,
  ) {}

  async execute(command: RegisterEmployeeCommand): Promise<User> {
    const roleName = command.role?.trim();
    if (!roleName) {
      throw new BadRequestException('Role is required');
    }

    const role = await this.roleRepository.findByName(roleName);
    if (!role) {
      throw new BadRequestException(`Role ${roleName} does not exist`);
    }

    const existingByEmail = await this.userRepository.findByEmail(command.email);
    const duplicateErrors: { email?: string; username?: string; cedula?: string } = {};
    if (existingByEmail) duplicateErrors.email = new EmailAlreadyExistsException(command.email).message;

    if (command.username) {
      const existingByUsername = await this.userRepository.findByUsername(command.username);
      if (existingByUsername) duplicateErrors.username = new UsernameAlreadyExistsException(command.username).message;
    }

    if (command.cedula) {
      const existingByCedula = await this.userRepository.findByCedula(command.cedula);
      if (existingByCedula) duplicateErrors.cedula = new CedulaAlreadyExistsException(command.cedula).message;
    }

    if (Object.keys(duplicateErrors).length > 0) {
      throw new DuplicateUserFieldsException(duplicateErrors);
    }

    // TODO: inject IPasswordHasher/IUuidGenerator once ports are wired.
    const rawPassword = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const employeeId = `EMP-${crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase()}`;
    const username = command.username || command.email;

    const user = User.createNewEmployee({
      id: crypto.randomUUID(),
      employeeId,
      email: command.email,
      passwordHash,
      role: role.name,
      firstName: command.firstName,
      lastName: command.lastName,
      cedula: command.cedula,
      username,
      defaultBranchId: command.defaultBranchId,
    });

    const created = await this.userRepository.create(user);

    this.uow.dispatchEvent(
      new EmployeeCredentialsCreatedEvent(
        created.id,
        created.username,
        created.email,
        rawPassword,
        created.firstName ?? 'Employee',
      ),
    );

    return created;
  }
}
