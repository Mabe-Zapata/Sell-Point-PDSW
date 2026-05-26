import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { RequestPasswordResetCommand } from '../../commands/request-password-reset/request-password-reset.command';
import type { IUserRepository } from '../../../../../domain/repositories/user.repository.interface';
import type { IPasswordResetTokenRepository } from '../../../../../domain/repositories/password-reset-token.repository.interface';
import { PasswordResetToken } from '../../../../../domain/entities/password-reset-token.entity';
import { PasswordResetRequestedEvent } from '../../../../../domain/events/password-reset-requested.event';
import type { IUnitOfWork } from '../../../../unit-of-work/unit-of-work.interface';

export class PasswordResetRateLimitException extends Error {
  constructor(minutesLeft: number) {
    super(`Ya solicitaste un correo de recuperación. Espera ${minutesLeft} minutos antes de solicitar otro.`);
    this.name = 'PasswordResetRateLimitException';
  }
}

export class RequestPasswordResetHandler {
  private static readonly TOKEN_EXPIRY_MINUTES = 15;

  constructor(
    protected readonly userRepository: IUserRepository,
    protected readonly tokenRepository: IPasswordResetTokenRepository,
    protected readonly uow: IUnitOfWork,
    protected readonly configService: ConfigService,
  ) {}

  async execute(command: RequestPasswordResetCommand): Promise<{ success: boolean }> {
    const user = await this.userRepository.findByEmail(command.email);

    if (!user) {
      // Don't reveal if email exists or not for security
      console.info(`[RequestPasswordResetHandler] Password reset requested for unknown email: ${command.email}`);
      return { success: true };
    }

    // Check for existing active token (rate limiting)
    const existingToken = await this.tokenRepository.findActiveByUserId(user.id);
    if (existingToken) {
      const minutesLeft = Math.ceil((existingToken.expiresAt.getTime() - Date.now()) / 60000);
      throw new PasswordResetRateLimitException(minutesLeft);
    }

    // Create new token
    const rawToken = randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
    const tokenHash = await bcrypt.hash(rawToken, 12);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + RequestPasswordResetHandler.TOKEN_EXPIRY_MINUTES);

    const passwordResetToken = new PasswordResetToken({
      id: randomUUID(),
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    await this.tokenRepository.create(passwordResetToken);

    const frontendBaseUrl = this.configService.get<string>('app.frontendBaseUrl') ??
      this.configService.get<string>('app.url') ??
      'http://localhost:3000';
    const resetUrl = `${frontendBaseUrl}/reset-password?token=${rawToken}`;

    this.uow.dispatchEvent(
      new PasswordResetRequestedEvent(
        user.id,
        user.email,
        user.firstName ?? 'User',
        rawToken,
        resetUrl,
        expiresAt,
      ),
    );

    return { success: true };
  }
}
