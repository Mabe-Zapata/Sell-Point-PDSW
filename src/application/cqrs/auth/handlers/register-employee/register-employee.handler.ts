/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RegisterEmployeeCommand } from '../../commands/register-employee/register-employee.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { EmployeeCredentialsCreatedEvent } from '../../../../../domain/events/employee-credentials-created.event';
import { EmailAlreadyExistsException } from '../../../../exceptions/email-already-exists.exception';

export class RegisterEmployeeHandler {
  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly uow: IUnitOfWork,
  ) {}

  async execute(command: RegisterEmployeeCommand): Promise<User> {
    const existingByEmail = await this.userRepository.findByEmail(command.email);
    if (existingByEmail) {
      throw new EmailAlreadyExistsException(command.email);
    }

    // TODO: inject IPasswordHasher/IUuidGenerator once ports are wired.
    const rawPassword = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '').substring(0, 8);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const employeeId = `EMP-${Date.now().toString(36).toUpperCase()}`;

    const user = User.createNewEmployee({
      id: randomUUID(),
      employeeId,
      email: command.email,
      passwordHash,
      role: command.role,
      firstName: command.firstName,
      lastName: command.lastName,
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
