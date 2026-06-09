import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { ChangePasswordCommand } from '../../commands/change-password/change-password.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { PasswordChangedEvent } from '../../../../../domain/events/password-changed.event';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

export class ChangePasswordHandler {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<User> {
    if (command.newPassword !== command.confirmPassword) {
      throw new BadRequestException('La nueva contraseña y su confirmación no coinciden');
    }

    const user = await this.userRepository.findById(command.userId);
    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const matchesCurrent = await bcrypt.compare(command.currentPassword, user.passwordHash);
    if (!matchesCurrent) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    const matchesNewCurrent = await bcrypt.compare(command.newPassword, user.passwordHash);
    if (matchesNewCurrent) {
      throw new BadRequestException('La nueva contraseña no puede ser igual a la actual');
    }

    if (user.currentPasswordHash) {
      const matchesPrevious = await bcrypt.compare(command.newPassword, user.currentPasswordHash);
      if (matchesPrevious) {
        throw new BadRequestException('La nueva contraseña no puede ser igual a la anterior');
      }
    }

    const newPasswordHash = await bcrypt.hash(command.newPassword, ChangePasswordHandler.SALT_ROUNDS);

    const updatedUser = new User({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      username: user.username,
      passwordHash: newPasswordHash,
      currentPasswordHash: user.passwordHash,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      cedula: user.cedula,
      defaultBranchId: user.defaultBranchId,
      googleId: user.googleId,
      googleEmail: user.googleEmail,
      status: user.status,
      failedLoginAttempts: 0,
      passwordExpired: false,
      createdAt: user.createdAt,
      updatedAt: new Date(),
      deletedAt: user.deletedAt,
    });

    const saved = await this.userRepository.update(updatedUser);

    this.uow.dispatchEvent(
      new PasswordChangedEvent(
        saved.id,
        saved.email,
        saved.firstName ?? 'User',
        new Date(),
        command.ip,
        command.userAgent,
      ),
    );

    return saved;
  }
}
