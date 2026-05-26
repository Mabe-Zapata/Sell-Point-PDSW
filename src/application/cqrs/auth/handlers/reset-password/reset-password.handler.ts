import * as bcrypt from 'bcrypt';
import { ResetPasswordCommand } from '../../commands/reset-password/reset-password.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IPasswordResetTokenRepository } from '../../../../../domain/repositories/password-reset-token.repository.interface';
import { User } from '../../../../../domain/entities/user.entity';
import { PasswordResetToken } from '../../../../../domain/entities/password-reset-token.entity';
import { PasswordChangedEvent } from '../../../../../domain/events/password-changed.event';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

export class ResetPasswordHandler {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly tokenRepository: IPasswordResetTokenRepository,
    protected readonly uow: IUnitOfWork,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ success: boolean }> {
    // Find the token by iterating through available tokens (we need to find by plain token comparison)
    // The repository only supports findByHash which requires the hash, not the plain token
    // So we iterate through tokens to find a match using bcrypt.compare
    const tokensResult = await this.tokenRepository.findAll({ page: 1, limit: 100 }, {});
    
    let resetToken: PasswordResetToken | null = null;
    for (const token of tokensResult.data) {
      const isValidToken = await bcrypt.compare(command.token, token.tokenHash);
      if (isValidToken) {
        resetToken = token;
        break;
      }
    }

    if (!resetToken) {
      throw new Error('Invalid or expired token');
    }

    // Check if token is valid (not expired, not used)
    if (!resetToken.isValid()) {
      throw new Error('Token has expired or already been used');
    }

    // Find the user
    const user = await this.userRepository.findById(resetToken.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Hash the new password
    const newPasswordHash = await bcrypt.hash(command.newPassword, ResetPasswordHandler.SALT_ROUNDS);

    // Validate: new password must not match current or previous password
    if (user.currentPasswordHash) {
      const matchesCurrent = await bcrypt.compare(command.newPassword, user.passwordHash);
      if (matchesCurrent) {
        throw new Error('La nueva contraseña no puede ser igual a la contraseña actual');
      }
      const matchesPrevious = await bcrypt.compare(command.newPassword, user.currentPasswordHash);
      if (matchesPrevious) {
        throw new Error('La nueva contraseña no puede ser igual a la contraseña anterior');
      }
    } else {
      const matchesCurrent = await bcrypt.compare(command.newPassword, user.passwordHash);
      if (matchesCurrent) {
        throw new Error('La nueva contraseña no puede ser igual a la contraseña actual');
      }
    }

    // Update user's password by creating a new User instance with updated hash
    const updatedUser = new User({
      id: user.id,
      employeeId: user.employeeId,
      email: user.email,
      username: user.username,
      passwordHash: newPasswordHash,
      currentPasswordHash: user.passwordHash, // Guardar hash anterior
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
      failedLoginAttempts: 0,
      passwordExpired: false, // Reset password expiry
      createdAt: user.createdAt,
      updatedAt: new Date(),
    });
    await this.userRepository.update(updatedUser);

    // Mark token as used
    await this.tokenRepository.markAsUsed(resetToken.id);

    // Dispatch password changed event to notify user via email
    this.uow.dispatchEvent(
      new PasswordChangedEvent(
        user.id,
        user.email,
        user.firstName ?? 'User',
        new Date(),
      ),
    );

    return { success: true };
  }
}
